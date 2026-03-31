import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoginScreen } from '@/features/auth/components/login-screen';

describe('LoginScreen', () => {
  it('renders login form', () => {
    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <LoginScreen />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Sign in to SMS LocalBlast')).toBeTruthy();
    expect(screen.getByText('Login')).toBeTruthy();
  });
});
