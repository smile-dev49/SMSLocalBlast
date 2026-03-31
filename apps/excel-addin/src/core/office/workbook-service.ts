export interface WorkbookSnapshot {
  worksheetName: string;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

declare global {
  interface Window {
    Office?: typeof Office;
  }
}

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value).trim();
  }
  try {
    return JSON.stringify(value).trim();
  } catch {
    return '';
  }
}

export async function isOfficeReady(): Promise<boolean> {
  if (typeof Office === 'undefined') return false;
  await Office.onReady();
  return true;
}

export async function readActiveWorksheetSnapshot(maxPreviewRows = 25): Promise<WorkbookSnapshot> {
  const ready = await isOfficeReady();
  if (!ready) {
    return { worksheetName: 'Browser Preview', headers: [], rows: [], rowCount: 0 };
  }

  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getActiveWorksheet();
    const range = sheet.getUsedRange();
    range.load(['values', 'rowCount', 'columnCount']);
    sheet.load('name');
    await context.sync();

    const values = range.values as unknown[][];
    if (values.length === 0) {
      return { worksheetName: sheet.name, headers: [], rows: [], rowCount: 0 };
    }

    const headers = values[0]?.map(normalizeCell).filter(Boolean) ?? [];
    const dataRows = values.slice(1, Math.min(values.length, maxPreviewRows + 1));
    const rows = dataRows.map((row) => {
      const mapped: Record<string, string> = {};
      headers.forEach((header, idx) => {
        mapped[header] = normalizeCell(row[idx]);
      });
      return mapped;
    });

    return { worksheetName: sheet.name, headers, rows, rowCount: range.rowCount - 1 };
  });
}
