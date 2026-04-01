'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactElement } from 'react';

import { hasPermission, PERMISSION } from '@/core/auth/permissions';
import { useAuth } from '@/core/auth/auth-context';
import { formatApiError, formatDateTime } from '@/core/utils/format';
import { campaignsApi } from '@/features/campaigns/api/campaigns-api';
import { QueryState } from '@/shared/components/query-state';
import { RoutePermission } from '@/shared/components/route-permission';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function CampaignDetailPage(props: Readonly<{ campaignId: string }>): ReactElement {
  const { campaignId } = props;
  const { me } = useAuth();
  const canExecute = hasPermission(me?.permissions, PERMISSION.campaignsExecute);
  const qc = useQueryClient();

  const campaignQ = useQuery({
    queryKey: ['campaigns', 'detail', campaignId],
    queryFn: () => campaignsApi.get(campaignId),
  });

  const summaryQ = useQuery({
    queryKey: ['campaigns', 'summary', campaignId],
    queryFn: () => campaignsApi.summary(campaignId),
  });

  const eventsQ = useQuery({
    queryKey: ['campaigns', 'events', campaignId],
    queryFn: () => campaignsApi.events(campaignId),
  });

  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: ['campaigns'] });
  };

  const startM = useMutation({
    mutationFn: () => campaignsApi.start(campaignId),
    onSuccess: invalidate,
  });
  const pauseM = useMutation({
    mutationFn: () => campaignsApi.pause(campaignId),
    onSuccess: invalidate,
  });
  const cancelM = useMutation({
    mutationFn: () => campaignsApi.cancel(campaignId),
    onSuccess: invalidate,
  });

  const loading = campaignQ.isPending || summaryQ.isPending;
  const error = campaignQ.error ?? summaryQ.error;

  return (
    <RoutePermission permission={PERMISSION.campaignsRead}>
      <div className="flex flex-col gap-4">
        <Link href="/campaigns" className="text-sm text-slate-600 underline dark:text-slate-400">
          ← Campaigns
        </Link>
        <QueryState isLoading={loading} error={error} isEmpty={!campaignQ.data}>
          {campaignQ.data && summaryQ.data ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold">{campaignQ.data.name}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {campaignQ.data.description ?? 'No description'}
                  </p>
                </div>
                <Badge tone="neutral">{campaignQ.data.status}</Badge>
              </div>
              {canExecute ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={startM.isPending}
                    onClick={() => void startM.mutateAsync()}
                  >
                    Start
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pauseM.isPending}
                    onClick={() => void pauseM.mutateAsync()}
                  >
                    Pause
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={cancelM.isPending}
                    onClick={() => void cancelM.mutateAsync()}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Campaign control requires campaigns.execute.
                </p>
              )}
              {(startM.error ?? pauseM.error ?? cancelM.error) && (
                <p className="text-sm text-red-600">
                  {formatApiError(startM.error ?? pauseM.error ?? cancelM.error)}
                </p>
              )}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Schedule & template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-500">Scheduled: </span>
                      {formatDateTime(campaignQ.data.scheduledAt)}
                    </p>
                    <p>
                      <span className="text-slate-500">Started: </span>
                      {formatDateTime(campaignQ.data.startedAt)}
                    </p>
                    <p>
                      <span className="text-slate-500">Template: </span>
                      {campaignQ.data.template ? campaignQ.data.template.name : '—'}
                    </p>
                    <p>
                      <span className="text-slate-500">Timezone: </span>
                      {campaignQ.data.timezone ?? '—'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recipient funnel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm tabular-nums">
                    <p>Total recipients: {campaignQ.data.recipientCount}</p>
                    <p>Ready: {campaignQ.data.readyCount}</p>
                    <p>Skipped: {campaignQ.data.skippedCount}</p>
                    <div className="pt-2">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        By recipient status
                      </p>
                      <ul className="mt-1 list-inside list-disc text-slate-700 dark:text-slate-300">
                        {Object.entries(summaryQ.data.recipientCountsByStatus).map(([k, v]) => (
                          <li key={k}>
                            {k}: {v}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {Object.keys(summaryQ.data.skipReasons).length > 0 ? (
                      <div className="pt-2">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Skip reasons
                        </p>
                        <ul className="mt-1 list-inside list-disc">
                          {Object.entries(summaryQ.data.skipReasons).map(([k, v]) => (
                            <li key={k}>
                              {k}: {v}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent message status events</CardTitle>
                </CardHeader>
                <CardContent>
                  <QueryState
                    isLoading={eventsQ.isPending}
                    error={eventsQ.error}
                    isEmpty={eventsQ.data?.length === 0}
                    emptyMessage="No cross-message events recorded yet for this campaign."
                  >
                    {eventsQ.data ? (
                      <div className="max-h-80 overflow-auto text-sm">
                        <table className="w-full border-collapse text-left">
                          <thead className="sticky top-0 bg-slate-50 text-xs uppercase dark:bg-slate-900">
                            <tr>
                              <th className="px-2 py-1">Time</th>
                              <th className="px-2 py-1">Message</th>
                              <th className="px-2 py-1">Transition</th>
                              <th className="px-2 py-1">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eventsQ.data.map((ev) => (
                              <tr
                                key={ev.id}
                                className="border-t border-slate-100 dark:border-slate-800"
                              >
                                <td className="px-2 py-1 text-slate-600 dark:text-slate-400">
                                  {formatDateTime(ev.createdAt)}
                                </td>
                                <td className="px-2 py-1 font-mono text-xs">
                                  {ev.outboundMessageId.slice(0, 8)}…
                                </td>
                                <td className="px-2 py-1">
                                  {ev.fromStatus ?? '∅'} → {ev.toStatus}
                                </td>
                                <td className="px-2 py-1 text-slate-600 dark:text-slate-400">
                                  {ev.reason ?? '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </QueryState>
                </CardContent>
              </Card>
            </>
          ) : null}
        </QueryState>
      </div>
    </RoutePermission>
  );
}
