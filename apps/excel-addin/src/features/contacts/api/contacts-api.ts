import { httpRequest } from '@/core/network/http-client';
import type { ImportMappedRow } from '@/features/workbook/services/mapping-utils';

export interface ImportOptions {
  deduplicateByPhone: boolean;
  skipInvalidRows: boolean;
  updateExisting: boolean;
  createListName?: string;
}

export interface MappingPayload {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phoneNumber: string;
  email?: string;
  customFields: { fieldKey: string; sourceColumn: string }[];
}

export interface ImportPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  existingMatches: number;
  rowErrors: { rowIndex: number; error: string }[];
}

export const contactsApi = {
  importPreview: (body: {
    sourceType: 'EXCEL_ADDIN';
    rows: ImportMappedRow[];
    mapping: MappingPayload;
    options: ImportOptions;
  }) => httpRequest<ImportPreviewResponse>('/contacts/import/preview', { method: 'POST', body }),
  importConfirm: (body: {
    sourceType: 'EXCEL_ADDIN';
    rows: ImportMappedRow[];
    mapping: MappingPayload;
    options: ImportOptions;
  }) => httpRequest<Record<string, unknown>>('/contacts/import/confirm', { method: 'POST', body }),
  listContactLists: () =>
    httpRequest<{ items: { id: string; name: string; isArchived: boolean }[] }>(
      '/contact-lists?page=1&limit=20',
    ),
};
