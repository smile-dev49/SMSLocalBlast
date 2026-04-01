import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { hasPermission, PERMISSION } from '@/core/auth/permissions';
import { useAuth } from '@/core/auth/auth-context';
import { billingApi } from '@/features/billing/api/billing-api';
import { campaignsApi } from '@/features/campaigns/api/campaigns-api';
import { devicesApi } from '@/features/devices/api/devices-api';
import { operationsApi } from '@/features/operations/api/operations-api';

import type { LaunchReadinessHints } from '../launch-checklist-model';

export function useLaunchReadinessHints(): LaunchReadinessHints {
  const { me } = useAuth();
  const perms = me?.permissions;
  const canDevices = hasPermission(perms, PERMISSION.devicesRead);
  const canCampaigns = hasPermission(perms, PERMISSION.campaignsRead);
  const canBilling = hasPermission(perms, PERMISSION.billingRead);
  const canOps = hasPermission(perms, PERMISSION.operationsRead);

  const results = useQueries({
    queries: [
      {
        queryKey: ['launch-checklist', 'devices'],
        queryFn: () => devicesApi.list({ page: 1, limit: 100 }),
        enabled: canDevices,
      },
      {
        queryKey: ['launch-checklist', 'campaigns'],
        queryFn: () => campaignsApi.list({ page: 1, limit: 20 }),
        enabled: canCampaigns,
      },
      {
        queryKey: ['launch-checklist', 'billing-me'],
        queryFn: () => billingApi.me(),
        enabled: canBilling,
      },
      {
        queryKey: ['launch-checklist', 'queue'],
        queryFn: () => operationsApi.queueSummary(),
        enabled: canOps,
      },
      {
        queryKey: ['launch-checklist', 'devices-availability'],
        queryFn: () => operationsApi.devicesAvailability(),
        enabled: canOps,
      },
    ],
  });

  const [devicesQ, campaignsQ, billingQ, queueQ, availQ] = results;

  const hintsLoading =
    (canDevices && devicesQ.isPending) ||
    (canCampaigns && campaignsQ.isPending) ||
    (canBilling && billingQ.isPending) ||
    (canOps && (queueQ.isPending || availQ.isPending));

  const hintsError = results.some((r) => r.error);

  return useMemo((): LaunchReadinessHints => {
    let devicesSampleOnline: number | null = null;
    let devicesSampleTotal: number | null = null;
    if (canDevices) {
      if (devicesQ.data) {
        devicesSampleTotal = devicesQ.data.items.length;
        devicesSampleOnline = devicesQ.data.items.filter((d) => d.status === 'ONLINE').length;
      } else if (!devicesQ.isPending) {
        devicesSampleOnline = null;
        devicesSampleTotal = null;
      }
    }

    let recentCampaignCount: number | null = null;
    if (canCampaigns && campaignsQ.data) {
      recentCampaignCount = campaignsQ.data.total;
    }

    let subscriptionStatus: string | null = null;
    if (canBilling && billingQ.data) {
      subscriptionStatus = billingQ.data.subscription?.status ?? 'NO_SUBSCRIPTION';
    }

    let queueQueuedLike: number | null = null;
    if (canOps && queueQ.data) {
      const q = queueQ.data;
      queueQueuedLike = (q['QUEUED'] ?? 0) + (q['PENDING'] ?? 0) + (q['SCHEDULED'] ?? 0);
    }

    let eligibleDevices: number | null = null;
    if (canOps && availQ.data) {
      eligibleDevices = availQ.data.eligible;
    }

    return {
      devicesSampleOnline,
      devicesSampleTotal,
      subscriptionStatus,
      recentCampaignCount,
      queueQueuedLike,
      eligibleDevices,
      hintsLoading,
      hintsError,
    };
  }, [
    availQ.data,
    billingQ.data,
    campaignsQ.data,
    canBilling,
    canCampaigns,
    canDevices,
    canOps,
    devicesQ.data,
    devicesQ.isPending,
    hintsError,
    hintsLoading,
    queueQ.data,
  ]);
}
