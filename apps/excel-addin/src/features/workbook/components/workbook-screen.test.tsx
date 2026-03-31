import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WorkbookScreen } from '@/features/workbook/components/workbook-screen';

describe('WorkbookScreen', () => {
  it('renders workbook refresh action', () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <WorkbookScreen />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Workbook Snapshot')).toBeTruthy();
    expect(screen.getByText('Refresh workbook snapshot')).toBeTruthy();
  });
});
