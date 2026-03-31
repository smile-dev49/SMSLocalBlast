import { httpRequest } from '@/core/network/http-client';

export interface Campaign {
  id: string;
  name: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
}

export const campaignsApi = {
  list: () => httpRequest<{ items: Campaign[] }>('/campaigns?page=1&limit=20'),
  preview: (body: { templateId: string; target: { contactListIds: string[] } }) =>
    httpRequest<Record<string, unknown>>('/campaigns/preview', { method: 'POST', body }),
  create: (body: {
    name: string;
    templateId?: string;
    target: { contactListIds: string[] };
    scheduledAt?: string;
  }) => httpRequest<Campaign>('/campaigns', { method: 'POST', body }),
  summary: (campaignId: string) =>
    httpRequest<Record<string, unknown>>(`/campaigns/${campaignId}/summary`),
  start: (campaignId: string) =>
    httpRequest<Record<string, never>>(`/campaigns/${campaignId}/start`, { method: 'POST' }),
  schedule: (campaignId: string, scheduledAt: string) =>
    httpRequest<Record<string, never>>(`/campaigns/${campaignId}/schedule`, {
      method: 'POST',
      body: { scheduledAt },
    }),
  pause: (campaignId: string) =>
    httpRequest<Record<string, never>>(`/campaigns/${campaignId}/pause`, { method: 'POST' }),
  cancel: (campaignId: string) =>
    httpRequest<Record<string, never>>(`/campaigns/${campaignId}/cancel`, { method: 'POST' }),
};
