'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactElement, ReactNode } from 'react';

import { ADMIN_NAV_ITEMS, filterNavForPermissions } from '@/core/auth/permissions';
import { useAuth } from '@/core/auth/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';

export function AdminShell({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  const pathname = usePathname();
  const { me, logout } = useAuth();
  const nav = filterNavForPermissions(ADMIN_NAV_ITEMS, me?.permissions);
  const fullName = me ? `${me.user.firstName} ${me.user.lastName}`.trim() : '';

  const displayName = fullName.length > 0 ? fullName : (me?.user.email ?? '—');

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:block">
        <div className="flex h-14 items-center border-b border-slate-200 px-4 dark:border-slate-800">
          <span className="text-sm font-semibold tracking-tight">LocalBlast</span>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="min-w-0">
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {me?.organization.name}
            </p>
            <p className="truncate text-sm font-medium">
              {displayName}
              {me?.role.name ? (
                <span className="font-normal text-slate-500 dark:text-slate-400">
                  {' '}
                  · {me.role.name}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="py-1 text-xs"
              onClick={() => void logout()}
            >
              Log out
            </Button>
          </div>
        </header>
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <nav className="flex flex-wrap gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded px-2 py-1 text-xs font-medium',
                  pathname === item.href ? 'bg-slate-900 text-white' : 'text-slate-600',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
