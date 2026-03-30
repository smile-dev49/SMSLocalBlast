import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMembership(
    input: {
      userId: string;
      organizationId: string;
      roleId: string;
      invitedByUserId?: string | null;
    },
    tx?: PrismaClientLike,
  ) {
    const client: PrismaClientLike = tx ?? this.prisma;
    return client.membership.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        roleId: input.roleId,
        invitedByUserId: input.invitedByUserId ?? null,
      },
    });
  }

  async findActiveMembershipsForUser(userId: string, tx?: PrismaClientLike) {
    const client: PrismaClientLike = tx ?? this.prisma;
    return client.membership.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        role: true,
        organization: true,
      },
    });
  }

  async findActiveMembershipForUserInOrganization(
    userId: string,
    organizationId: string,
    tx?: PrismaClientLike,
  ) {
    const client: PrismaClientLike = tx ?? this.prisma;
    return client.membership.findFirst({
      where: {
        userId,
        organizationId,
        status: 'ACTIVE',
      },
      include: {
        role: true,
        organization: true,
      },
    });
  }
}
