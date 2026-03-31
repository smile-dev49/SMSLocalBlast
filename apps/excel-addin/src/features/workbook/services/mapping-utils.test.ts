import { describe, expect, it } from 'vitest';

import { mapRowsForContactImport } from '@/features/workbook/services/mapping-utils';

describe('mapping-utils', () => {
  it('maps worksheet rows to import rows', () => {
    const rows = [{ First: 'Ada', Last: 'Lovelace', Phone: '+15550001', Balance: '20' }];
    const result = mapRowsForContactImport(rows, {
      firstName: 'First',
      lastName: 'Last',
      phoneNumber: 'Phone',
      customFields: [{ key: 'Balance', column: 'Balance' }],
    });
    expect(result[0]?.firstName).toBe('Ada');
    expect(result[0]?.customFields?.['Balance']).toBe('20');
  });
});
