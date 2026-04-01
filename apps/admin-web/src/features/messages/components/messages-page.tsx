'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { PERMISSION } from '@/core/auth/permissions';
import { messagesApi } from '@/features/messages/api/messages-api';
import { MessagesTable } from '@/features/messages/components/messages-table';
import { QueryState } from '@/shared/components/query-state';
import { RoutePermission } from '@/shared/components/route-permission';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export function MessagesPage(): ReactElement {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [contactId, setContactId] = useState('');

  const query = useQuery({
    queryKey: ['messages', 'list', { page, status, search, campaignId, deviceId, contactId }],
    queryFn: () =>
      messagesApi.list({
        page,
        limit: 25,
        ...(status ? { status } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(campaignId.trim() ? { campaignId: campaignId.trim() } : {}),
        ...(deviceId.trim() ? { deviceId: deviceId.trim() } : {}),
        ...(contactId.trim() ? { contactId: contactId.trim() } : {}),
      }),
  });

  return (
    <RoutePermission permission={PERMISSION.messagesRead}>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Outbound queue visibility and operator actions.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium">
            Phone search
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); }}
              placeholder="E.164 or partial"
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
              <option value="READY">READY</option>
              <option value="QUEUED">QUEUED</option>
              <option value="DISPATCHING">DISPATCHING</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="SENT">SENT</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="FAILED">FAILED</option>
              <option value="SKIPPED">SKIPPED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Campaign ID
            <Input
              value={campaignId}
              onChange={(e) => { setCampaignId(e.target.value); }}
              placeholder="uuid"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Device ID
            <Input
              value={deviceId}
              onChange={(e) => { setDeviceId(e.target.value); }}
              placeholder="uuid"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium">
            Contact ID
            <Input
              value={contactId}
              onChange={(e) => { setContactId(e.target.value); }}
              placeholder="uuid"
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
          emptyMessage="No messages match your filters."
        >
          {query.data ? <MessagesTable messages={query.data.items} /> : null}
        </QueryState>
        {query.data && query.data.totalPages > 1 ? (
          <div className="flex items-center gap-2 text-sm">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => { setPage((p: number) => p - 1); }}
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
