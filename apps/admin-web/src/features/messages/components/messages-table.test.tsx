import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { MessageRow } from '@/features/messages/api/messages-api';
import { MessagesTable } from '@/features/messages/components/messages-table';

const sample: MessageRow = {
  id: 'msg-1',
  status: 'QUEUED',
  normalizedPhoneNumber: '+15559876543',
  campaignId: 'camp-1',
  deviceId: null,
  contactId: 'con-1',
  retryCount: 0,
  maxRetries: 3,
  lastStatusAt: null,
  failureCode: null,
  createdAt: '2026-01-01T12:00:00.000Z',
};

describe('MessagesTable', () => {
  it('renders message row and open link', () => {
    render(<MessagesTable messages={[sample]} />);
    expect(screen.getByText('+15559876543')).toBeInTheDocument();
    expect(screen.getByText('QUEUED')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Open' });
    expect(link).toHaveAttribute('href', '/messages/msg-1');
  });
});
