import { Injectable, Logger, Optional } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { QueueProducerService } from '../../infrastructure/queue/queue-producer.service';

@Injectable()
export class MessageDeadLetterService {
  private readonly logger = new Logger(MessageDeadLetterService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly queueProducer?: QueueProducerService,
  ) {}

  async moveToDeadLetter(args: {
    readonly messageId: string;
    readonly organizationId: string;
    readonly reason: string;
    readonly details?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.outboundMessage.update({
      where: { id: args.messageId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureCode: 'DEAD_LETTER',
        failureReason: args.reason,
        lastStatusAt: new Date(),
        metadata: {
          deadLetter: {
            reason: args.reason,
            movedAt: new Date().toISOString(),
            details: args.details ?? null,
          },
        } as unknown as Prisma.InputJsonValue,
      },
    });
    if (this.queueProducer) {
      await this.queueProducer.enqueueMessageDeadLetter({
        messageId: args.messageId,
        organizationId: args.organizationId,
        reason: args.reason,
        details: args.details ?? null,
        createdAt: new Date().toISOString(),
      });
    }
    this.logger.error({
      msg: 'messages.dead-letter.moved',
      messageId: args.messageId,
      organizationId: args.organizationId,
      reason: args.reason,
      details: args.details ?? null,
    });
  }
}
