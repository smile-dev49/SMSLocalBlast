'use client';

import type { ReactElement } from 'react';

import { useAuth } from '@/core/auth/auth-context';
import { DashboardSummaryView } from '@/features/dashboard/components/dashboard-summary-view';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats';
import { QueryState } from '@/shared/components/query-state';

export function DashboardPage(): ReactElement {
  const { me } = useAuth();
  const { stats, isLoading, error } = useDashboardStats();

  if (!me) {
    return <div />;
  }

  return (
    <QueryState isLoading={isLoading} error={error} isEmpty={false}>
      <DashboardSummaryView
        organizationName={me.organization.name}
        userEmail={me.user.email}
        roleName={me.role.name}
        stats={stats}
      />
    </QueryState>
  );
}
