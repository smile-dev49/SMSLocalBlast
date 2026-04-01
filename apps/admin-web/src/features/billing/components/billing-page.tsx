'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactElement } from 'react';

import { PERMISSION } from '@/core/auth/permissions';
import { billingApi } from '@/features/billing/api/billing-api';
import { RoutePermission } from '@/shared/components/route-permission';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

export function BillingPage(): ReactElement {
  const plansQ = useQuery({ queryKey: ['billing', 'plans'], queryFn: () => billingApi.plans() });
  const meQ = useQuery({ queryKey: ['billing', 'me'], queryFn: () => billingApi.me() });

  const checkout = useMutation({
    mutationFn: async (planCode: string) => billingApi.checkoutSession({ planCode }),
    onSuccess: (res) => {
      if (res.url) window.location.href = res.url;
    },
  });
  const portal = useMutation({
    mutationFn: async () => billingApi.portalSession(),
    onSuccess: (res) => {
      if (res.url) window.location.href = res.url;
    },
  });

  const me = meQ.data;
  const plans = plansQ.data ?? [];
  const status = me?.subscription?.status ?? 'NO_SUBSCRIPTION';

  return (
    <RoutePermission permission={PERMISSION.billingRead}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Help:{' '}
          <Link className="text-sky-700 underline dark:text-sky-400" href="/docs/billing">
            Billing guide
          </Link>
          {' · '}
          <Link className="text-sky-700 underline dark:text-sky-400" href="/docs/troubleshooting">
            Billing and errors
          </Link>
        </p>
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Current Subscription</h2>
            <Badge>{status}</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Plan: {me?.subscription?.planName ?? 'Free'} ({me?.subscription?.planCode ?? 'free'})
          </p>
          <p className="text-sm text-slate-600">
            Period end: {me?.subscription?.currentPeriodEnd ?? 'N/A'}
          </p>
          <div className="mt-3">
            <Button
              type="button"
              onClick={() => {
                portal.mutate();
              }}
              disabled={portal.isPending}
              className="mr-2"
            >
              Open Billing Portal
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-lg font-semibold">Plans</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.code} className="rounded border p-3">
                <p className="font-medium">{plan.name}</p>
                <p className="text-xs text-slate-600">{plan.description ?? '—'}</p>
                <p className="text-xs text-slate-600">Interval: {plan.interval ?? 'N/A'}</p>
                <Button
                  type="button"
                  className="mt-2"
                  onClick={() => {
                    checkout.mutate(plan.code);
                  }}
                  disabled={checkout.isPending}
                >
                  Choose {plan.name}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 text-lg font-semibold">Usage Snapshot</h2>
          <pre className="overflow-auto text-xs">
            {JSON.stringify(me?.usageCounters ?? {}, null, 2)}
          </pre>
        </Card>
      </div>
    </RoutePermission>
  );
}
