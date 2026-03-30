import { SessionsService } from './sessions.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('SessionsService', () => {
  it('revokeSession returns null when session not found', async () => {
    const prismaMock = {
      session: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const svc = new SessionsService(prismaMock);
    const out = await svc.revokeSession({ sessionId: 's1', userId: 'u1' });
    expect(out).toBeNull();
  });

  it('revokeSession revokes an active session owned by the user', async () => {
    const prismaMock = {
      session: {
        findUnique: jest.fn().mockResolvedValue({
          id: 's1',
          userId: 'u1',
          organizationId: 'org_1',
          userAgent: null,
          ipAddress: null,
          deviceFingerprint: null,
          isRevoked: false,
          revokedAt: null,
          expiresAt: new Date(),
          lastUsedAt: null,
          createdAt: new Date(),
        }),
        update: jest.fn().mockResolvedValue({
          id: 's1',
          userId: 'u1',
          organizationId: 'org_1',
          userAgent: null,
          ipAddress: null,
          deviceFingerprint: null,
          isRevoked: true,
          revokedAt: new Date(),
          expiresAt: new Date(),
          lastUsedAt: null,
          createdAt: new Date(),
        }),
      },
    } as unknown as PrismaService;

    const svc = new SessionsService(prismaMock);
    const out = await svc.revokeSession({ sessionId: 's1', userId: 'u1' });
    expect(out?.id).toBe('s1');
    expect(out?.isRevoked).toBe(true);
  });
});
