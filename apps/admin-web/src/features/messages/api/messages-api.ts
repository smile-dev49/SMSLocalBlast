import { httpRequest } from '@/core/network/http-client';

export interface MessageRow {
  readonly id: string;
  readonly status: string;
  readonly normalizedPhoneNumber: string;
  readonly campaignId: string | null;
  readonly deviceId: string | null;
  readonly contactId: string | null;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly lastStatusAt: string | null;
  readonly failureCode: string | null;
  readonly createdAt: string;
}

export interface MessageEntity extends MessageRow {
  readonly organizationId: string;
  readonly campaignRecipientId: string | null;
  readonly channelType: string;
  readonly direction: string;
  readonly renderedBody: string;
  readonly mediaUrl: string | null;
  readonly failureReason: string | null;
  readonly nextRetryAt: string | null;
  readonly scheduledAt: string | null;
  readonly queuedAt: string | null;
  readonly dispatchingAt: string | null;
  readonly dispatchedAt: string | null;
  readonly sentAt: string | null;
  readonly deliveredAt: string | null;
  readonly failedAt: string | null;
  readonly cancelledAt: string | null;
  readonly providerReference: string | null;
  readonly metadata: unknown;
  readonly updatedAt: string;
}

export interface MessageDetailResponse {
  readonly message: MessageEntity;
  readonly eventsCount: number;
}

export interface MessageStatusEventRow {
  readonly id: string;
  readonly fromStatus: string | null;
  readonly toStatus: string;
  readonly reason: string | null;
  readonly metadata: unknown;
  readonly createdAt: string;
}

export interface MessageEventsResponse {
  readonly messageId: string;
  readonly events: readonly MessageStatusEventRow[];
}

export interface MessageListResponse {
  readonly items: readonly MessageRow[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface ListMessagesParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly campaignId?: string;
  readonly deviceId?: string;
  readonly contactId?: string;
  readonly status?: string;
}

function toQuery(params: ListMessagesParams): string {
  const p = new URLSearchParams();
  if (params.page !== undefined) p.set('page', String(params.page));
  if (params.limit !== undefined) p.set('limit', String(params.limit));
  if (params.search) p.set('search', params.search);
  if (params.campaignId) p.set('campaignId', params.campaignId);
  if (params.deviceId) p.set('deviceId', params.deviceId);
  if (params.contactId) p.set('contactId', params.contactId);
  if (params.status) p.set('status', params.status);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const messagesApi = {
  list: (params: ListMessagesParams = {}) =>
    httpRequest<MessageListResponse>(`/messages${toQuery(params)}`),

  get: (messageId: string) => httpRequest<MessageDetailResponse>(`/messages/${messageId}`),

  events: (messageId: string) =>
    httpRequest<MessageEventsResponse>(`/messages/${messageId}/events`),

  retry: (messageId: string, body: { readonly reason?: string } = {}) =>
    httpRequest<{ readonly messageId: string; readonly status: string }>(
      `/messages/${messageId}/retry`,
      { method: 'POST', body },
    ),

  cancel: (messageId: string, body: { readonly reason?: string } = {}) =>
    httpRequest<{ readonly messageId: string; readonly status: string }>(
      `/messages/${messageId}/cancel`,
      { method: 'POST', body },
    ),
};
