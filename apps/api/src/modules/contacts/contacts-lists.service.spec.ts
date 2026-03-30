import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuditLogService } from '../audit-logs/audit-log.service';
import type { ContactsRepository } from './contacts.repository';
import { ContactsListsService } from './contacts-lists.service';

describe('ContactsListsService', () => {
  const principal: AuthPrincipal = {
    userId: 'u1',
    sessionId: 's1',
    organizationId: 'org_1',
    membershipId: 'm1',
    roleCode: 'org_owner',
    roleScope: 'ORGANIZATION',
    permissions: [],
  };

  it('addContacts creates unique memberships', async () => {
    const repoMock = {
      findContactListById: jest.fn().mockResolvedValue({
        id: 'l1',
        organizationId: 'org_1',
        createdByUserId: 'u1',
        name: 'VIP',
        description: null,
        color: null,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    } as unknown as ContactsRepository;

    const prismaMock = {
      contact: {
        findMany: jest.fn().mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]),
      },
      contactListMembership: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    } as unknown as PrismaService;

    const auditMock = {
      emit: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditLogService;
    const svc = new ContactsListsService(prismaMock, repoMock, auditMock);
    const out = await svc.addContacts(principal, 'l1', { contactIds: ['c1', 'c2'] });
    expect(out.added).toBe(2);
  });
});
