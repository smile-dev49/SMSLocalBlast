import Link from 'next/link';
import type { ReactElement } from 'react';

import type { DeviceRow } from '@/features/devices/api/devices-api';
import { Badge } from '@/shared/ui/badge';
import { formatDateTime } from '@/core/utils/format';

function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (status === 'ONLINE') return 'success';
  if (status === 'OFFLINE' || status === 'SUSPENDED' || status === 'DISCONNECTED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'neutral';
}

export function DevicesTable(props: Readonly<{ devices: readonly DeviceRow[] }>): ReactElement {
  const { devices } = props;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Platform</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Health</th>
            <th className="px-3 py-2">Primary</th>
            <th className="px-3 py-2">Quota (day/hr)</th>
            <th className="px-3 py-2">Last seen</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-3 py-2 font-medium">{d.name}</td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{d.platform}</td>
              <td className="px-3 py-2">
                <Badge tone={statusTone(d.status)}>{d.status}</Badge>
              </td>
              <td className="px-3 py-2">
                <Badge tone={d.healthStatus === 'OK' ? 'success' : 'warning'}>
                  {d.healthStatus}
                </Badge>
              </td>
              <td className="px-3 py-2">{d.isPrimary ? 'Yes' : '—'}</td>
              <td className="px-3 py-2 tabular-nums text-slate-600 dark:text-slate-400">
                {d.dailySentCount}/{d.dailySendLimit} · {d.hourlySentCount}/{d.hourlySendLimit}
              </td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                {formatDateTime(d.lastSeenAt)}
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  className="text-sm font-medium text-slate-900 underline dark:text-slate-100"
                  href={`/devices/${d.id}`}
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
