import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuthStore } from '@/core/auth/auth-store';
import { authApi } from '@/features/auth/api/auth-api';

export function useAuthBootstrap(): { isLoading: boolean; isAuthenticated: boolean } {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setMe = useAuthStore((s) => s.setMe);
  const logout = useAuthStore((s) => s.logout);

  const query = useQuery({
    queryKey: ['auth', 'me'],
    enabled: Boolean(accessToken),
    queryFn: authApi.me,
    retry: false,
  });

  useEffect(() => {
    if (query.data) setMe(query.data);
  }, [query.data, setMe]);

  useEffect(() => {
    if (query.error) logout();
  }, [query.error, logout]);

  return { isLoading: query.isLoading, isAuthenticated: Boolean(accessToken) };
}
