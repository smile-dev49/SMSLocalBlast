'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { PERMISSION } from '@/core/auth/permissions';
import { operationsApi } from '@/features/operations/api/operations-api';
import { OperationsView } from '@/features/operations/components/operations-view';
import { QueryState } from '@/shared/components/query-state';
import { RoutePermission } from '@/shared/components/route-permission';

export function OperationsPage(): ReactElement {
  const queueQ = useQuery({
    queryKey: ['operations', 'queues', 'summary'],
    queryFn: () => operationsApi.queueSummary(),
  });
  const stuckQ = useQuery({
    queryKey: ['operations', 'messages', 'stuck'],
    queryFn: () => operationsApi.stuckMessages(),
  });
  const availQ = useQuery({
    queryKey: ['operations', 'devices', 'availability'],
    queryFn: () => operationsApi.devicesAvailability(),
  });

  const loading = queueQ.isPending || stuckQ.isPending || availQ.isPending;
  const error = queueQ.error ?? stuckQ.error ?? availQ.error;

  return (
    <RoutePermission permission={PERMISSION.operationsRead}>
      <QueryState isLoading={loading} error={error} isEmpty={false}>
        <OperationsView queue={queueQ.data} stuck={stuckQ.data} availability={availQ.data} />
      </QueryState>
    </RoutePermission>
  );
}
