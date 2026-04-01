import { authEvents } from '@/core/auth/auth-events';
import { publicEnv } from '@/core/config/env';
import { ApiError } from '@/core/errors/api-error';
import { tokenStorage } from '@/core/storage/token-storage';

export interface HttpRequestOptions {
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  readonly body?: unknown;
  /** Set false for login/register/refresh */
  readonly auth?: boolean;
}

interface ErrorBody {
  readonly success?: boolean;
  readonly error?: {
    readonly message?: string;
    readonly code?: string;
    readonly details?: unknown;
  };
}

export async function httpRequest<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.auth !== false) {
    const token = tokenStorage.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  };

  const response = await fetch(`${publicEnv.apiBaseUrl}${path}`, requestInit);

  if (response.status === 204) {
    return undefined as T;
  }

  const json: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      tokenStorage.clear();
      authEvents.emitUnauthorized();
    }
    const err = json as ErrorBody | null;
    throw new ApiError(
      err?.error?.message ?? `Request failed (${String(response.status)})`,
      response.status,
      err?.error?.code,
      err?.error?.details,
    );
  }

  if (json !== null && typeof json === 'object' && 'success' in json) {
    const envelope = json as ErrorBody;
    if (envelope.success === false) {
      throw new ApiError(
        envelope.error?.message ?? 'Request failed',
        response.status,
        envelope.error?.code,
        envelope.error?.details,
      );
    }
  }

  return json as T;
}
