import { httpRequest } from '@/core/network/http-client';

export const dashboardApi = {
  devices: () =>
    httpRequest<{ items: { id: string; name: string; status: string }[] }>(
      '/devices?page=1&limit=10',
    ),
  campaigns: () =>
    httpRequest<{ items: { id: string; name: string; status: string; sentCount: number }[] }>(
      '/campaigns?page=1&limit=5',
    ),
  messages: () =>
    httpRequest<{ items: { id: string; status: string }[] }>('/messages?page=1&limit=10'),
};
