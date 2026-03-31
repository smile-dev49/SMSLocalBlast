import type {
  CampaignRecipientSourceType,
  CampaignRecipientStatus,
  CampaignStatus,
  Prisma,
  TemplateChannelType,
} from '@prisma/client';
import type { ContactRow } from '../../contacts/contacts.repository';

export interface CampaignTargetPersisted {
  readonly contactIds: readonly string[];
  readonly contactListIds: readonly string[];
}

export interface TargetResolutionRow {
  readonly contact: ContactRow;
  readonly sourceType: CampaignRecipientSourceType;
  readonly sourceRefId: string | null;
}

export interface CampaignTemplateSummary {
  readonly id: string;
  readonly name: string;
  readonly channelType: TemplateChannelType;
}

export interface CampaignResponse {
  readonly id: string;
  readonly organizationId: string;
  readonly createdByUserId: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly status: CampaignStatus;
  readonly templateId: string | null;
  readonly template: CampaignTemplateSummary | null;
  readonly scheduledAt: Date | null;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly pausedAt: Date | null;
  readonly failureReason: string | null;
  readonly timezone: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly target: CampaignTargetPersisted;
  readonly missingVariableStrategy: 'strict' | 'empty';
  readonly recipientCount: number;
  readonly readyCount: number;
  readonly sentCount: number;
  readonly deliveredCount: number;
  readonly failedCount: number;
  readonly skippedCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CampaignPreviewSampleRecipient {
  readonly contactId: string | null;
  readonly normalizedPhoneNumber: string;
  readonly resolvedName: string | null;
  readonly renderedBody: string | null;
  readonly status: CampaignRecipientStatus;
  readonly skipReason: string | null;
  readonly estimatedSegments: number;
}

export interface CampaignPreviewResponse {
  readonly totalUniqueRecipients: number;
  readonly sendableRecipients: number;
  readonly skippedRecipients: number;
  readonly skipReasons: Record<string, number>;
  readonly estimatedSegmentsTotal: number;
  readonly sampleRenderedRecipients: readonly CampaignPreviewSampleRecipient[];
}

export interface CampaignSummaryResponse {
  readonly campaign: CampaignResponse;
  readonly recipientCountsByStatus: Partial<Record<CampaignRecipientStatus, number>>;
  readonly skipReasons: Record<string, number>;
}
