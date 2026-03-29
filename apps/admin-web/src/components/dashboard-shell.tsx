import type { ReactNode } from 'react';

interface DashboardShellProps {
  readonly children: ReactNode;
}

/** App chrome only — no data loading or auth logic in this component. */
export function DashboardShell({ children }: DashboardShellProps): ReactNode {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-lg font-semibold tracking-tight">SMS LocalBlast Admin</h1>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
