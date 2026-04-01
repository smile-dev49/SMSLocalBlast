import { Injectable, Logger, Optional } from '@nestjs/common';
import { QueueProducerService } from '../../infrastructure/queue/queue-producer.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MessageEventsService } from './message-events.service';
import { MessageRetryPolicyService } from './message-retry-policy.service';

export interface DispatchJobPayload {
  readonly messageId: string;
  readonly organizationId: string;
  readonly campaignId: string | null;
  readonly campaignRecipientId: string | null;
  readonly deviceId: string | null;
}

@Injectable()
export class MessageQueueService {
  private readonly logger = new Logger(MessageQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: MessageEventsService,
    private readonly retryPolicy: MessageRetryPolicyService,
    @Optional() private readonly producer?: QueueProducerService,
  ) {}

  async enqueueDispatch(payload: DispatchJobPayload): Promise<void> {
    const row = await this.prisma.outboundMessage.findUnique({
      where: { id: payload.messageId },
      select: { status: true, organizationId: true },
    });
    if (!row) return;
    if (row.status !== 'READY') {
      this.logger.log({
        msg: 'messages.queue.enqueue.skip-stale',
        messageId: payload.messageId,
        status: row.status,
      });
      return;
    }
    await this.prisma.outboundMessage.update({
      where: { id: payload.messageId },
      data: {
        status: 'QUEUED',
        queuedAt: new Date(),
        lastStatusAt: new Date(),
      },
    });
    await this.events.createStatusEvent({
      organizationId: payload.organizationId,
      outboundMessageId: payload.messageId,
      fromStatus: row.status,
      toStatus: 'QUEUED',
      reason: 'queue.enqueue',
    });
    if (this.producer) {
      await this.producer.enqueueMessageDispatch({
        messageId: payload.messageId,
        organizationId: payload.organizationId,
      });
    }
  }

  async scheduleRetry(args: {
    readonly messageId: string;
    readonly organizationId: string;
    readonly reason: string;
    readonly retryCount: number;
    readonly nextRetryAt: Date;
  }): Promise<void> {
    const row = await this.prisma.outboundMessage.findUnique({
      where: { id: args.messageId },
      select: { status: true, organizationId: true },
    });
    if (!row) return;
    await this.prisma.outboundMessage.update({
      where: { id: args.messageId },
      data: {
        retryCount: args.retryCount,
        nextRetryAt: args.nextRetryAt,
        status: 'FAILED',
        failedAt: new Date(),
        failureReason: args.reason,
        lastStatusAt: new Date(),
      },
    });
    await this.events.createStatusEvent({
      organizationId: args.organizationId,
      outboundMessageId: args.messageId,
      fromStatus: row.status,
      toStatus: 'FAILED',
      reason: args.reason,
      metadata: { retryCount: args.retryCount, nextRetryAt: args.nextRetryAt.toISOString() },
    });
  }

  async scheduleRetryWithPolicy(args: {
    readonly messageId: string;
    readonly organizationId: string;
    readonly reason: string;
    readonly retryCount: number;
  }): Promise<void> {
    await this.scheduleRetry({
      ...args,
      nextRetryAt: this.retryPolicy.nextRetryAt(args.retryCount),
    });
  }

  async reopenFailedToReadyAndEnqueue(args: {
    readonly messageId: string;
    readonly organizationId: string;
    readonly reason: string;
  }): Promise<void> {
    const row = await this.prisma.outboundMessage.findUnique({
      where: { id: args.messageId },
      select: {
        id: true,
        organizationId: true,
        status: true,
        campaignId: true,
        campaignRecipientId: true,
        deviceId: true,
      },
    });
    if (row?.organizationId !== args.organizationId) return;
    if (row.status !== 'FAILED' && row.status !== 'CANCELLED') return;
    await this.prisma.outboundMessage.update({
      where: { id: row.id },
      data: {
        status: 'READY',
        failedAt: null,
        cancelledAt: null,
        failureCode: null,
        failureReason: null,
        lastStatusAt: new Date(),
      },
    });
    await this.events.createStatusEvent({
      organizationId: row.organizationId,
      outboundMessageId: row.id,
      fromStatus: row.status,
      toStatus: 'READY',
      reason: args.reason,
    });
    await this.enqueueDispatch({
      messageId: row.id,
      organizationId: row.organizationId,
      campaignId: row.campaignId,
      campaignRecipientId: row.campaignRecipientId,
      deviceId: row.deviceId,
    });
  }
}
