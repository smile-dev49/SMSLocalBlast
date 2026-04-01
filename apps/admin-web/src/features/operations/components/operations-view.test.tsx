import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OperationsView } from '@/features/operations/components/operations-view';

describe('OperationsView', () => {
  it('renders queue and stuck sections', () => {
    render(
      <OperationsView
        queue={{ QUEUED: 5, FAILED: 1 }}
        stuck={[{ id: 'm1', organizationId: 'o1', deviceId: null, dispatchingAt: null }]}
        availability={{ all: 10, eligible: 8, unavailable: 2 }}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Operations' })).toBeInTheDocument();
    expect(screen.getByText(/QUEUED/)).toBeInTheDocument();
    expect(screen.getByText(/Eligible:\s*8/)).toBeInTheDocument();
    expect(screen.getByText('m1')).toBeInTheDocument();
  });
});
