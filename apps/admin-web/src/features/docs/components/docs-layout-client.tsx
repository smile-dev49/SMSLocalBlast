'use client';

import type { ReactElement, ReactNode } from 'react';

import { DocsSidebar } from '@/features/docs/components/docs-sidebar';

export function DocsLayoutClient({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      <DocsSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
