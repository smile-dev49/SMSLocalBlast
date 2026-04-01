const ACCESS = 'smslb_admin_access_token';
const REFRESH = 'smslb_admin_refresh_token';

export const tokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS);
  },
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH);
  },
  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACCESS, accessToken);
    window.localStorage.setItem(REFRESH, refreshToken);
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(ACCESS);
    window.localStorage.removeItem(REFRESH);
  },
};
