'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { hasPermission, PERMISSION } from '@/core/auth/permissions';
import { useAuth } from '@/core/auth/auth-context';
import { formatApiError, formatDateTime } from '@/core/utils/format';
import { devicesApi } from '@/features/devices/api/devices-api';
import { RoutePermission } from '@/shared/components/route-permission';
import { QueryState } from '@/shared/components/query-state';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';

export function DeviceDetailPage(props: Readonly<{ deviceId: string }>): ReactElement {
  const { deviceId } = props;
  const { me } = useAuth();
  const perms = me?.permissions;
  const canManage = hasPermission(perms, PERMISSION.devicesManage);
  const qc = useQueryClient();

  const detail = useQuery({
    queryKey: ['devices', 'detail', deviceId],
    queryFn: () => devicesApi.get(deviceId),
  });

  const [daily, setDaily] = useState('');
  const [hourly, setHourly] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const setPrimary = useMutation({
    mutationFn: () => devicesApi.setPrimary(deviceId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const patchQuota = useMutation({
    mutationFn: () =>
      devicesApi.updateQuota(deviceId, {
        ...(daily ? { dailySendLimit: Number(daily) } : {}),
        ...(hourly ? { hourlySendLimit: Number(hourly) } : {}),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['devices', 'detail', deviceId] });
      setFormError(null);
    },
    onError: (e) => { setFormError(formatApiError(e)); },
  });

  return (
    <RoutePermission permission={PERMISSION.devicesRead}>
      <div className="flex flex-col gap-4">
        <Link href="/devices" className="text-sm text-slate-600 underline dark:text-slate-400">
          ← Back to devices
        </Link>
        <QueryState isLoading={detail.isPending} error={detail.error} isEmpty={!detail.data}>
          {detail.data ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold">{detail.data.name}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {detail.data.deviceIdentifier}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={detail.data.status === 'ONLINE' ? 'success' : 'neutral'}>
                    {detail.data.status}
                  </Badge>
                  <Badge tone={detail.data.healthStatus === 'OK' ? 'success' : 'warning'}>
                    {detail.data.healthStatus}
                  </Badge>
                  {detail.data.isPrimary ? <Badge tone="success">Primary</Badge> : null}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Connectivity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-500">Last seen: </span>
                      {formatDateTime(detail.data.lastSeenAt)}
                    </p>
                    <p>
                      <span className="text-slate-500">Last heartbeat: </span>
                      {formatDateTime(detail.data.lastHeartbeatAt)}
                    </p>
                    <p>
                      <span className="text-slate-500">Phone: </span>
                      {detail.data.phoneNumber ?? '—'}
                    </p>
                    <p>
                      <span className="text-slate-500">Active: </span>
                      {detail.data.isActive ? 'Yes' : 'No'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quotas & usage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm tabular-nums">
                    <p>
                      Daily: {detail.data.dailySentCount} / {detail.data.dailySendLimit}
                    </p>
                    <p>
                      Hourly: {detail.data.hourlySentCount} / {detail.data.hourlySendLimit}
                    </p>
                    <p className="text-xs text-slate-500">
                      Capabilities stored as JSON — inspect raw payload in API if needed.
                    </p>
                  </CardContent>
                </Card>
              </div>
              {canManage ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Management</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={detail.data.isPrimary || setPrimary.isPending}
                        onClick={() => void setPrimary.mutateAsync()}
                      >
                        Set primary
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Daily limit
                        <Input
                          inputMode="numeric"
                          value={daily}
                          onChange={(e) => { setDaily(e.target.value); }}
                          placeholder="e.g. 500"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium">
                        Hourly limit
                        <Input
                          inputMode="numeric"
                          value={hourly}
                          onChange={(e) => { setHourly(e.target.value); }}
                          placeholder="e.g. 50"
                        />
                      </label>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          disabled={patchQuota.isPending || (!daily && !hourly)}
                          onClick={() => void patchQuota.mutateAsync()}
                        >
                          Update quota
                        </Button>
                      </div>
                    </div>
                    {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
                    {setPrimary.error ? (
                      <p className="text-sm text-red-600">{formatApiError(setPrimary.error)}</p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-slate-500">
                  You need devices.manage to change primary device or quotas.
                </p>
              )}
            </>
          ) : null}
        </QueryState>
      </div>
    </RoutePermission>
  );
}
