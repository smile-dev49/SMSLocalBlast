import type { ReactElement, ReactNode } from 'react';

import { formatApiError } from '@/core/utils/format';

export function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  children,
}: Readonly<{
  isLoading: boolean;
  error: unknown;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}>): ReactElement {
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-lg bg-slate-200/80 py-12 text-center text-sm dark:bg-slate-800/80">
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
        {formatApiError(error)}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {emptyMessage ?? 'No data yet.'}
      </div>
    );
  }
  return <>{children}</>;
}
