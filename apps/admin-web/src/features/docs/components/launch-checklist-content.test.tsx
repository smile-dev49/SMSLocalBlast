import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LaunchChecklistContent } from '@/features/docs/components/launch-checklist-content';
import { LAUNCH_CHECKLIST_GROUPS } from '@/features/docs/launch-checklist-model';

const idleHints = {
  devicesSampleOnline: null,
  devicesSampleTotal: null,
  subscriptionStatus: null,
  recentCampaignCount: null,
  queueQueuedLike: null,
  eligibleDevices: null,
  hintsLoading: false,
  hintsError: false,
} as const;

describe('LaunchChecklistContent', () => {
  it('renders grouped checklist and live signals section', () => {
    render(<LaunchChecklistContent hints={idleHints} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Launch checklist' })).toBeInTheDocument();
    expect(screen.getByText(/Live signals/)).toBeInTheDocument();
    const firstItem = LAUNCH_CHECKLIST_GROUPS[0]?.items[0];
    expect(firstItem).toBeDefined();
    if (firstItem) {
      expect(screen.getByText(firstItem.label)).toBeInTheDocument();
    }
  });
});
