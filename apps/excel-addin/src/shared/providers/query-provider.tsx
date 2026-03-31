import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';

export function AppQueryProvider({ children }: PropsWithChildren): JSX.Element {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15000, refetchOnWindowFocus: false },
        },
      }),
    [],
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
