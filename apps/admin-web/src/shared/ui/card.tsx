import type { ReactElement, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
}: Readonly<{ className?: string; children: ReactNode }>): ReactElement {
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
}: Readonly<{ className?: string; children: ReactNode }>): ReactElement {
  return <div className={cn('mb-2', className)}>{children}</div>;
}

export function CardTitle({
  className,
  children,
}: Readonly<{ className?: string; children: ReactNode }>): ReactElement {
  return (
    <h2 className={cn('text-base font-semibold text-slate-900 dark:text-slate-100', className)}>
      {children}
    </h2>
  );
}

export function CardContent({
  className,
  children,
}: Readonly<{ className?: string; children: ReactNode }>): ReactElement {
  return <div className={cn(className)}>{children}</div>;
}
