const ACCESS_TOKEN_KEY = 'smslb_access_token';
const REFRESH_TOKEN_KEY = 'smslb_refresh_token';

export const sessionStorageService = {
  getAccessToken(): string | null {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(accessToken: string, refreshToken: string): void {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear(): void {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
