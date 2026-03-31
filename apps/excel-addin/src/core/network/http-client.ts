import { ApiError } from '@/core/errors/api-error';
import { runtimeConfig } from '@/core/config/env';
import { sessionStorageService } from '@/core/storage/session-storage';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: unknown;
  auth?: boolean;
}

export async function httpRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.auth !== false) {
    const token = sessionStorageService.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  };

  const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, requestInit);

  const data = (await response.json().catch(() => ({}))) as {
    error?: { message?: string; code?: string; details?: unknown };
  };
  if (!response.ok) {
    throw new ApiError(
      data.error?.message ?? `Request failed with status ${String(response.status)}`,
      response.status,
      data.error?.code,
      data.error?.details,
    );
  }
  return data as T;
}
