import type { ContactFieldMapping } from '@/features/workbook/types/workbook.types';

export interface ImportMappedRow {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  customFields?: Record<string, string>;
}

function pick(source: Record<string, string>, column?: string): string | undefined {
  if (!column) return undefined;
  const val = source[column];
  return val?.trim() ? val.trim() : undefined;
}

export function mapRowsForContactImport(
  rows: Record<string, string>[],
  mapping: ContactFieldMapping,
): ImportMappedRow[] {
  return rows.map((row) => {
    const customFields: Record<string, string> = {};
    mapping.customFields.forEach((f) => {
      const value = pick(row, f.column);
      if (value) customFields[f.key] = value;
    });
    const firstName = pick(row, mapping.firstName);
    const lastName = pick(row, mapping.lastName);
    const fullName = pick(row, mapping.fullName);
    const phoneNumber = pick(row, mapping.phoneNumber);
    const email = pick(row, mapping.email);
    return {
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(fullName ? { fullName } : {}),
      ...(phoneNumber ? { phoneNumber } : {}),
      ...(email ? { email } : {}),
      ...(Object.keys(customFields).length > 0 ? { customFields } : {}),
    };
  });
}
