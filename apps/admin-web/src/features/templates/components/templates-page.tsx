'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ChangeEvent, ReactElement } from 'react';
import { useState } from 'react';

import { PERMISSION } from '@/core/auth/permissions';
import { templatesApi } from '@/features/templates/api/templates-api';
import { QueryState } from '@/shared/components/query-state';
import { RoutePermission } from '@/shared/components/route-permission';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export function TemplatesPage(): ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['templates', 'list', { page, search }],
    queryFn: () =>
      templatesApi.list({ page, limit: 25, ...(search.trim() ? { search: search.trim() } : {}) }),
  });

  return (
    <RoutePermission permission={PERMISSION.templatesRead}>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Review bodies and channel metadata.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium">
            Search
            <Input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); }}
              placeholder="Name contains…"
            />
          </label>
          <Button type="button" variant="outline" onClick={() => void query.refetch()}>
            Refresh
          </Button>
        </div>
        <QueryState
          isLoading={query.isPending}
          error={query.error}
          isEmpty={query.data?.items.length === 0}
          emptyMessage="No templates found."
        >
          {query.data ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Channel</th>
                    <th className="px-3 py-2">Archived</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((t) => (
                    <tr key={t.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 font-medium">{t.name}</td>
                      <td className="px-3 py-2">{t.channelType}</td>
                      <td className="px-3 py-2">
                        <Badge tone={t.isArchived ? 'warning' : 'success'}>
                          {t.isArchived ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          className="font-medium text-slate-900 underline dark:text-slate-100"
                          href={`/templates/${t.id}`}
                        >
                          View
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
              onClick={() => { setPage((p: number) => p + 1); }}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </RoutePermission>
  );
}
