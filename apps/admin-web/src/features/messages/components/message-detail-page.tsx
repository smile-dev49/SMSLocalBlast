'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactElement } from 'react';

import { hasPermission, PERMISSION } from '@/core/auth/permissions';
import { useAuth } from '@/core/auth/auth-context';
import { formatApiError, formatDateTime } from '@/core/utils/format';
import { messagesApi } from '@/features/messages/api/messages-api';
import { QueryState } from '@/shared/components/query-state';
import { RoutePermission } from '@/shared/components/route-permission';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function MessageDetailPage(props: Readonly<{ messageId: string }>): ReactElement {
  const { messageId } = props;
  const { me } = useAuth();
  const canRetry = hasPermission(me?.permissions, PERMISSION.messagesRetry);
  const canCancel = hasPermission(me?.permissions, PERMISSION.messagesCancel);
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: ['messages', 'detail', messageId],
    queryFn: () => messagesApi.get(messageId),
  });

  const eventsQ = useQuery({
    queryKey: ['messages', 'events', messageId],
    queryFn: () => messagesApi.events(messageId),
  });

  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: ['messages'] });
  };

  const retryM = useMutation({
    mutationFn: () => messagesApi.retry(messageId, {}),
    onSuccess: invalidate,
  });
  const cancelM = useMutation({
    mutationFn: () => messagesApi.cancel(messageId, {}),
    onSuccess: invalidate,
  });

  const msg = detailQ.data?.message;

  return (
    <RoutePermission permission={PERMISSION.messagesRead}>
      <div className="flex flex-col gap-4">
        <Link href="/messages" className="text-sm text-slate-600 underline dark:text-slate-400">
          ← Messages
        </Link>
        <QueryState isLoading={detailQ.isPending} error={detailQ.error} isEmpty={!msg}>
          {msg ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold font-mono">{msg.normalizedPhoneNumber}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Message {msg.id}</p>
                </div>
                <Badge tone="neutral">{msg.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {canRetry ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={retryM.isPending}
                    onClick={() => void retryM.mutateAsync()}
                  >
                    Retry
                  </Button>
                ) : (
                  <span className="text-sm text-slate-500">Retry requires messages.retry</span>
                )}
                {canCancel ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={cancelM.isPending}
                    onClick={() => void cancelM.mutateAsync()}
                  >
                    Cancel
                  </Button>
                ) : (
                  <span className="text-sm text-slate-500">Cancel requires messages.cancel</span>
                )}
              </div>
              {(retryM.error ?? cancelM.error) && (
                <p className="text-sm text-red-600">
                  {formatApiError(retryM.error ?? cancelM.error)}
                </p>
              )}
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Routing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="text-slate-500">Campaign: </span>
                      {msg.campaignId ?? '—'}
                    </p>
                    <p>
                      <span className="text-slate-500">Device: </span>
                      {msg.deviceId ?? '—'}
                    </p>
                    <p>
                      <span className="text-slate-500">Contact: </span>
                      {msg.contactId ?? '—'}
                    </p>
                    <p>
                      <span className="text-slate-500">Retries: </span>
                      {msg.retryCount}/{msg.maxRetries}
                    </p>
                    <p>
                      <span className="text-slate-500">Failure: </span>
                      {msg.failureCode ?? '—'} {msg.failureReason ? `— ${msg.failureReason}` : ''}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Queued: {formatDateTime(msg.queuedAt)}</p>
                    <p>Scheduled: {formatDateTime(msg.scheduledAt)}</p>
                    <p>Sent: {formatDateTime(msg.sentAt)}</p>
                    <p>Delivered: {formatDateTime(msg.deliveredAt)}</p>
                    <p>Failed: {formatDateTime(msg.failedAt)}</p>
                    <p>Last status: {formatDateTime(msg.lastStatusAt)}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rendered body</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap rounded-md bg-slate-100 p-3 text-sm dark:bg-slate-900">
                    {msg.renderedBody}
                  </pre>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Status events ({detailQ.data?.eventsCount ?? '—'})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <QueryState
                    isLoading={eventsQ.isPending}
                    error={eventsQ.error}
                    isEmpty={eventsQ.data?.events.length === 0}
                    emptyMessage="No events recorded."
                  >
                    {eventsQ.data ? (
                      <div className="max-h-96 overflow-auto text-sm">
                        <table className="w-full border-collapse text-left">
                          <thead className="sticky top-0 bg-slate-50 text-xs uppercase dark:bg-slate-900">
                            <tr>
                              <th className="px-2 py-1">Time</th>
                              <th className="px-2 py-1">Transition</th>
                              <th className="px-2 py-1">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eventsQ.data.events.map((ev) => (
                              <tr
                                key={ev.id}
                                className="border-t border-slate-100 dark:border-slate-800"
                              >
                                <td className="px-2 py-1 text-slate-600 dark:text-slate-400">
                                  {formatDateTime(ev.createdAt)}
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
