import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuditLogService } from '../audit-logs/audit-log.service';
import { ContactsNormalizationService } from './contacts-normalization.service';
import type { ContactsRepository } from './contacts.repository';
import { ContactsService } from './contacts.service';

describe('ContactsService', () => {
  const principal: AuthPrincipal = {
    userId: 'u1',
    sessionId: 's1',
    organizationId: 'org_1',
    membershipId: 'm1',
    roleCode: 'org_owner',
    roleScope: 'ORGANIZATION',
    permissions: [],
  };

  const baseContact = {
    id: 'c1',
    organizationId: 'org_1',
    createdByUserId: 'u1',
    firstName: 'Jane',
    lastName: 'Doe',
    fullName: 'Jane Doe',
    phoneNumber: '+15551002000',
    normalizedPhoneNumber: '+15551002000',
    email: 'jane@example.com',
    status: 'ACTIVE' as const,
    source: 'MANUAL' as const,
    notes: null,
    metadata: null,
    lastContactedAt: null,
    optedOutAt: null,
    blockedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    customFieldValues: [],
  };

  it('optOut sets status OPTED_OUT', async () => {
    const repoMock = {
      findContactById: jest.fn().mockResolvedValue(baseContact),
      updateContact: jest.fn().mockResolvedValue({
        ...baseContact,
        status: 'OPTED_OUT',
        optedOutAt: new Date(),
      }),
    } as unknown as ContactsRepository;

    const prismaMock = {} as PrismaService;
    const auditMock = {
      emit: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditLogService;

    const svc = new ContactsService(
      prismaMock,
      repoMock,
      new ContactsNormalizationService(),
      auditMock,
    );
    const out = await svc.optOut(principal, 'c1');
    expect(out.status).toBe('OPTED_OUT');
  });

  it('unblock restores ACTIVE for blocked contact', async () => {
    const repoMock = {
      findContactById: jest.fn().mockResolvedValue({
        ...baseContact,
        status: 'BLOCKED',
      }),
      updateContact: jest.fn().mockResolvedValue({
        ...baseContact,
        status: 'ACTIVE',
        blockedAt: null,
      }),
    } as unknown as ContactsRepository;

    const prismaMock = {} as PrismaService;
    const auditMock = {
      emit: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditLogService;
    const svc = new ContactsService(
      prismaMock,
      repoMock,
      new ContactsNormalizationService(),
      auditMock,
    );
    const out = await svc.unblock(principal, 'c1');
    expect(out.status).toBe('ACTIVE');
  });
});
