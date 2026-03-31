import { Injectable } from '@nestjs/common';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { ContactsService } from '../contacts/contacts.service';
import { TemplateRendererService } from '../templates/template-renderer.service';
import { CampaignRecipientsService } from './campaign-recipients.service';
import type { CampaignPreviewBody } from './dto/campaign-preview.dto';
import type {
  CampaignPreviewResponse,
  CampaignPreviewSampleRecipient,
} from './types/campaign.types';

@Injectable()
export class CampaignPreviewService {
  constructor(
    private readonly recipients: CampaignRecipientsService,
    private readonly contacts: ContactsService,
    private readonly renderer: TemplateRendererService,
  ) {}

  private displayName(row: {
    readonly firstName: string | null;
    readonly lastName: string | null;
    readonly fullName: string | null;
    readonly phoneNumber: string;
  }): string {
    const parts = [row.firstName, row.lastName].filter(Boolean).join(' ').trim();
    if (parts.length > 0) return parts;
    if (row.fullName) return row.fullName;
    return row.phoneNumber;
  }

  async preview(
    principal: AuthPrincipal,
    body: CampaignPreviewBody,
  ): Promise<CampaignPreviewResponse> {
    const resolved = await this.recipients.resolveTargetContacts({
      principal,
      contactIds: body.target.contactIds,
      contactListIds: body.target.contactListIds,
    });

    const templateBody =
      body.templateBody ??
      (await this.recipients.resolveTemplateBodyForOrg({
        principal,
        templateId: body.templateId,
      }));

    this.recipients.assertTemplateSyntax(templateBody);

    let sendableRecipients = 0;
    let skippedRecipients = 0;
    const skipReasons: Record<string, number> = {};
    let estimatedSegmentsTotal = 0;
    const sampleRenderedRecipients: CampaignPreviewSampleRecipient[] = [];

    const bumpSkip = (reason: string): void => {
      skippedRecipients += 1;
      skipReasons[reason] = (skipReasons[reason] ?? 0) + 1;
    };

    for (const row of resolved) {
      const classification = this.recipients.classifyContact(row.contact);
      if (classification.status === 'SKIPPED' && classification.skipReason) {
        bumpSkip(classification.skipReason);
        if (sampleRenderedRecipients.length < body.sampleLimit) {
          sampleRenderedRecipients.push({
            contactId: row.contact.id,
            normalizedPhoneNumber: row.contact.normalizedPhoneNumber,
            resolvedName: this.displayName(row.contact),
            renderedBody: null,
            status: 'SKIPPED',
            skipReason: classification.skipReason,
            estimatedSegments: 0,
          });
        }
        continue;
      }

      const mergeFields = this.contacts.mergeFieldsFromContactRow(row.contact);

      const rendered = this.recipients.renderForSnapshot({
        templateBody,
        mergeFields,
        strategy: body.missingVariableStrategy,
      });

      if (rendered.skipReason) {
        bumpSkip(rendered.skipReason);
        if (sampleRenderedRecipients.length < body.sampleLimit) {
          sampleRenderedRecipients.push({
            contactId: row.contact.id,
            normalizedPhoneNumber: row.contact.normalizedPhoneNumber,
            resolvedName: this.displayName(row.contact),
            renderedBody: null,
            status: 'SKIPPED',
            skipReason: rendered.skipReason,
            estimatedSegments: 0,
          });
        }
        continue;
      }

      sendableRecipients += 1;
      const text = rendered.renderedBody ?? '';
      const segments = templateBody ? this.renderer.estimateSmsSegments(text).estimatedSegments : 0;
      estimatedSegmentsTotal += segments;

      if (sampleRenderedRecipients.length < body.sampleLimit) {
        sampleRenderedRecipients.push({
          contactId: row.contact.id,
          normalizedPhoneNumber: row.contact.normalizedPhoneNumber,
          resolvedName: this.displayName(row.contact),
          renderedBody: rendered.renderedBody,
          status: 'READY',
          skipReason: null,
          estimatedSegments: segments,
        });
      }
    }

    return {
      totalUniqueRecipients: resolved.length,
      sendableRecipients,
      skippedRecipients,
      skipReasons,
      estimatedSegmentsTotal,
      sampleRenderedRecipients,
    };
  }
}
