import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MessageQueueMetricsService } from './message-queue-metrics.service';
import { MessageRecoveryService } from './message-recovery.service';
import { MessagesRepository } from './messages.repository';

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recovery: MessageRecoveryService,
    private readonly repo: MessagesRepository,
    private readonly config: ConfigService,
    @Optional() private readonly metrics?: MessageQueueMetricsService,
  ) {}

  queueSummary() {
    if (!this.metrics) return Promise.resolve({ QUEUES_DISABLED: 1 });
    return this.metrics.queueSummary();
  }

  queueLag() {
    if (!this.metrics) return Promise.resolve({ queue: 'messages', counts: {} });
    return this.metrics.queueLag();
  }

  async stuckMessages(limit: number) {
    const threshold = this.config.getOrThrow<number>('queue.message.dispatchStuckThresholdSeconds');
    const staleAt = new Date(Date.now() - threshold * 1000);
    return this.repo.findStuckDispatching(staleAt, limit);
  }

  deadLetterMessages(limit: number) {
    if (!this.metrics) return Promise.resolve([]);
    return this.metrics.deadLetterItems(limit);
  }

  campaignsProcessing(limit: number) {
    if (!this.metrics) return Promise.resolve([]);
    return this.metrics.campaignsProcessing(limit);
  }

  async devicesAvailability() {
    const all = await this.prisma.device.count({ where: { deletedAt: null } });
    const eligible = await this.prisma.device.count({
      where: {
        deletedAt: null,
        isActive: true,
        status: 'ONLINE',
        NOT: { healthStatus: 'CRITICAL' },
      },
    });
    return { all, eligible, unavailable: all - eligible };
  }

  recoverStuckMessages() {
    return this.recovery.runRecoverySweep();
  }

  reconcileProcessingCampaigns() {
    return this.repo.finalizeProcessingCampaignsIfTerminal();
  }
}
