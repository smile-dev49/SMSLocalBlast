'use client';

import { useRouter, usePathname } from 'next/navigation';
import type { ReactElement, ReactNode } from 'react';
import { useEffect } from 'react';

import { useAuth } from '@/core/auth/auth-context';
import { AdminShell } from '@/shared/layout/admin-shell';

export function DashboardLayoutClient({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  const { me, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady || me) return;
    const next = encodeURIComponent(pathname || '/dashboard');
    router.replace(`/login?next=${next}`);
  }, [isReady, me, pathname, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading session…
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Redirecting…
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
