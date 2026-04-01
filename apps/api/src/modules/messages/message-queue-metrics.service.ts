import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QUEUE_MESSAGES } from '../../infrastructure/queue/queue.constants';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class MessageQueueMetricsService {
  constructor(
    @InjectQueue(QUEUE_MESSAGES) private readonly messagesQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async queueSummary(): Promise<Record<string, number>> {
    const counts = await this.prisma.outboundMessage.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    return counts.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});
  }

  async queueLag() {
    const counts = await this.messagesQueue.getJobCounts(
      'active',
      'completed',
      'delayed',
      'failed',
      'waiting',
      'paused',
      'prioritized',
    );
    return {
      queue: QUEUE_MESSAGES,
      counts,
    };
  }

  async deadLetterItems(limit = 200): Promise<
    readonly {
      readonly id: string;
      readonly status: string;
      readonly failureCode: string | null;
      readonly failureReason: string | null;
      readonly updatedAt: Date;
      readonly metadata: unknown;
    }[]
  > {
    return this.prisma.outboundMessage.findMany({
      where: { failureCode: 'DEAD_LETTER' },
      select: {
        id: true,
        status: true,
        failureCode: true,
        failureReason: true,
        updatedAt: true,
        metadata: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async campaignsProcessing(limit = 200): Promise<
    readonly {
      readonly id: string;
      readonly organizationId: string;
      readonly name: string;
      readonly startedAt: Date | null;
      readonly updatedAt: Date;
    }[]
  > {
    return this.prisma.campaign.findMany({
      where: { status: 'PROCESSING', deletedAt: null },
      select: { id: true, organizationId: true, name: true, startedAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }
}
