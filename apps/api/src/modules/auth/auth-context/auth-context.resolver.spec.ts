import { AuthContextResolver } from './auth-context.resolver';
import type { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { JwtAccessClaims } from '../../../common/types/jwt-payload.types';

describe('AuthContextResolver', () => {
  it('resolves principal permissions from membership + role permissions', async () => {
    const now = new Date();

    const prismaMock = {
      session: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'session_1',
          userId: 'user_1',
          organizationId: 'org_1',
          isRevoked: false,
          revokedAt: null,
          expiresAt: new Date(now.getTime() + 60_000),
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user_1',
          email: 'user@example.com',
          globalStatus: 'ACTIVE',
          deletedAt: null,
        }),
      },
      membership: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'membership_1',
          organizationId: 'org_1',
          roleId: 'role_1',
          status: 'ACTIVE',
          organization: { id: 'org_1', status: 'ACTIVE', deletedAt: null },
          role: { id: 'role_1', code: 'org_owner', scope: 'ORGANIZATION' },
        }),
      },
      rolePermission: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { permission: { code: 'auth.me.read' } },
            { permission: { code: 'auth.sessions.read' } },
          ]),
      },
    } as unknown as PrismaService;

    const resolver = new AuthContextResolver(prismaMock);

    const claims: JwtAccessClaims = {
      sub: 'user_1',
      email: 'user@example.com',
      sessionId: 'session_1',
      organizationId: 'org_1',
      membershipId: 'membership_1',
      roleCode: 'org_owner',
      roleScope: 'ORGANIZATION',
    };

    const principal = await resolver.resolveFromAccessClaims(claims);
    expect(principal.userId).toBe('user_1');
    expect(principal.sessionId).toBe('session_1');
    expect(principal.membershipId).toBe('membership_1');
    expect(principal.organizationId).toBe('org_1');
    expect(principal.roleCode).toBe('org_owner');
    expect(principal.permissions).toEqual(['auth.me.read', 'auth.sessions.read']);
  });
});
