export interface WorkbookSnapshot {
  worksheetName: string;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export interface ContactFieldMapping {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  customFields: { key: string; column: string }[];
}
