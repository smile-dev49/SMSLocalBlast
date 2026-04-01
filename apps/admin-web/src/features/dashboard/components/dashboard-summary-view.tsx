import type { ReactElement } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export interface DashboardStat {
  readonly title: string;
  readonly value: string;
  readonly hint?: string;
}

export function DashboardSummaryView(
  props: Readonly<{
    organizationName: string;
    userEmail: string;
    roleName: string;
    stats: readonly DashboardStat[];
  }>,
): ReactElement {
  const { organizationName, userEmail, roleName, stats } = props;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Operational overview for your organization.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Organization & session</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Organization</p>
            <p className="font-medium">{organizationName}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">User</p>
            <p className="font-medium">{userEmail}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">Role</p>
            <p className="font-medium">{roleName}</p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              {s.hint ? <p className="mt-1 text-xs text-slate-500">{s.hint}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
