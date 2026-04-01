'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { PERMISSION } from '@/core/auth/permissions';
import { devicesApi } from '@/features/devices/api/devices-api';
import { DevicesTable } from '@/features/devices/components/devices-table';
import { QueryState } from '@/shared/components/query-state';
import { RoutePermission } from '@/shared/components/route-permission';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export function DevicesPage(): ReactElement {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [platform, setPlatform] = useState('');
  const [isActive, setIsActive] = useState('');
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['devices', 'list', { page, status, platform, isActive, search }],
    queryFn: () =>
      devicesApi.list({
        page,
        limit: 20,
        ...(status ? { status } : {}),
        ...(platform ? { platform } : {}),
        ...(isActive === 'true' ? { isActive: true } : {}),
        ...(isActive === 'false' ? { isActive: false } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      }),
  });

  return (
    <RoutePermission permission={PERMISSION.devicesRead}>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Devices</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Monitor connectivity, quotas, and health.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium">
            Search
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Name or identifier"
            />
          </label>
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
              <option value="PENDING">PENDING</option>
              <option value="ONLINE">ONLINE</option>
              <option value="OFFLINE">OFFLINE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="DISCONNECTED">DISCONNECTED</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Platform
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
              value={platform}
              onChange={(e) => {
                setPage(1);
                setPlatform(e.target.value);
              }}
            >
              <option value="">Any</option>
              <option value="ANDROID">ANDROID</option>
              <option value="IOS">IOS</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Active
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-900"
              value={isActive}
              onChange={(e) => {
                setPage(1);
                setIsActive(e.target.value);
              }}
            >
              <option value="">Any</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <Button type="button" variant="outline" onClick={() => void query.refetch()}>
            Refresh
          </Button>
        </div>
        <QueryState
          isLoading={query.isPending}
          error={query.error}
          isEmpty={query.data?.items.length === 0}
          emptyMessage="No devices match your filters."
          emptyExtra={
            <span className="text-slate-600 dark:text-slate-400">
              Need an eligible sender? See{' '}
              <Link
                className="text-sky-700 underline dark:text-sky-400"
                href="/docs/mobile-gateway"
              >
                Mobile gateway
              </Link>{' '}
              and{' '}
              <Link
                className="text-sky-700 underline dark:text-sky-400"
                href="/docs/troubleshooting"
              >
                Troubleshooting
              </Link>
              .
            </span>
          }
        >
          {query.data ? <DevicesTable devices={query.data.items} /> : null}
        </QueryState>
        {query.data && query.data.totalPages > 1 ? (
          <div className="flex items-center gap-2 text-sm">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => {
                setPage((p: number) => p - 1);
              }}
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
                setPage((p: number) => p + 1);
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
