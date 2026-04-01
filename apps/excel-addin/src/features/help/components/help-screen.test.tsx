import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HelpScreen } from '@/features/help/components/help-screen';

vi.mock('@/core/config/env', () => ({
  runtimeConfig: {
    apiBaseUrl: 'http://localhost:3000/api/v1',
    appName: 'test',
    env: 'dev',
    adminHelpUrl: 'http://localhost:3001/docs',
  },
}));

describe('HelpScreen', () => {
  it('shows quick start content and help center URL', () => {
    render(<HelpScreen />);
    expect(screen.getByText(/Help & quick start/)).toBeTruthy();
    expect(screen.getByText(/Use the workbook tab/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'http://localhost:3001/docs' })).toBeTruthy();
    expect(screen.getByText(/VITE_ADMIN_HELP_URL/)).toBeTruthy();
  });
});
