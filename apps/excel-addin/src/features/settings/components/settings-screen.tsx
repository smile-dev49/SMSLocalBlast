import { Button, Card, Text } from '@fluentui/react-components';

import { runtimeConfig } from '@/core/config/env';
import { useAuthStore } from '@/core/auth/auth-store';

export function SettingsScreen(): JSX.Element {
  const logout = useAuthStore((s) => s.logout);
  return (
    <Card>
      <Text size={500} weight="semibold">
        Settings
      </Text>
      <Text>API: {runtimeConfig.apiBaseUrl}</Text>
      <Text>Environment: {runtimeConfig.env}</Text>
      <Button onClick={logout}>Logout</Button>
    </Card>
  );
}
