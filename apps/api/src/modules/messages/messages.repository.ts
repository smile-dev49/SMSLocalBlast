import { Injectable } from '@nestjs/common';
import type { MessageStatus, Prisma } from '@prisma/client';
import { createPaginatedResponse } from '../../common/utils/pagination';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { ListMessagesQuery } from './dto/list-messages.query.dto';
import {
  MessageAccessDeniedException,
  MessageNotFoundException,
} from './exceptions/messages.exceptions';
import type {
  MessageDetailResponse,
  MessageEventsResponse,
  MessageResponse,
  MessageStatusEventResponse,
} from './types/message.types';

const outboundMessageSelect = {
  id: true,
  organizationId: true,
  campaignId: true,
  campaignRecipientId: true,
  deviceId: true,
  contactId: true,
  channelType: true,
  direction: true,
  normalizedPhoneNumber: true,
  renderedBody: true,
  mediaUrl: true,
  status: true,
  failureCode: true,
  failureReason: true,
  retryCount: true,
  maxRetries: true,
  nextRetryAt: true,
  scheduledAt: true,
  queuedAt: true,
  dispatchingAt: true,
  dispatchedAt: true,
  sentAt: true,
  deliveredAt: true,
  failedAt: true,
  cancelledAt: true,
  providerReference: true,
  lastStatusAt: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.OutboundMessageSelect;

type OutboundMessageRow = Prisma.OutboundMessageGetPayload<{
  select: typeof outboundMessageSelect;
}>;

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  mapMessage(row: OutboundMessageRow): MessageResponse {
    return row;
  }

  async listMessagesForOrg(organizationId: string, query: ListMessagesQuery) {
    const where: Prisma.OutboundMessageWhereInput = {
      organizationId,
      ...(query.search
        ? { normalizedPhoneNumber: { contains: query.search, mode: 'insensitive' } }
        : {}),
      ...(query.campaignId ? { campaignId: query.campaignId } : {}),
      ...(query.deviceId ? { deviceId: query.deviceId } : {}),
      ...(query.contactId ? { contactId: query.contactId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const orderBy = {
      [query.sortBy]: query.sortOrder,
    } as Prisma.OutboundMessageOrderByWithRelationInput;
    const [total, rows] = await Promise.all([
      this.prisma.outboundMessage.count({ where }),
      this.prisma.outboundMessage.findMany({
        where,
        skip,
        take: query.limit,
        orderBy,
        select: outboundMessageSelect,
      }),
    ]);
    return createPaginatedResponse({
      items: rows.map((r) => this.mapMessage(r)),
      page: query.page,
      limit: query.limit,
      total,
    });
  }

  async getMessageDetailForOrg(
    organizationId: string,
    messageId: string,
  ): Promise<MessageDetailResponse> {
    const row = await this.prisma.outboundMessage.findUnique({
      where: { id: messageId },
      select: outboundMessageSelect,
    });
    if (!row) throw new MessageNotFoundException();
    if (row.organizationId !== organizationId) throw new MessageAccessDeniedException();
    const eventsCount = await this.prisma.messageStatusEvent.count({
      where: { outboundMessageId: messageId, organizationId },
    });
    return { message: this.mapMessage(row), eventsCount };
  }

  async getMessageEventsForOrg(
    organizationId: string,
    messageId: string,
  ): Promise<MessageEventsResponse> {
    const row = await this.prisma.outboundMessage.findUnique({
      where: { id: messageId },
      select: { id: true, organizationId: true },
    });
    if (!row) throw new MessageNotFoundException();
    if (row.organizationId !== organizationId) throw new MessageAccessDeniedException();
    const events = await this.prisma.messageStatusEvent.findMany({
      where: { outboundMessageId: messageId, organizationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        fromStatus: true,
        toStatus: true,
        reason: true,
        metadata: true,
        createdAt: true,
      },
    });
    const mapped: MessageStatusEventResponse[] = events.map((e) => e);
    return { messageId, events: mapped };
  }

  async getMessageById(messageId: string): Promise<OutboundMessageRow | null> {
    return this.prisma.outboundMessage.findUnique({
      where: { id: messageId },
      select: outboundMessageSelect,
    });
  }

  updateMessage(
    messageId: string,
    data: Prisma.OutboundMessageUncheckedUpdateInput,
  ): Promise<OutboundMessageRow> {
    return this.prisma.outboundMessage.update({
      where: { id: messageId },
      data,
      select: outboundMessageSelect,
    });
  }

  createGatewayReceipt(data: Prisma.MessageGatewayEventReceiptUncheckedCreateInput) {
    return this.prisma.messageGatewayEventReceipt.create({ data });
  }

  async hasGatewayReceipt(args: {
    readonly outboundMessageId: string;
    readonly eventType: string;
    readonly idempotencyKey: string;
  }): Promise<boolean> {
    const row = await this.prisma.messageGatewayEventReceipt.findFirst({
      where: {
        outboundMessageId: args.outboundMessageId,
        eventType: args.eventType,
        idempotencyKey: args.idempotencyKey,
      },
      select: { id: true },
    });
    return row !== null;
  }

  async refreshCampaignProgressFromMessages(campaignId: string): Promise<void> {
    const rows = await this.prisma.outboundMessage.findMany({
      where: { campaignId },
      select: { status: true },
    });
    const count = (status: MessageStatus): number => rows.filter((r) => r.status === status).length;
    const terminal = new Set<MessageStatus>(['DELIVERED', 'FAILED', 'CANCELLED', 'SKIPPED']);
    const allTerminal = rows.length > 0 && rows.every((r) => terminal.has(r.status));
    const deliveredCount = count('DELIVERED');
    const failedCount = count('FAILED');
    const sentCount = count('SENT') + deliveredCount;
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        sentCount,
        deliveredCount,
        failedCount,
        ...(allTerminal
          ? deliveredCount > 0
            ? { status: 'COMPLETED', completedAt: new Date() }
            : { status: 'FAILED', completedAt: new Date() }
          : {}),
      },
    });
  }

  findDueRetries(now: Date, limit: number) {
    return this.prisma.outboundMessage
      .findMany({
        where: {
          status: 'FAILED',
          nextRetryAt: { lte: now },
        },
        select: {
          id: true,
          organizationId: true,
          retryCount: true,
          maxRetries: true,
        },
        take: Math.max(1, limit * 2),
        orderBy: { nextRetryAt: 'asc' },
      })
      .then((rows) => rows.filter((row) => row.retryCount < row.maxRetries).slice(0, limit));
  }

  findStuckDispatching(before: Date, limit: number) {
    return this.prisma.outboundMessage.findMany({
      where: {
        status: 'DISPATCHING',
        dispatchingAt: { lt: before },
      },
      select: {
        id: true,
        organizationId: true,
        deviceId: true,
        dispatchingAt: true,
        retryCount: true,
        maxRetries: true,
      },
      take: limit,
      orderBy: { dispatchingAt: 'asc' },
    });
  }

  findDispatchWithoutCallback(before: Date, limit: number) {
    return this.prisma.outboundMessage.findMany({
      where: {
        status: 'DISPATCHED',
        dispatchedAt: { lt: before },
      },
      select: {
        id: true,
        organizationId: true,
        retryCount: true,
        maxRetries: true,
      },
      take: limit,
      orderBy: { dispatchedAt: 'asc' },
    });
  }

  async finalizeProcessingCampaignsIfTerminal(): Promise<number> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { status: 'PROCESSING', deletedAt: null },
      select: { id: true },
      take: 200,
    });
    let finalized = 0;
    for (const campaign of campaigns) {
      const statuses = await this.prisma.outboundMessage.findMany({
        where: { campaignId: campaign.id },
        select: { status: true },
      });
      if (statuses.length === 0) continue;
      const allTerminal = statuses.every((row) =>
        ['DELIVERED', 'FAILED', 'CANCELLED', 'SKIPPED'].includes(row.status),
      );
      if (!allTerminal) continue;
      const deliveredCount = statuses.filter((row) => row.status === 'DELIVERED').length;
      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: deliveredCount > 0 ? 'COMPLETED' : 'FAILED',
          completedAt: new Date(),
          deliveredCount,
          failedCount: statuses.filter((row) => row.status === 'FAILED').length,
          sentCount: statuses.filter((row) => row.status === 'SENT' || row.status === 'DELIVERED')
            .length,
        },
      });
      finalized += 1;
    }
    return finalized;
  }
}
