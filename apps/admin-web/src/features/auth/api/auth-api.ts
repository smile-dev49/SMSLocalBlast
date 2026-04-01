import type { MeResponse, SafeSession } from '@/core/auth/types';
import { httpRequest } from '@/core/network/http-client';

export interface LoginBody {
  readonly email: string;
  readonly password: string;
}

export interface TokensResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export const authApi = {
  login: (body: LoginBody) =>
    httpRequest<TokensResponse>('/auth/login', { method: 'POST', body, auth: false }),

  me: () => httpRequest<MeResponse>('/auth/me'),

  logout: () => httpRequest<undefined>('/auth/logout', { method: 'POST' }),

  logoutAll: () =>
    httpRequest<{ keptSessionId: string; revokedSessionIds: string[] }>('/auth/logout-all', {
      method: 'POST',
    }),

  listSessions: () => httpRequest<{ sessions: SafeSession[] }>('/auth/sessions'),

  revokeSession: (sessionId: string) =>
    httpRequest<undefined>(`/auth/sessions/${sessionId}`, { method: 'DELETE' }),
};
