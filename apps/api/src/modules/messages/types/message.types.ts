import type { MessageDirection, MessageStatus, Prisma } from '@prisma/client';

export interface MessageResponse {
  readonly id: string;
  readonly organizationId: string;
  readonly campaignId: string | null;
  readonly campaignRecipientId: string | null;
  readonly deviceId: string | null;
  readonly contactId: string | null;
  readonly channelType: 'SMS' | 'MMS';
  readonly direction: MessageDirection;
  readonly normalizedPhoneNumber: string;
  readonly renderedBody: string;
  readonly mediaUrl: string | null;
  readonly status: MessageStatus;
  readonly failureCode: string | null;
  readonly failureReason: string | null;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly nextRetryAt: Date | null;
  readonly scheduledAt: Date | null;
  readonly queuedAt: Date | null;
  readonly dispatchingAt: Date | null;
  readonly dispatchedAt: Date | null;
  readonly sentAt: Date | null;
  readonly deliveredAt: Date | null;
  readonly failedAt: Date | null;
  readonly cancelledAt: Date | null;
  readonly providerReference: string | null;
  readonly lastStatusAt: Date | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MessageDetailResponse {
  readonly message: MessageResponse;
  readonly eventsCount: number;
}

export interface MessageStatusEventResponse {
  readonly id: string;
  readonly fromStatus: MessageStatus | null;
  readonly toStatus: MessageStatus;
  readonly reason: string | null;
  readonly metadata: Prisma.JsonValue | null;
  readonly createdAt: Date;
}

export interface MessageEventsResponse {
  readonly messageId: string;
  readonly events: readonly MessageStatusEventResponse[];
}

export interface MessageOperationResponse {
  readonly messageId: string;
  readonly status: MessageStatus;
}

export interface MessageListResponse {
  readonly items: readonly MessageResponse[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface DeviceGatewayPrincipal {
  readonly deviceId: string;
  readonly organizationId: string;
  readonly deviceIdentifier: string;
}
