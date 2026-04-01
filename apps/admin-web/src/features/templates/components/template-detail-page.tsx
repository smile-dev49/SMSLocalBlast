'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactElement } from 'react';

import { PERMISSION } from '@/core/auth/permissions';
import { formatDateTime } from '@/core/utils/format';
import { templatesApi } from '@/features/templates/api/templates-api';
import { QueryState } from '@/shared/components/query-state';
import { RoutePermission } from '@/shared/components/route-permission';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export function TemplateDetailPage(props: Readonly<{ templateId: string }>): ReactElement {
  const { templateId } = props;
  const query = useQuery({
    queryKey: ['templates', 'detail', templateId],
    queryFn: () => templatesApi.get(templateId),
  });

  return (
    <RoutePermission permission={PERMISSION.templatesRead}>
      <div className="flex flex-col gap-4">
        <Link href="/templates" className="text-sm text-slate-600 underline dark:text-slate-400">
          ← Templates
        </Link>
        <QueryState isLoading={query.isPending} error={query.error} isEmpty={!query.data}>
          {query.data ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold">{query.data.name}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Template {query.data.id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge tone="neutral">{query.data.channelType}</Badge>
                  {query.data.isArchived ? <Badge tone="warning">Archived</Badge> : null}
                </div>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Body</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap rounded-md bg-slate-100 p-3 text-sm dark:bg-slate-900">
                    {query.data.body}
                  </pre>
                  <p className="mt-3 text-xs text-slate-500">
                    Placeholders follow template merge-field syntax configured in the API / Excel
                    tooling.
                  </p>
                </CardContent>
              </Card>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Created {formatDateTime(query.data.createdAt)}
              </p>
            </>
          ) : null}
        </QueryState>
      </div>
    </RoutePermission>
  );
}
