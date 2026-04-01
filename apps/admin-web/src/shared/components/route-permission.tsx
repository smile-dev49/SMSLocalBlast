'use client';

import type { ReactElement, ReactNode } from 'react';

import { hasPermission } from '@/core/auth/permissions';
import { useAuth } from '@/core/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function RoutePermission({
  permission,
  children,
}: Readonly<{ permission: string; children: ReactNode }>): ReactElement {
  const { me } = useAuth();
  if (!hasPermission(me?.permissions, permission)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access restricted</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 dark:text-slate-400">
          You do not have permission to view this section ({permission}). Contact an administrator
          if you need access.
        </CardContent>
      </Card>
    );
  }
  return <>{children}</>;
}
