'use client';

import type { ReactNode } from 'react';

import { AuthProvider } from '@/core/auth/auth-context';
import { QueryProvider } from '@/shared/providers/query-provider';

export function AppProviders({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
