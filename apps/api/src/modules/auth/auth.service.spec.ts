import { AuthService } from './auth.service';
import { MultipleOrganizationsRequiredException } from './exceptions/auth.exceptions';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('AuthService', () => {
  it('login requires organization selection when multiple active memberships exist', async () => {
    const prismaMock = {
      permission: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      role: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      rolePermission: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    } as unknown as PrismaService;

    const usersMock = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 'user_1',
        email: 'user@example.com',
        passwordHash: 'hash',
        globalStatus: 'ACTIVE',
        deletedAt: null,
      }),
    };

    const passwordMock = {
      verifyPassword: jest.fn().mockResolvedValue(true),
    };

    const membershipsMock = {
      findActiveMembershipsForUser: jest.fn().mockResolvedValue([
        {
          id: 'm1',
          organizationId: 'org_1',
          organization: { status: 'ACTIVE', deletedAt: null, slug: 'org-1' },
        },
        {
          id: 'm2',
          organizationId: 'org_2',
          organization: { status: 'ACTIVE', deletedAt: null, slug: 'org-2' },
        },
      ]),
    };

    const svc = new AuthService(
      prismaMock,
      {} as never, // organizations (unused)
      usersMock as never,
      {} as never, // roles (unused)
      membershipsMock as never,
      {} as never, // sessions (unused due to early throw)
      passwordMock as never,
      {} as never, // tokens (unused)
      {} as never, // audit (unused)
    );

    await expect(
      svc.login({
        email: 'user@example.com',
        password: 'StrongPassw0rdAA1!',
      }),
    ).rejects.toBeInstanceOf(MultipleOrganizationsRequiredException);
  });
});
