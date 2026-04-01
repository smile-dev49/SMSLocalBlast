import type { ReactElement, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function Badge({
  children,
  tone = 'neutral',
}: Readonly<{
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}>): ReactElement {
  const tones = {
    neutral: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-100 text-emerald-900',
    warning: 'bg-amber-100 text-amber-900',
    danger: 'bg-red-100 text-red-900',
  } as const;
  return (
    <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}
