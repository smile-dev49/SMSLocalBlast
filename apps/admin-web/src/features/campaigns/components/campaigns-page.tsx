'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { PERMISSION } from '@/core/auth/permissions';
import { formatDateTime } from '@/core/utils/format';
import { campaignsApi } from '@/features/campaigns/api/campaigns-api';
import { QueryState } from '@/shared/components/query-state';
import { RoutePermission } from '@/shared/components/route-permission';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

export function CampaignsPage(): ReactElement {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const query = useQuery({
    queryKey: ['campaigns', 'list', { page, status }],
    queryFn: () => campaignsApi.list({ page, limit: 20, ...(status ? { status } : {}) }),
  });

  return (
    <RoutePermission permission={PERMISSION.campaignsRead}>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Monitor delivery progress. Creation and large edits stay in the Excel add-in workflow.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium">
            Status
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">Any</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="PAUSED">PAUSED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void query.refetch();
            }}
          >
            Refresh
          </Button>
        </div>
        <QueryState
          isLoading={query.isPending}
          error={query.error}
          isEmpty={query.data?.items.length === 0}
          emptyMessage="No campaigns found."
        >
          {query.data ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Recipients</th>
                    <th className="px-3 py-2">Progress</th>
                    <th className="px-3 py-2">Scheduled</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2">
                        <Badge tone="neutral">{c.status}</Badge>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{c.recipientCount}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-600 dark:text-slate-400">
                        sent {c.sentCount} · del {c.deliveredCount} · fail {c.failedCount}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                        {formatDateTime(c.scheduledAt)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          className="font-medium text-slate-900 underline dark:text-slate-100"
                          href={`/campaigns/${c.id}`}
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </QueryState>
        {query.data && query.data.totalPages > 1 ? (
          <div className="flex items-center gap-2 text-sm">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => { setPage((p) => p - 1); }}
            >
              Previous
            </Button>
            <span className="text-slate-600 dark:text-slate-400">
              Page {page} of {query.data.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={page >= query.data.totalPages}
              onClick={() => {
                setPage((p) => p + 1);
              }}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </RoutePermission>
  );
}
