import type { Prisma, TemplateChannelType } from '@prisma/client';

export interface TemplateResponse {
  readonly id: string;
  readonly organizationId: string;
  readonly createdByUserId: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly body: string;
  readonly channelType: TemplateChannelType;
  readonly isArchived: boolean;
  readonly metadata: Prisma.JsonValue | null;
  readonly lastUsedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly variables: readonly string[];
}

export interface SmsSegmentsMeta {
  readonly length: number;
  readonly estimatedSegments: number;
  readonly isLongMessage: boolean;
}

export interface ValidateTemplateResponse extends SmsSegmentsMeta {
  readonly isValid: boolean;
  readonly variables: readonly string[];
  readonly invalidPlaceholders: readonly string[];
  readonly missingVariables: readonly string[];
  readonly renderedPreview: string | null;
}

export interface RenderTemplateResponse extends SmsSegmentsMeta {
  readonly renderedText: string;
  readonly variables: readonly string[];
  readonly missingVariables: readonly string[];
}
