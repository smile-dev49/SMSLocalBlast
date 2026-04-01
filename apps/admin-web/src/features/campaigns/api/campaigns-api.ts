import { httpRequest } from '@/core/network/http-client';

/** Campaign as returned by the API (JSON; dates are ISO strings). */
export interface CampaignDto {
  readonly id: string;
  readonly organizationId: string;
  readonly createdByUserId: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly status: string;
  readonly templateId: string | null;
  readonly template: {
    readonly id: string;
    readonly name: string;
    readonly channelType: string;
  } | null;
  readonly scheduledAt: string | null;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly cancelledAt: string | null;
  readonly pausedAt: string | null;
  readonly failureReason: string | null;
  readonly timezone: string | null;
  readonly metadata: unknown;
  readonly target: {
    readonly contactIds: readonly string[];
    readonly contactListIds: readonly string[];
  };
  readonly missingVariableStrategy: string;
  readonly recipientCount: number;
  readonly readyCount: number;
  readonly sentCount: number;
  readonly deliveredCount: number;
  readonly failedCount: number;
  readonly skippedCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CampaignListResponse {
  readonly items: readonly CampaignDto[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface CampaignSummaryResponse {
  readonly campaign: CampaignDto;
  readonly recipientCountsByStatus: Record<string, number>;
  readonly skipReasons: Record<string, number>;
}

export interface CampaignStatusEventRow {
  readonly id: string;
  readonly outboundMessageId: string;
  readonly fromStatus: string | null;
  readonly toStatus: string;
  readonly reason: string | null;
  readonly createdAt: string;
}

export const campaignsApi = {
  list: (
    params: { readonly page?: number; readonly limit?: number; readonly status?: string } = {},
  ) => {
    const p = new URLSearchParams();
    if (params.page !== undefined) p.set('page', String(params.page));
    if (params.limit !== undefined) p.set('limit', String(params.limit));
    if (params.status) p.set('status', params.status);
    const qs = p.toString();
    return httpRequest<CampaignListResponse>(`/campaigns${qs ? `?${qs}` : ''}`);
  },

  get: (campaignId: string) => httpRequest<CampaignDto>(`/campaigns/${campaignId}`),

  summary: (campaignId: string) =>
    httpRequest<CampaignSummaryResponse>(`/campaigns/${campaignId}/summary`),

  events: (campaignId: string) =>
    httpRequest<readonly CampaignStatusEventRow[]>(`/campaigns/${campaignId}/events`),

  start: (campaignId: string) =>
    httpRequest<CampaignDto>(`/campaigns/${campaignId}/start`, { method: 'POST', body: {} }),

  pause: (campaignId: string) =>
    httpRequest<CampaignDto>(`/campaigns/${campaignId}/pause`, { method: 'POST', body: {} }),

  cancel: (campaignId: string) =>
    httpRequest<CampaignDto>(`/campaigns/${campaignId}/cancel`, { method: 'POST', body: {} }),
};
