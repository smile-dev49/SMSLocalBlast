import { Injectable } from '@nestjs/common';
import type { MessageStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class MessageEventsService {
  constructor(private readonly prisma: PrismaService) {}

  createStatusEvent(args: {
    readonly organizationId: string;
    readonly outboundMessageId: string;
    readonly fromStatus: MessageStatus | null;
    readonly toStatus: MessageStatus;
    readonly reason?: string;
    readonly metadata?: Record<string, unknown>;
  }): Promise<void> {
    return this.prisma.messageStatusEvent
      .create({
        data: {
          organizationId: args.organizationId,
          outboundMessageId: args.outboundMessageId,
          fromStatus: args.fromStatus,
          toStatus: args.toStatus,
          reason: args.reason ?? null,
          metadata: (args.metadata ?? null) as unknown as Prisma.InputJsonValue,
        },
      })
      .then(() => undefined);
  }
}
