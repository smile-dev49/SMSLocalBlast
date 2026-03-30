import type {
  ContactSource,
  ContactStatus,
  ContactCustomFieldValueType,
  Prisma,
} from '@prisma/client';

export interface ContactCustomFieldEntry {
  readonly fieldKey: string;
  readonly fieldValue: string;
  readonly valueType: ContactCustomFieldValueType;
}

export interface ContactResponse {
  readonly id: string;
  readonly organizationId: string;
  readonly createdByUserId: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly fullName: string | null;
  readonly phoneNumber: string;
  readonly normalizedPhoneNumber: string;
  readonly email: string | null;
  readonly status: ContactStatus;
  readonly source: ContactSource;
  readonly notes: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly lastContactedAt: Date | null;
  readonly optedOutAt: Date | null;
  readonly blockedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly customFields: readonly ContactCustomFieldEntry[];
  readonly mergeFields: Record<string, string>;
}

export interface ContactListResponse {
  readonly id: string;
  readonly organizationId: string;
  readonly createdByUserId: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly color: string | null;
  readonly isArchived: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly memberCount?: number;
}

export interface ImportRowError {
  readonly rowIndex: number;
  readonly message: string;
}

export interface ImportPreviewRow {
  readonly rowIndex: number;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly fullName: string | null;
  readonly phoneNumber: string;
  readonly normalizedPhoneNumber: string;
  readonly email: string | null;
  readonly customFields: readonly ContactCustomFieldEntry[];
  readonly duplicateInPayload: boolean;
  readonly existingContactId: string | null;
}

export interface ImportPreviewResponse {
  readonly totalRows: number;
  readonly validRows: number;
  readonly invalidRows: number;
  readonly duplicateRows: number;
  readonly existingMatches: number;
  readonly rowErrors: readonly ImportRowError[];
  readonly normalizedSampleRows: readonly ImportPreviewRow[];
}

export interface ImportConfirmResponse {
  readonly totalRows: number;
  readonly createdContacts: number;
  readonly updatedContacts: number;
  readonly skippedRows: number;
  readonly invalidRows: number;
  readonly targetListId: string | null;
}
