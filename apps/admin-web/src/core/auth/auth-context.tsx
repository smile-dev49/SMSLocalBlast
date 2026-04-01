'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authEvents } from '@/core/auth/auth-events';
import type { MeResponse } from '@/core/auth/types';
import { authApi } from '@/features/auth/api/auth-api';
import { tokenStorage } from '@/core/storage/token-storage';

interface AuthContextValue {
  readonly me: MeResponse | null;
  readonly isReady: boolean;
  readonly login: (email: string, password: string) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshMe = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setMe(null);
      return;
    }
    const profile = await authApi.me();
    setMe(profile);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refreshMe();
      } catch {
        tokenStorage.clear();
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- cancelled toggled in effect cleanup
        if (!cancelled) setMe(null);
      } finally {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- cancelled toggled in effect cleanup
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  useEffect(() => {
    return authEvents.subscribeUnauthorized(() => {
      setMe(null);
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await authApi.login({ email, password });
      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      await refreshMe();
    },
    [refreshMe],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* still clear local session */
    }
    tokenStorage.clear();
    setMe(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      me,
      isReady,
      login,
      logout,
      refreshMe,
    }),
    [isReady, login, logout, me, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
