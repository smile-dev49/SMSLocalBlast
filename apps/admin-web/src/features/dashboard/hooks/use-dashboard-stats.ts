import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { hasPermission, PERMISSION } from '@/core/auth/permissions';
import { useAuth } from '@/core/auth/auth-context';
import { campaignsApi } from '@/features/campaigns/api/campaigns-api';
import { devicesApi } from '@/features/devices/api/devices-api';
import { messagesApi } from '@/features/messages/api/messages-api';
import { operationsApi } from '@/features/operations/api/operations-api';

import type { DashboardStat } from '@/features/dashboard/components/dashboard-summary-view';

export function useDashboardStats(): {
  readonly stats: readonly DashboardStat[];
  readonly isLoading: boolean;
  readonly error: unknown;
} {
  const { me } = useAuth();
  const perms = me?.permissions;
  const canDevices = hasPermission(perms, PERMISSION.devicesRead);
  const canCampaigns = hasPermission(perms, PERMISSION.campaignsRead);
  const canMessages = hasPermission(perms, PERMISSION.messagesRead);
  const canOps = hasPermission(perms, PERMISSION.operationsRead);

  const results = useQueries({
    queries: [
      {
        queryKey: ['devices', 'dashboard', { page: 1, limit: 200 }],
        queryFn: () => devicesApi.list({ page: 1, limit: 200 }),
        enabled: canDevices,
      },
      {
        queryKey: ['campaigns', 'dashboard', { page: 1, limit: 50 }],
        queryFn: () => campaignsApi.list({ page: 1, limit: 50 }),
        enabled: canCampaigns,
      },
      {
        queryKey: ['messages', 'dashboard', { page: 1, limit: 50 }],
        queryFn: () => messagesApi.list({ page: 1, limit: 50 }),
        enabled: canMessages,
      },
      {
        queryKey: ['operations', 'queues', 'summary'],
        queryFn: () => operationsApi.queueSummary(),
        enabled: canOps,
      },
      {
        queryKey: ['operations', 'messages', 'stuck'],
        queryFn: () => operationsApi.stuckMessages(),
        enabled: canOps,
      },
      {
        queryKey: ['operations', 'devices', 'availability'],
        queryFn: () => operationsApi.devicesAvailability(),
        enabled: canOps,
      },
    ],
  });

  const [devicesQ, campaignsQ, messagesQ, queueQ, stuckQ, availQ] = results;

  const isLoading =
    (canDevices && devicesQ.isPending) ||
    (canCampaigns && campaignsQ.isPending) ||
    (canMessages && messagesQ.isPending) ||
    (canOps && (queueQ.isPending || stuckQ.isPending || availQ.isPending));

  const error = results.find((r) => r.error)?.error;

  const stats = useMemo((): readonly DashboardStat[] => {
    const out: DashboardStat[] = [];

    if (canDevices) {
      if (devicesQ.data) {
        const items = devicesQ.data.items;
        const total = devicesQ.data.total;
        const online = items.filter((d) => d.status === 'ONLINE').length;
        const primary = items.filter((d) => d.isPrimary).length;
        out.push({
          title: 'Devices',
          value: String(total),
          hint: `${String(online)} online in sample · ${String(primary)} primary in sample`,
        });
      } else if (!devicesQ.isPending) {
        out.push({ title: 'Devices', value: '—', hint: 'No data' });
      }
    }

    if (canCampaigns) {
      if (campaignsQ.data) {
        const items = campaignsQ.data.items;
        const byStatus = items.reduce<Record<string, number>>((acc, c) => {
          acc[c.status] = (acc[c.status] ?? 0) + 1;
          return acc;
        }, {});
        const statusHint = Object.entries(byStatus)
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join(' · ');
        out.push({
          title: 'Recent campaigns',
          value: String(campaignsQ.data.total),
          hint: statusHint || 'No campaigns in first page',
        });
      } else if (!campaignsQ.isPending) {
        out.push({ title: 'Recent campaigns', value: '—' });
      }
    }

    if (canMessages) {
      if (messagesQ.data) {
        const items = messagesQ.data.items;
        const byStatus = items.reduce<Record<string, number>>((acc, m) => {
          acc[m.status] = (acc[m.status] ?? 0) + 1;
          return acc;
        }, {});
        const hint = Object.entries(byStatus)
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join(' · ');
        out.push({
          title: 'Recent messages (page)',
          value: String(messagesQ.data.total),
          hint: hint || 'Statuses from first page',
        });
      } else if (!messagesQ.isPending) {
        out.push({ title: 'Recent messages', value: '—' });
      }
    }

    if (canOps) {
      if (queueQ.data) {
        const queued =
          (queueQ.data['QUEUED'] ?? 0) +
          (queueQ.data['PENDING'] ?? 0) +
          (queueQ.data['SCHEDULED'] ?? 0);
        const failed = queueQ.data['FAILED'] ?? 0;
        const retryable = queueQ.data['RETRYING'] ?? 0;
        out.push({
          title: 'Queue snapshot',
          value: `${String(queued)} queued / pending`,
          hint: `Failed ${String(failed)} · Retrying ${String(retryable)}`,
        });
      }
      if (stuckQ.data) {
        out.push({
          title: 'Stuck (dispatching)',
          value: String(stuckQ.data.length),
          hint: 'Messages dispatching over 5 minutes',
        });
      }
      if (availQ.data) {
        out.push({
          title: 'Device availability (global)',
          value: `${String(availQ.data.eligible)} eligible`,
          hint: `${String(availQ.data.unavailable)} unavailable of ${String(availQ.data.all)} total`,
        });
      }
    }

    const waiting =
      (canDevices && devicesQ.isPending) ||
      (canCampaigns && campaignsQ.isPending) ||
      (canMessages && messagesQ.isPending) ||
      (canOps && (queueQ.isPending || stuckQ.isPending || availQ.isPending));

    if (out.length === 0 && !waiting) {
      out.push({
        title: 'Visibility',
        value: '—',
        hint: 'Grant read access to devices, campaigns, messages, or operations to populate operational tiles.',
      });
    }

    return out;
  }, [
    availQ.data,
    availQ.isPending,
    campaignsQ.data,
    campaignsQ.isPending,
    canCampaigns,
    canDevices,
    canMessages,
    canOps,
    devicesQ.data,
    devicesQ.isPending,
    messagesQ.data,
    messagesQ.isPending,
    queueQ.data,
    queueQ.isPending,
    stuckQ.data,
    stuckQ.isPending,
  ]);

  return { stats, isLoading, error };
}
