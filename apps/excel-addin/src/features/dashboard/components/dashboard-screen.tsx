import { Card, Text } from '@fluentui/react-components';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/core/auth/auth-store';
import { dashboardApi } from '@/features/dashboard/api/dashboard-api';

export function DashboardScreen(): JSX.Element {
  const me = useAuthStore((s) => s.me);
  const devices = useQuery({ queryKey: ['dashboard', 'devices'], queryFn: dashboardApi.devices });
  const campaigns = useQuery({
    queryKey: ['dashboard', 'campaigns'],
    queryFn: dashboardApi.campaigns,
  });
  const messages = useQuery({
    queryKey: ['dashboard', 'messages'],
    queryFn: dashboardApi.messages,
  });

  return (
    <Card>
      <Text size={500} weight="semibold">
        Dashboard
      </Text>
      <Text>
        User: {me?.user.email ?? 'Unknown'} · Org: {me?.organization?.name ?? 'No active org'}
      </Text>
      <Text>Connected devices: {devices.data?.items.length ?? 0}</Text>
      <Text>Recent campaigns: {campaigns.data?.items.length ?? 0}</Text>
      <Text>Recent messages: {messages.data?.items.length ?? 0}</Text>
    </Card>
  );
}
