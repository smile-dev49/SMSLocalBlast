import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DashboardSummaryView } from '@/features/dashboard/components/dashboard-summary-view';

describe('DashboardSummaryView', () => {
  it('renders identity and stat cards', () => {
    render(
      <DashboardSummaryView
        organizationName="Acme Co"
        userEmail="ops@acme.test"
        roleName="Owner"
        stats={[
          { title: 'Devices', value: '3', hint: '2 online' },
          { title: 'Queue', value: '12' },
        ]}
      />,
    );
    expect(screen.getByText('Acme Co')).toBeInTheDocument();
    expect(screen.getByText('ops@acme.test')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('Devices')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Queue')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
