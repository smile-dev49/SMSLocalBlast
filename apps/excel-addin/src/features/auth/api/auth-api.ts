import { httpRequest } from '@/core/network/http-client';
import type { MeResponse } from '@/core/auth/auth-store';

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  login: (body: LoginBody) =>
    httpRequest<LoginResponse>('/auth/login', { method: 'POST', body, auth: false }),
  me: () => httpRequest<MeResponse>('/auth/me'),
  logout: () => httpRequest<Record<string, never>>('/auth/logout', { method: 'POST' }),
};
