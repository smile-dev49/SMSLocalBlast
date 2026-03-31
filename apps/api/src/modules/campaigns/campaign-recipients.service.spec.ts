import { Test, type TestingModule } from '@nestjs/testing';
import type { ContactRow } from '../contacts/contacts.repository';
import { ContactsService } from '../contacts/contacts.service';
import { TemplateRendererService } from '../templates/template-renderer.service';
import { TemplateVariableService } from '../templates/template-variable.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ContactsRepository } from '../contacts/contacts.repository';
import { TemplatesRepository } from '../templates/templates.repository';
import { CampaignRecipientsService } from './campaign-recipients.service';
import { CampaignsRepository } from './campaigns.repository';

function mockContact(overrides: Partial<ContactRow> = {}): ContactRow {
  return {
    id: 'c1',
    organizationId: 'org1',
    createdByUserId: null,
    firstName: 'A',
    lastName: 'B',
    fullName: null,
    phoneNumber: '+15550001111',
    normalizedPhoneNumber: '15550001111',
    email: null,
    status: 'ACTIVE',
    source: 'MANUAL',
    notes: null,
    metadata: null,
    lastContactedAt: null,
    optedOutAt: null,
    blockedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    customFieldValues: [],
    ...overrides,
  };
}

describe('CampaignRecipientsService', () => {
  let service: CampaignRecipientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignRecipientsService,
        TemplateRendererService,
        TemplateVariableService,
        { provide: PrismaService, useValue: { $transaction: jest.fn() } },
        {
          provide: ContactsRepository,
          useValue: {
            findContactListsByIdsForOrg: jest.fn(),
            listMembershipPairsForLists: jest.fn(),
            findContactsByIdsForOrg: jest.fn(),
          },
        },
        {
          provide: ContactsService,
          useValue: { mergeFieldsFromContactRow: jest.fn(() => ({})) },
        },
        { provide: TemplatesRepository, useValue: {} },
        {
          provide: CampaignsRepository,
          useValue: { refreshRecipientAggregates: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(CampaignRecipientsService);
  });

  it('classifies blocked/opted-out/archived as skipped', () => {
    expect(service.classifyContact(mockContact({ status: 'BLOCKED' })).status).toBe('SKIPPED');
    expect(service.classifyContact(mockContact({ status: 'OPTED_OUT' })).status).toBe('SKIPPED');
    expect(service.classifyContact(mockContact({ status: 'ARCHIVED' })).status).toBe('SKIPPED');
    expect(service.classifyContact(mockContact({ status: 'ACTIVE' })).status).toBe('READY');
  });

  it('renders snapshot with empty strategy when template exists', () => {
    const out = service.renderForSnapshot({
      templateBody: 'Hi {{Name}}',
      mergeFields: {},
      strategy: 'empty',
    });
    expect(out.renderedBody).toBe('Hi ');
    expect(out.skipReason).toBeNull();
  });
});
