import { Injectable } from '@nestjs/common';
import type { CampaignRecipientSourceType, CampaignRecipientStatus, Prisma } from '@prisma/client';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MembershipInactiveException } from '../auth/exceptions/auth.exceptions';
import { ContactsRepository, type ContactRow } from '../contacts/contacts.repository';
import { ContactsService } from '../contacts/contacts.service';
import { TemplateRendererService } from '../templates/template-renderer.service';
import { TemplateVariableService } from '../templates/template-variable.service';
import { TemplateValidationException } from '../templates/exceptions/templates.exceptions';
import { TemplatesRepository } from '../templates/templates.repository';
import {
  CampaignTargetNotFoundException,
  CampaignValidationException,
} from './exceptions/campaigns.exceptions';
import type { TargetResolutionRow } from './types/campaign.types';
import { CampaignsRepository } from './campaigns.repository';

const SKIP_BLOCKED = 'CONTACT_BLOCKED';
const SKIP_OPTED_OUT = 'CONTACT_OPTED_OUT';
const SKIP_ARCHIVED = 'CONTACT_ARCHIVED';
const SKIP_STRICT_TEMPLATE = 'TEMPLATE_STRICT_MISSING_VARIABLES';

@Injectable()
export class CampaignRecipientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contactsRepo: ContactsRepository,
    private readonly contactsService: ContactsService,
    private readonly templatesRepo: TemplatesRepository,
    private readonly variableService: TemplateVariableService,
    private readonly renderer: TemplateRendererService,
    private readonly campaignsRepo: CampaignsRepository,
  ) {}

  private orgId(principal: AuthPrincipal): string {
    if (!principal.organizationId) throw new MembershipInactiveException();
    return principal.organizationId;
  }

  private resolvedContactName(row: ContactRow): string {
    const parts = [row.firstName, row.lastName].filter(Boolean).join(' ').trim();
    if (parts.length > 0) return parts;
    if (row.fullName) return row.fullName;
    return row.phoneNumber;
  }

  async resolveTargetContacts(args: {
    readonly principal: AuthPrincipal;
    readonly contactIds: readonly string[];
    readonly contactListIds: readonly string[];
  }): Promise<readonly TargetResolutionRow[]> {
    const organizationId = this.orgId(args.principal);
    const directSet = new Set(args.contactIds);

    if (args.contactIds.length === 0 && args.contactListIds.length === 0) {
      throw new CampaignValidationException('Select at least one contact or contact list');
    }

    const lists = await this.contactsRepo.findContactListsByIdsForOrg({
      organizationId,
      ids: args.contactListIds,
    });
    if (lists.length !== args.contactListIds.length) {
      throw new CampaignTargetNotFoundException('One or more contact lists were not found');
    }
    for (const list of lists) {
      if (list.isArchived) {
        throw new CampaignValidationException(
          `Contact list "${list.name}" is archived and cannot be targeted`,
        );
      }
    }

    const pairs = await this.contactsRepo.listMembershipPairsForLists({
      organizationId,
      listIds: args.contactListIds,
    });
    const listIdsByContact = new Map<string, string[]>();
    for (const p of pairs) {
      const existing = listIdsByContact.get(p.contactId) ?? [];
      existing.push(p.contactListId);
      listIdsByContact.set(p.contactId, existing);
    }
    const fromLists = [...new Set(pairs.map((p) => p.contactId))];
    const allIds = [...new Set([...args.contactIds, ...fromLists])];

    if (allIds.length === 0) {
      throw new CampaignValidationException('No recipients resolved from the selected lists');
    }

    const contacts = await this.contactsRepo.findContactsByIdsForOrg({
      organizationId,
      ids: allIds,
    });
    const byId = new Map(contacts.map((c) => [c.id, c]));

    for (const id of args.contactIds) {
      if (!byId.has(id)) {
        throw new CampaignTargetNotFoundException(`Contact not found: ${id}`);
      }
    }

    const sorted = [...contacts].sort((a, b) => a.id.localeCompare(b.id));
    const seenPhones = new Set<string>();
    const deduped: ContactRow[] = [];
    for (const c of sorted) {
      if (seenPhones.has(c.normalizedPhoneNumber)) continue;
      seenPhones.add(c.normalizedPhoneNumber);
      deduped.push(c);
    }

    return deduped.map((contact) => {
      const sourceType: CampaignRecipientSourceType = directSet.has(contact.id)
        ? 'DIRECT_CONTACT'
        : 'CONTACT_LIST';
      const refs = listIdsByContact.get(contact.id) ?? [];
      const sourceRefId =
        sourceType === 'CONTACT_LIST' && refs.length > 0
          ? ([...refs].sort((a, b) => a.localeCompare(b))[0] ?? null)
          : null;
      return { contact, sourceType, sourceRefId };
    });
  }

  classifyContact(contact: ContactRow): {
    readonly status: CampaignRecipientStatus;
    readonly skipReason: string | null;
  } {
    if (contact.status === 'BLOCKED') {
      return { status: 'SKIPPED', skipReason: SKIP_BLOCKED };
    }
    if (contact.status === 'OPTED_OUT') {
      return { status: 'SKIPPED', skipReason: SKIP_OPTED_OUT };
    }
    if (contact.status === 'ARCHIVED') {
      return { status: 'SKIPPED', skipReason: SKIP_ARCHIVED };
    }
    return { status: 'READY', skipReason: null };
  }

  renderForSnapshot(args: {
    readonly templateBody: string | null;
    readonly mergeFields: Record<string, string>;
    readonly strategy: 'strict' | 'empty';
  }): { readonly renderedBody: string | null; readonly skipReason: string | null } {
    if (!args.templateBody) {
      return { renderedBody: null, skipReason: null };
    }
    try {
      const out = this.renderer.render({
        body: args.templateBody,
        mergeFields: args.mergeFields,
        missingVariableStrategy: args.strategy,
      });
      return { renderedBody: out.renderedText, skipReason: null };
    } catch (err) {
      if (err instanceof TemplateValidationException && args.strategy === 'strict') {
        return { renderedBody: null, skipReason: SKIP_STRICT_TEMPLATE };
      }
      throw err;
    }
  }

  async resolveTemplateBodyForOrg(args: {
    readonly principal: AuthPrincipal;
    readonly templateId: string | null | undefined;
  }): Promise<string | null> {
    if (!args.templateId) return null;
    const organizationId = this.orgId(args.principal);
    const row = await this.templatesRepo.findById(args.templateId);
    if (!row) {
      throw new CampaignValidationException('Template not found for this organization');
    }
    if (row.deletedAt !== null) {
      throw new CampaignValidationException('Template not found for this organization');
    }
    if (row.organizationId !== organizationId) {
      throw new CampaignValidationException('Template not found for this organization');
    }
    return row.body;
  }

  /** Validates placeholder syntax once for the whole batch. */
  assertTemplateSyntax(templateBody: string | null): void {
    if (!templateBody) return;
    const validation = this.variableService.validatePlaceholders(templateBody);
    if (!validation.isValid) {
      throw new TemplateValidationException('Template has invalid placeholders', {
        invalidPlaceholders: validation.invalidPlaceholders,
      });
    }
  }

  buildRecipientRows(args: {
    readonly organizationId: string;
    readonly campaignId: string;
    readonly resolved: readonly TargetResolutionRow[];
    readonly templateBody: string | null;
    readonly strategy: 'strict' | 'empty';
  }): Prisma.CampaignRecipientCreateManyInput[] {
    this.assertTemplateSyntax(args.templateBody);
    return args.resolved.map((r) => {
      const mergeFields = this.contactsService.mergeFieldsFromContactRow(r.contact);
      const classification = this.classifyContact(r.contact);
      if (classification.status === 'SKIPPED') {
        return {
          organizationId: args.organizationId,
          campaignId: args.campaignId,
          contactId: r.contact.id,
          sourceType: r.sourceType,
          sourceRefId: r.sourceRefId,
          normalizedPhoneNumber: r.contact.normalizedPhoneNumber,
          resolvedName: this.resolvedContactName(r.contact),
          mergeFields: mergeFields as unknown as Prisma.InputJsonValue,
          renderedBody: null,
          status: 'SKIPPED' as const,
          skipReason: classification.skipReason,
        };
      }
      const rendered = this.renderForSnapshot({
        templateBody: args.templateBody,
        mergeFields,
        strategy: args.strategy,
      });
      if (rendered.skipReason) {
        return {
          organizationId: args.organizationId,
          campaignId: args.campaignId,
          contactId: r.contact.id,
          sourceType: r.sourceType,
          sourceRefId: r.sourceRefId,
          normalizedPhoneNumber: r.contact.normalizedPhoneNumber,
          resolvedName: this.resolvedContactName(r.contact),
          mergeFields: mergeFields as unknown as Prisma.InputJsonValue,
          renderedBody: null,
          status: 'SKIPPED' as const,
          skipReason: rendered.skipReason,
        };
      }
      return {
        organizationId: args.organizationId,
        campaignId: args.campaignId,
        contactId: r.contact.id,
        sourceType: r.sourceType,
        sourceRefId: r.sourceRefId,
        normalizedPhoneNumber: r.contact.normalizedPhoneNumber,
        resolvedName: this.resolvedContactName(r.contact),
        mergeFields: mergeFields as unknown as Prisma.InputJsonValue,
        renderedBody: rendered.renderedBody,
        status: 'READY' as const,
        skipReason: null,
      };
    });
  }

  async replaceRecipientsTransaction(args: {
    readonly organizationId: string;
    readonly campaignId: string;
    readonly contactIds: readonly string[];
    readonly contactListIds: readonly string[];
    readonly templateId: string | null;
    readonly strategy: 'strict' | 'empty';
    readonly principal: AuthPrincipal;
  }): Promise<void> {
    const templateBody = await this.resolveTemplateBodyForOrg({
      principal: args.principal,
      templateId: args.templateId,
    });
    const resolved = await this.resolveTargetContacts({
      principal: args.principal,
      contactIds: args.contactIds,
      contactListIds: args.contactListIds,
    });
    const rows = this.buildRecipientRows({
      organizationId: args.organizationId,
      campaignId: args.campaignId,
      resolved,
      templateBody,
      strategy: args.strategy,
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.campaignRecipient.deleteMany({ where: { campaignId: args.campaignId } });
      if (rows.length > 0) {
        await tx.campaignRecipient.createMany({ data: rows });
      }
    });
    await this.campaignsRepo.refreshRecipientAggregates(args.campaignId);
  }
}
