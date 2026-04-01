import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { DeviceRow } from '@/features/devices/api/devices-api';
import { DevicesTable } from '@/features/devices/components/devices-table';

const sample: DeviceRow = {
  id: 'dev-1',
  name: 'Pixel',
  platform: 'ANDROID',
  status: 'ONLINE',
  healthStatus: 'OK',
  isActive: true,
  isPrimary: true,
  phoneNumber: '+15551234567',
  dailySendLimit: 500,
  hourlySendLimit: 50,
  dailySentCount: 10,
  hourlySentCount: 2,
  lastSeenAt: '2026-01-01T12:00:00.000Z',
  lastHeartbeatAt: '2026-01-01T12:00:00.000Z',
  capabilities: {},
  deviceIdentifier: 'id-abc',
};

describe('DevicesTable', () => {
  it('renders device rows and view link', () => {
    render(<DevicesTable devices={[sample]} />);
    expect(screen.getByText('Pixel')).toBeInTheDocument();
    expect(screen.getByText('ONLINE')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'View' });
    expect(link).toHaveAttribute('href', '/devices/dev-1');
  });
});
