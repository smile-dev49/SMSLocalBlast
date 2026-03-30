import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuditLogService } from '../audit-logs/audit-log.service';
import { ContactsImportService } from './contacts-import.service';
import { ContactsNormalizationService } from './contacts-normalization.service';

describe('ContactsImportService', () => {
  const principal: AuthPrincipal = {
    userId: 'u1',
    sessionId: 's1',
    organizationId: 'org_1',
    membershipId: 'm1',
    roleCode: 'org_owner',
    roleScope: 'ORGANIZATION',
    permissions: [],
  };

  it('preview reports duplicates and existing matches', async () => {
    const prismaMock = {
      contact: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'c_existing', normalizedPhoneNumber: '+15551002000' }]),
      },
    } as unknown as PrismaService;

    const auditMock = {
      emit: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditLogService;

    const svc = new ContactsImportService(
      prismaMock,
      new ContactsNormalizationService(),
      auditMock,
    );

    const preview = await svc.previewImport(principal, {
      sourceType: 'CSV_IMPORT',
      rows: [
        { Phone: '+1 (555) 100-2000', First: 'Jane' },
        { Phone: '+1 555 100 2000', First: 'Duplicate' },
        { Phone: 'bad', First: 'Bad' },
      ],
      mapping: {
        firstName: 'First',
        phoneNumber: 'Phone',
      },
      options: {
        deduplicateByPhone: true,
        skipInvalidRows: true,
        updateExisting: false,
      },
    });

    expect(preview.totalRows).toBe(3);
    expect(preview.validRows).toBe(2);
    expect(preview.invalidRows).toBe(1);
    expect(preview.duplicateRows).toBe(1);
    expect(preview.existingMatches).toBe(1);
  });
});
