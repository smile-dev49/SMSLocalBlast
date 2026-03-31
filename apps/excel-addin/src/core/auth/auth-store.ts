import { create } from 'zustand';

import { sessionStorageService } from '@/core/storage/session-storage';

export interface MeResponse {
  user: { id: string; email: string; firstName: string; lastName: string };
  organization?: { id: string; name: string; slug: string };
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  me: MeResponse | null;
  setTokens: (access: string, refresh: string) => void;
  setMe: (me: MeResponse | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: sessionStorageService.getAccessToken(),
  refreshToken: sessionStorageService.getRefreshToken(),
  me: null,
  setTokens: (accessToken, refreshToken) => {
    sessionStorageService.setTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken });
  },
  setMe: (me) => { set({ me }); },
  logout: () => {
    sessionStorageService.clear();
    set({ accessToken: null, refreshToken: null, me: null });
  },
}));
