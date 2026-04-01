'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactElement } from 'react';

import { PERMISSION } from '@/core/auth/permissions';
import { formatDateTime } from '@/core/utils/format';
import { contactsApi } from '@/features/contacts/api/contacts-api';
import { QueryState } from '@/shared/components/query-state';
import { RoutePermission } from '@/shared/components/route-permission';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function ContactDetailPage(props: Readonly<{ contactId: string }>): ReactElement {
  const { contactId } = props;
  const query = useQuery({
    queryKey: ['contacts', 'detail', contactId],
    queryFn: () => contactsApi.get(contactId),
  });

  return (
    <RoutePermission permission={PERMISSION.contactsRead}>
      <div className="flex flex-col gap-4">
        <Link href="/contacts" className="text-sm text-slate-600 underline dark:text-slate-400">
          ← Contacts
        </Link>
        <QueryState isLoading={query.isPending} error={query.error} isEmpty={!query.data}>
          {query.data ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold">
                    {query.data.fullName ??
                      (`${query.data.firstName ?? ''} ${query.data.lastName ?? ''}`.trim() ||
                        'Contact')}
                  </h1>
                  <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
                    {query.data.normalizedPhoneNumber}
                  </p>
                </div>
                <Badge tone="neutral">{query.data.status}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>Email: {query.data.email ?? '—'}</p>
                    <p>Source: {query.data.source}</p>
                    <p>Created: {formatDateTime(query.data.createdAt)}</p>
                    <p>Last contacted: {formatDateTime(query.data.lastContactedAt)}</p>
                    <p>Opted out: {formatDateTime(query.data.optedOutAt)}</p>
                    <p>Blocked: {formatDateTime(query.data.blockedAt)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-700 dark:text-slate-300">
                    {query.data.notes ?? '—'}
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Custom fields</CardTitle>
                </CardHeader>
                <CardContent>
                  {query.data.customFields.length === 0 ? (
                    <p className="text-sm text-slate-500">No custom fields</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {query.data.customFields.map((f) => (
                        <li key={`${f.fieldKey}-${f.fieldValue}`}>
                          <span className="font-medium">{f.fieldKey}</span>: {f.fieldValue}{' '}
                          <span className="text-xs text-slate-500">({f.valueType})</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </QueryState>
      </div>
    </RoutePermission>
  );
}
