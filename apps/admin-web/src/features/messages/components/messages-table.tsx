import Link from 'next/link';
import type { ReactElement } from 'react';

import type { MessageRow } from '@/features/messages/api/messages-api';
import { formatDateTime } from '@/core/utils/format';
import { Badge } from '@/shared/ui/badge';

export function MessagesTable(props: Readonly<{ messages: readonly MessageRow[] }>): ReactElement {
  const { messages } = props;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th className="px-3 py-2">Phone</th>
            <th className="px-3 py-2">Campaign</th>
            <th className="px-3 py-2">Device</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Retries</th>
            <th className="px-3 py-2">Last status</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {messages.map((m) => (
            <tr key={m.id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-3 py-2 font-mono text-xs">{m.normalizedPhoneNumber}</td>
              <td className="px-3 py-2 font-mono text-xs">{m.campaignId ?? '—'}</td>
              <td className="px-3 py-2 font-mono text-xs">{m.deviceId ?? '—'}</td>
              <td className="px-3 py-2">
                <Badge tone="neutral">{m.status}</Badge>
              </td>
              <td className="px-3 py-2 tabular-nums">
                {m.retryCount}/{m.maxRetries}
              </td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                {formatDateTime(m.lastStatusAt)}
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  className="font-medium text-slate-900 underline dark:text-slate-100"
                  href={`/messages/${m.id}`}
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
