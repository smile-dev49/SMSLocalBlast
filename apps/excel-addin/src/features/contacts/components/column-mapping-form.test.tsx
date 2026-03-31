import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ColumnMappingForm } from '@/features/contacts/components/column-mapping-form';

describe('ColumnMappingForm', () => {
  it('renders required mapping fields', () => {
    const onChange = (): void => undefined;
    render(<ColumnMappingForm headers={['First', 'Phone']} onChange={onChange} />);
    expect(screen.getByText('Column Mapping')).toBeTruthy();
    expect(screen.getByText('Custom field key')).toBeTruthy();
  });
});
