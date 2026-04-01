import type { ReactElement } from 'react';

import type {
  DeviceAvailability,
  QueueSummary,
  StuckMessageRow,
} from '@/features/operations/api/operations-api';
import { formatDateTime } from '@/core/utils/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function OperationsView(
  props: Readonly<{
    queue: QueueSummary | undefined;
    stuck: readonly StuckMessageRow[] | undefined;
    availability: DeviceAvailability | undefined;
  }>,
): ReactElement {
  const { queue, stuck, availability } = props;

  const queuedLike =
    queue === undefined
      ? '—'
      : String(
          (queue['QUEUED'] ?? 0) +
            (queue['PENDING'] ?? 0) +
            (queue['SCHEDULED'] ?? 0) +
            (queue['RETRYING'] ?? 0),
        );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Operations</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Queue health, stuck dispatchers, and device availability. Requires operations.read.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Queue summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {queue === undefined ? (
              <p className="text-slate-500">No data</p>
            ) : (
              <ul className="list-inside list-disc space-y-1">
                {Object.entries(queue).map(([status, count]) => (
                  <li key={status}>
                    {status}: <span className="font-mono tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-500">Queued-like aggregate: {queuedLike}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm tabular-nums">
            {availability === undefined ? (
              <p className="text-slate-500">No data</p>
            ) : (
              <>
                <p>Eligible: {availability.eligible}</p>
                <p>Unavailable: {availability.unavailable}</p>
                <p>All devices: {availability.all}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stuck messages</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {stuck === undefined ? (
              <p className="text-slate-500">No data</p>
            ) : (
              <p className="text-2xl font-semibold tabular-nums">{stuck.length}</p>
            )}
            <p className="mt-2 text-xs text-slate-500">DISPATCHING longer than 5 minutes</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stuck message ids</CardTitle>
        </CardHeader>
        <CardContent>
          {stuck === undefined || stuck.length === 0 ? (
            <p className="text-sm text-slate-500">None</p>
          ) : (
            <div className="max-h-64 overflow-auto text-sm">
              <table className="w-full border-collapse text-left">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-2 py-1">ID</th>
                    <th className="px-2 py-1">Device</th>
                    <th className="px-2 py-1">Dispatching since</th>
                  </tr>
                </thead>
                <tbody>
                  {stuck.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-2 py-1 font-mono text-xs">{row.id}</td>
                      <td className="px-2 py-1 font-mono text-xs">{row.deviceId ?? '—'}</td>
                      <td className="px-2 py-1">{formatDateTime(row.dispatchingAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
