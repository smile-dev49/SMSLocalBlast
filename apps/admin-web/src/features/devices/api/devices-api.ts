import { httpRequest } from '@/core/network/http-client';

export interface DeviceRow {
  readonly id: string;
  readonly name: string;
  readonly platform: string;
  readonly status: string;
  readonly healthStatus: string;
  readonly isActive: boolean;
  readonly isPrimary: boolean;
  readonly phoneNumber: string | null;
  readonly dailySendLimit: number;
  readonly hourlySendLimit: number;
  readonly dailySentCount: number;
  readonly hourlySentCount: number;
  readonly lastSeenAt: string | null;
  readonly lastHeartbeatAt: string | null;
  readonly capabilities: unknown;
  readonly deviceIdentifier: string;
}

export interface DeviceListResponse {
  readonly items: readonly DeviceRow[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface ListDevicesQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly platform?: string;
  readonly status?: string;
  readonly isActive?: boolean;
}

function toQueryString(q: ListDevicesQuery): string {
  const p = new URLSearchParams();
  if (q.page !== undefined) p.set('page', String(q.page));
  if (q.limit !== undefined) p.set('limit', String(q.limit));
  if (q.search) p.set('search', q.search);
  if (q.platform) p.set('platform', q.platform);
  if (q.status) p.set('status', q.status);
  if (q.isActive !== undefined) p.set('isActive', String(q.isActive));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const devicesApi = {
  list: (query: ListDevicesQuery = {}) =>
    httpRequest<DeviceListResponse>(`/devices${toQueryString(query)}`),

  get: (deviceId: string) => httpRequest<DeviceRow>(`/devices/${deviceId}`),

  setPrimary: (deviceId: string) =>
    httpRequest<DeviceRow>(`/devices/${deviceId}/set-primary`, { method: 'POST', body: {} }),

  updateQuota: (
    deviceId: string,
    body: {
      readonly dailySendLimit?: number;
      readonly hourlySendLimit?: number;
      readonly isActive?: boolean;
      readonly status?: string;
    },
  ) => httpRequest<DeviceRow>(`/devices/${deviceId}/quota`, { method: 'PATCH', body }),
};
