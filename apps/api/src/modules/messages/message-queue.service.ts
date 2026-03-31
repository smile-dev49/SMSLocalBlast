import { Injectable, Optional } from '@nestjs/common';
import { QueueProducerService } from '../../infrastructure/queue/queue-producer.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MessageEventsService } from './message-events.service';

export interface DispatchJobPayload {
  readonly messageId: string;
  readonly organizationId: string;
  readonly campaignId: string | null;
  readonly campaignRecipientId: string | null;
  readonly deviceId: string | null;
}

@Injectable()
export class MessageQueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: MessageEventsService,
    @Optional() private readonly producer?: QueueProducerService,
  ) {}

  async enqueueDispatch(payload: DispatchJobPayload): Promise<void> {
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
      fromStatus: 'READY',
      toStatus: 'QUEUED',
      reason: 'queue.enqueue',
    });
    if (this.producer) {
      await this.producer.enqueueMessageStub(payload as unknown as Record<string, unknown>);
    }
  }

  async scheduleRetry(args: {
    readonly messageId: string;
    readonly organizationId: string;
    readonly reason: string;
    readonly retryCount: number;
    readonly nextRetryAt: Date;
  }): Promise<void> {
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
      fromStatus: 'DISPATCHING',
      toStatus: 'FAILED',
      reason: args.reason,
      metadata: { retryCount: args.retryCount, nextRetryAt: args.nextRetryAt.toISOString() },
    });
  }
}
