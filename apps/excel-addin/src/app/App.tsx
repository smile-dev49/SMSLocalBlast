import { FluentProvider, Spinner, webLightTheme } from '@fluentui/react-components';

import { useAuthStore } from '@/core/auth/auth-store';
import { LoginScreen } from '@/features/auth/components/login-screen';
import { useAuthBootstrap } from '@/features/auth/hooks/use-auth-bootstrap';
import { AppShell } from '@/shared/layout/app-shell';

export function App(): JSX.Element {
  const { isLoading, isAuthenticated } = useAuthBootstrap();
  const me = useAuthStore((s) => s.me);

  if (isLoading) {
    return (
      <FluentProvider theme={webLightTheme}>
        <Spinner label="Loading session..." />
      </FluentProvider>
    );
  }
  if (!isAuthenticated || !me) {
    return (
      <FluentProvider theme={webLightTheme}>
        <LoginScreen />
      </FluentProvider>
    );
  }
  return <AppShell />;
}
