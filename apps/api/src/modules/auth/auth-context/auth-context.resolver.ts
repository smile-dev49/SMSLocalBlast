import { Injectable } from '@nestjs/common';
import type { AuthPrincipal } from '../../../common/types/auth-principal.types';
import type { JwtAccessClaims } from '../../../common/types/jwt-payload.types';
import {
  MembershipInactiveException,
  SessionNotFoundException,
} from '../exceptions/auth.exceptions';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AuthContextResolver {
  constructor(private readonly prisma: PrismaService) {}

  async resolveFromAccessClaims(claims: JwtAccessClaims): Promise<AuthPrincipal> {
    const now = new Date();

    const session = await this.prisma.session.findUnique({
      where: { id: claims.sessionId },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        isRevoked: true,
        expiresAt: true,
      },
    });

    if (!session || session.isRevoked || session.expiresAt <= now) {
      throw new SessionNotFoundException();
    }

    if (session.userId !== claims.sub) {
      throw new SessionNotFoundException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        globalStatus: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new SessionNotFoundException();
    }
    if (user.deletedAt !== null || user.globalStatus !== 'ACTIVE') {
      throw new SessionNotFoundException();
    }

    if (!claims.organizationId) {
      throw new MembershipInactiveException();
    }

    const membershipId = claims.membershipId;
    const membership = membershipId
      ? await this.prisma.membership.findFirst({
          where: {
            id: membershipId,
            userId: user.id,
            organizationId: claims.organizationId,
          },
          select: {
            id: true,
            organizationId: true,
            roleId: true,
            status: true,
            organization: { select: { id: true, status: true, deletedAt: true } },
            role: { select: { id: true, code: true, scope: true } },
          },
        })
      : await this.prisma.membership.findFirst({
          where: {
            userId: user.id,
            organizationId: claims.organizationId,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            organizationId: true,
            roleId: true,
            status: true,
            organization: { select: { id: true, status: true, deletedAt: true } },
            role: { select: { id: true, code: true, scope: true } },
          },
        });

    if (membership?.status !== 'ACTIVE') {
      throw new MembershipInactiveException();
    }

    if (membership.organization.deletedAt !== null || membership.organization.status !== 'ACTIVE') {
      throw new MembershipInactiveException();
    }

    if (!session.organizationId || session.organizationId !== claims.organizationId) {
      throw new MembershipInactiveException();
    }

    const role = membership.role;
    const permissionRows = await this.prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permission: { select: { code: true } } },
    });

    const permissions = permissionRows.map((r) => r.permission.code);

    return {
      userId: user.id,
      sessionId: session.id,
      organizationId: membership.organizationId,
      membershipId: membership.id,
      roleCode: role.code,
      roleScope: role.scope,
      permissions,
    };
  }
}
