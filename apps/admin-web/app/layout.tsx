import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from '@/shared/providers/app-providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'SMS LocalBlast Admin',
  description: 'Operations dashboard for SMS LocalBlast',
};

export default function RootLayout(props: Readonly<{ children: ReactNode }>): ReactNode {
  const { children } = props;
  return (
    <html lang="en">
      <body className="font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
