import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import type { AuditLogService } from '../audit-logs/audit-log.service';
import type { ContactsService } from '../contacts/contacts.service';
import { TemplateRendererService } from './template-renderer.service';
import { TemplateVariableService } from './template-variable.service';
import type { TemplatesRepository } from './templates.repository';
import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  const principal: AuthPrincipal = {
    userId: 'u1',
    sessionId: 's1',
    organizationId: 'org_1',
    membershipId: 'm1',
    roleCode: 'org_owner',
    roleScope: 'ORGANIZATION',
    permissions: [],
  };

  it('renders stored template with contact merge fields', async () => {
    const repoMock = {
      findById: jest.fn().mockResolvedValue({
        id: 't1',
        organizationId: 'org_1',
        createdByUserId: 'u1',
        name: 'T1',
        description: null,
        body: 'Hi {{FirstName}}',
        channelType: 'SMS',
        isArchived: false,
        metadata: null,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      }),
    } as unknown as TemplatesRepository;

    const contactsMock = {
      getContactMergeFields: jest.fn().mockResolvedValue({ FirstName: 'Jane' }),
    } as unknown as ContactsService;

    const auditMock = {
      emit: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditLogService;

    const svc = new TemplatesService(
      repoMock,
      new TemplateRendererService(new TemplateVariableService()),
      new TemplateVariableService(),
      contactsMock,
      auditMock,
    );

    const out = await svc.renderStoredPreview(principal, 't1', {
      contactId: 'c1',
      missingVariableStrategy: 'strict',
    });

    expect(out.renderedText).toBe('Hi Jane');
  });
});
