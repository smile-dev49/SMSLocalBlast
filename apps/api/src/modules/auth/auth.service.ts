import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { AuditAction } from '@prisma/client';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { PasswordService } from './password/password.service';
import { TokenService } from './token/token.service';
import { bootstrapDefaultRbac } from './rbac/bootstrap-default-rbac';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { getRequestContext } from '../../infrastructure/request-context/request-context.storage';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { MembershipsService } from '../organizations/memberships.service';
import { SessionsService, type SafeSession } from '../sessions/sessions.service';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import type { RegisterBody } from './dto/register.schema';
import type { LoginBody } from './dto/login.schema';
import type { MeResponse } from './types/me-response.types';
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  MembershipInactiveException,
  MultipleOrganizationsRequiredException,
  OrganizationSlugAlreadyExistsException,
  SessionNotFoundException,
  SessionAccessDeniedException,
} from './exceptions/auth.exceptions';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
    private readonly users: UsersService,
    private readonly roles: RolesService,
    private readonly memberships: MembershipsService,
    private readonly sessions: SessionsService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuditLogService,
  ) {}

  async register(input: RegisterBody): Promise<{
    readonly accessToken: string;
    readonly refreshToken: string;
  }> {
    await bootstrapDefaultRbac(this.prisma);

    const email = normalizeEmail(input.email);
    const orgSlug = normalizeSlug(input.organizationSlug);

    const [existingUser, existingOrg] = await Promise.all([
      this.users.findByEmail(email),
      this.organizations.findBySlug(orgSlug),
    ]);

    if (existingUser) throw new EmailAlreadyExistsException();
    if (existingOrg) throw new OrganizationSlugAlreadyExistsException();

    const ownerRole = await this.roles.findByCode('org_owner');
    if (!ownerRole) {
      // Seed bootstrap should make this deterministic; if it doesn't, fail loudly.
      throw new Error('Missing org_owner role; ensure RBAC seed ran');
    }

    const reqCtx = getRequestContext();
    const now = new Date();
    const sessionId = uuidv4();

    const out = await this.prisma.$transaction(async (tx) => {
      const passwordHash = await this.password.hashPassword(input.password);

      const user = await this.users.createUser(
        {
          email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
        },
        tx,
      );

      const organization = await this.organizations.createOrganization(
        {
          name: input.organizationName,
          slug: orgSlug,
        },
        tx,
      );

      const membership = await this.memberships.createMembership(
        {
          userId: user.id,
          organizationId: organization.id,
          roleId: ownerRole.id,
        },
        tx,
      );

      const refreshClaims = {
        sub: user.id,
        email: user.email,
        sessionId,
        organizationId: organization.id,
        membershipId: membership.id,
        roleCode: ownerRole.code,
        roleScope: ownerRole.scope,
      };

      const refreshToken = await this.tokens.signRefreshToken(refreshClaims);
      const refreshTokenHash = this.tokens.hashRefreshToken(refreshToken);
      const expiresAt = this.tokens.getRefreshExpiresAt(now);

      await this.sessions.createSession(
        {
          id: sessionId,
          userId: user.id,
          organizationId: organization.id,
          refreshTokenHash,
          userAgent: reqCtx?.userAgent ?? null,
          ipAddress: reqCtx?.ip ?? null,
          deviceFingerprint: null,
          expiresAt,
        },
        tx,
      );

      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: now },
      });

      const accessToken = await this.tokens.signAccessToken(refreshClaims);

      return {
        accessToken,
        refreshToken,
        userId: user.id,
        organizationId: organization.id,
      };
    });

    await this.emitAudit('AUTH_REGISTER' as AuditAction, out.userId, {
      sessionId,
      organizationId: out.organizationId,
    });

    return { accessToken: out.accessToken, refreshToken: out.refreshToken };
  }

  async login(input: LoginBody): Promise<{
    readonly accessToken: string;
    readonly refreshToken: string;
  }> {
    await bootstrapDefaultRbac(this.prisma);

    const email = normalizeEmail(input.email);
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsException();
    }
    if (user.deletedAt !== null || user.globalStatus !== 'ACTIVE') {
      throw new InvalidCredentialsException();
    }

    const ok = await this.password.verifyPassword(user.passwordHash, input.password);
    if (!ok) throw new InvalidCredentialsException();

    const reqCtx = getRequestContext();
    const now = new Date();
    const sessionId = uuidv4();

    const memberships = await this.memberships.findActiveMembershipsForUser(user.id);

    const active = memberships.filter(
      (m) => m.organization.status === 'ACTIVE' && m.organization.deletedAt === null,
    );

    let selectedMembership: (typeof active)[number] | null = null;
    if (input.organizationSlug) {
      const orgSlug = normalizeSlug(input.organizationSlug);
      selectedMembership = active.find((m) => m.organization.slug === orgSlug) ?? null;
      if (!selectedMembership) throw new MembershipInactiveException();
    } else {
      if (active.length === 0) throw new MembershipInactiveException();
      if (active.length > 1) throw new MultipleOrganizationsRequiredException();
      selectedMembership = active[0] ?? null;
    }

    if (!selectedMembership) throw new MembershipInactiveException();

    const organizationId = selectedMembership.organizationId;
    const membershipId = selectedMembership.id;
    const roleCode = selectedMembership.role.code;
    const roleScope = selectedMembership.role.scope;

    const refreshClaims = {
      sub: user.id,
      email: user.email,
      sessionId,
      organizationId,
      membershipId,
      roleCode,
      roleScope,
    };

    const accessAndRefresh = await this.prisma.$transaction(async (tx) => {
      const refreshToken = await this.tokens.signRefreshToken(refreshClaims);
      const refreshTokenHash = this.tokens.hashRefreshToken(refreshToken);
      const expiresAt = this.tokens.getRefreshExpiresAt(now);

      await this.sessions.createSession(
        {
          id: sessionId,
          userId: user.id,
          organizationId,
          refreshTokenHash,
          userAgent: reqCtx?.userAgent ?? null,
          ipAddress: reqCtx?.ip ?? null,
          deviceFingerprint: input.deviceFingerprint ?? null,
          expiresAt,
        },
        tx,
      );

      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: now },
      });

      const accessToken = await this.tokens.signAccessToken(refreshClaims);
      return { accessToken, refreshToken };
    });

    // Audit happens outside the transaction.
    await this.emitAudit('AUTH_LOGIN' as AuditAction, user.id, {
      sessionId,
      organizationId: selectedMembership.organizationId,
    });

    return accessAndRefresh;
  }

  async refresh(refreshToken: string): Promise<{
    readonly accessToken: string;
    readonly refreshToken: string;
  }> {
    const claims = await this.tokens.verifyRefreshToken(refreshToken);
    const session = await this.sessions.getSessionForRefresh(claims.sessionId);

    if (!session || session.isRevoked || session.expiresAt <= new Date()) {
      throw new SessionNotFoundException();
    }

    if (session.userId !== claims.sub) throw new SessionAccessDeniedException();

    const expectedHash = this.tokens.hashRefreshToken(refreshToken);
    if (expectedHash !== session.refreshTokenHash) {
      throw new SessionAccessDeniedException();
    }

    if (!claims.organizationId || !claims.membershipId) {
      throw new MembershipInactiveException();
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        id: claims.membershipId,
        userId: claims.sub,
        organizationId: claims.organizationId,
        status: 'ACTIVE',
        organization: { status: 'ACTIVE', deletedAt: null },
      },
      include: {
        role: true,
        organization: true,
      },
    });

    if (!membership) throw new MembershipInactiveException();

    const user = await this.prisma.user.findUnique({
      where: { id: claims.sub },
      select: { id: true, email: true, globalStatus: true, deletedAt: true },
    });
    if (!user) {
      throw new MembershipInactiveException();
    }
    if (user.deletedAt !== null || user.globalStatus !== 'ACTIVE') {
      throw new MembershipInactiveException();
    }

    const now = new Date();
    const refreshClaims = {
      sub: user.id,
      email: user.email,
      sessionId: session.id,
      organizationId: membership.organizationId,
      membershipId: membership.id,
      roleCode: membership.role.code,
      roleScope: membership.role.scope,
    };

    const rotated = await this.prisma.$transaction(async (tx) => {
      const newRefreshToken = await this.tokens.signRefreshToken(refreshClaims);
      const newRefreshTokenHash = this.tokens.hashRefreshToken(newRefreshToken);
      const newExpiresAt = this.tokens.getRefreshExpiresAt(now);

      await tx.session.update({
        where: { id: session.id },
        data: {
          refreshTokenHash: newRefreshTokenHash,
          expiresAt: newExpiresAt,
          lastUsedAt: now,
        },
      });

      const newAccessToken = await this.tokens.signAccessToken(refreshClaims);
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    });

    await this.emitAudit('AUTH_REFRESH' as AuditAction, claims.sub, {
      sessionId: claims.sessionId,
      organizationId: claims.organizationId,
    });

    return rotated;
  }

  async logout(principal: AuthPrincipal): Promise<void> {
    const revoked = await this.sessions.revokeSession({
      sessionId: principal.sessionId,
      userId: principal.userId,
    });
    if (!revoked) throw new SessionNotFoundException();

    const action: AuditAction = 'AUTH_LOGOUT';
    const reqCtx = getRequestContext();
    await this.audit.emit({
      action,
      entityType: 'session',
      entityId: revoked.id,
      ...(revoked.organizationId !== null ? { organizationId: revoked.organizationId } : {}),
      actorUserId: principal.userId,
      ...(reqCtx?.requestId ? { requestId: reqCtx.requestId } : {}),
      ...(reqCtx?.ip ? { ipAddress: reqCtx.ip } : {}),
      ...(reqCtx?.userAgent ? { userAgent: reqCtx.userAgent } : {}),
      metadata: {},
    });

    await this.audit.emit({
      action: 'SESSION_REVOKED',
      entityType: 'session',
      entityId: revoked.id,
      ...(revoked.organizationId !== null ? { organizationId: revoked.organizationId } : {}),
      actorUserId: principal.userId,
      ...(reqCtx?.requestId ? { requestId: reqCtx.requestId } : {}),
      ...(reqCtx?.ip ? { ipAddress: reqCtx.ip } : {}),
      ...(reqCtx?.userAgent ? { userAgent: reqCtx.userAgent } : {}),
      metadata: {},
    });
  }

  async logoutAll(
    principal: AuthPrincipal,
  ): Promise<{ readonly keptSessionId: string; readonly revokedSessionIds: string[] }> {
    const revoked = await this.sessions.revokeAllOtherSessions(
      principal.userId,
      principal.sessionId,
    );

    const reqCtx = getRequestContext();
    await this.audit.emit({
      action: 'AUTH_LOGOUT_ALL',
      entityType: 'user',
      entityId: principal.userId,
      ...(principal.organizationId !== null ? { organizationId: principal.organizationId } : {}),
      actorUserId: principal.userId,
      ...(reqCtx?.requestId ? { requestId: reqCtx.requestId } : {}),
      ...(reqCtx?.ip ? { ipAddress: reqCtx.ip } : {}),
      ...(reqCtx?.userAgent ? { userAgent: reqCtx.userAgent } : {}),
      metadata: { keptSessionId: principal.sessionId },
    });

    for (const s of revoked) {
      await this.audit.emit({
        action: 'SESSION_REVOKED',
        entityType: 'session',
        entityId: s.id,
        ...(s.organizationId !== null ? { organizationId: s.organizationId } : {}),
        actorUserId: principal.userId,
        ...(reqCtx?.requestId ? { requestId: reqCtx.requestId } : {}),
        ...(reqCtx?.ip ? { ipAddress: reqCtx.ip } : {}),
        ...(reqCtx?.userAgent ? { userAgent: reqCtx.userAgent } : {}),
        metadata: {},
      });
    }

    return { keptSessionId: principal.sessionId, revokedSessionIds: revoked.map((s) => s.id) };
  }

  async me(principal: AuthPrincipal): Promise<MeResponse> {
    if (!principal.membershipId) throw new MembershipInactiveException();

    const membership = await this.prisma.membership.findUnique({
      where: { id: principal.membershipId },
      include: {
        role: true,
        organization: true,
      },
    });

    if (membership?.status !== 'ACTIVE') {
      throw new MembershipInactiveException();
    }

    const user = await this.prisma.user.findUnique({
      where: { id: principal.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        globalStatus: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) throw new SessionNotFoundException();

    return {
      user,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        status: membership.organization.status,
      },
      membership: {
        id: membership.id,
        status: membership.status,
        joinedAt: membership.joinedAt,
      },
      role: {
        id: membership.role.id,
        name: membership.role.name,
        code: membership.role.code,
        scope: membership.role.scope,
        isSystemRole: membership.role.isSystemRole,
      },
      permissions: principal.permissions.slice(),
    };
  }

  async listSessions(principal: AuthPrincipal): Promise<{
    readonly sessions: SafeSession[];
  }> {
    const sessions = await this.sessions.listSessionsByUser(principal.userId, { limit: 50 });
    return { sessions };
  }

  async revokeSession(principal: AuthPrincipal, sessionId: string): Promise<void> {
    const revoked = await this.sessions.revokeSession({ userId: principal.userId, sessionId });
    if (!revoked) throw new SessionAccessDeniedException();

    const reqCtx = getRequestContext();
    await this.audit.emit({
      action: 'SESSION_REVOKED',
      entityType: 'session',
      entityId: revoked.id,
      ...(revoked.organizationId !== null ? { organizationId: revoked.organizationId } : {}),
      actorUserId: principal.userId,
      ...(reqCtx?.requestId ? { requestId: reqCtx.requestId } : {}),
      ...(reqCtx?.ip ? { ipAddress: reqCtx.ip } : {}),
      ...(reqCtx?.userAgent ? { userAgent: reqCtx.userAgent } : {}),
      metadata: {},
    });
  }

  private async emitAudit(
    action: AuditAction,
    actorUserId: string,
    input: { sessionId: string; organizationId: string | null },
  ): Promise<void> {
    const reqCtx = getRequestContext();

    await this.audit.emit({
      action,
      entityType: 'session',
      entityId: input.sessionId,
      ...(input.organizationId !== null ? { organizationId: input.organizationId } : {}),
      actorUserId,
      ...(reqCtx?.requestId ? { requestId: reqCtx.requestId } : {}),
      ...(reqCtx?.ip ? { ipAddress: reqCtx.ip } : {}),
      ...(reqCtx?.userAgent ? { userAgent: reqCtx.userAgent } : {}),
      metadata: {},
    });
  }
}
