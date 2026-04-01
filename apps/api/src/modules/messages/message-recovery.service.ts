import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueProducerService } from '../../infrastructure/queue/queue-producer.service';
import { MessageQueueService } from './message-queue.service';
import { MessageRetryPolicyService } from './message-retry-policy.service';
import { MessagesRepository } from './messages.repository';
import { MessageExecutionService } from './message-execution.service';

@Injectable()
export class MessageRecoveryService implements OnModuleInit {
  private readonly logger = new Logger(MessageRecoveryService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly repo: MessagesRepository,
    private readonly queue: MessageQueueService,
    private readonly retryPolicy: MessageRetryPolicyService,
    private readonly execution: MessageExecutionService,
    @Optional() private readonly queueProducer?: QueueProducerService,
  ) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.config.getOrThrow<boolean>('queue.enabled');
    if (!enabled) return;
    const sweepSeconds = this.config.getOrThrow<number>('queue.message.recoverySweepSeconds');
    if (this.queueProducer) {
      await this.queueProducer.enqueueRetryDueSweep({
        repeat: { every: sweepSeconds * 1000 },
      });
      await this.queueProducer.enqueueRecoverySweep({
        repeat: { every: sweepSeconds * 1000 },
      });
    }
  }

  async requeueDueRetries(limit?: number): Promise<number> {
    const batchSize = limit ?? this.config.getOrThrow<number>('queue.message.retryBatchSize');
    const now = new Date();
    const rows = await this.repo.findDueRetries(now, batchSize);
    for (const row of rows) {
      await this.queue.reopenFailedToReadyAndEnqueue({
        messageId: row.id,
        organizationId: row.organizationId,
        reason: 'retry.due',
      });
    }
    return rows.length;
  }

  async runRecoverySweep(): Promise<{
    readonly stuckDispatching: number;
    readonly callbackTimeouts: number;
    readonly campaignsFinalized: number;
  }> {
    const dispatchThresholdSeconds = this.config.getOrThrow<number>(
      'queue.message.dispatchStuckThresholdSeconds',
    );
    const callbackTimeoutSeconds = this.config.getOrThrow<number>(
      'queue.message.callbackTimeoutSeconds',
    );
    const now = Date.now();
    const dispatchBefore = new Date(now - dispatchThresholdSeconds * 1000);
    const callbackBefore = new Date(now - callbackTimeoutSeconds * 1000);

    const stuckDispatching = await this.repo.findStuckDispatching(dispatchBefore, 200);
    let recoveredDispatching = 0;
    for (const row of stuckDispatching) {
      const nextRetryCount = row.retryCount + 1;
      if (
        !this.retryPolicy.shouldRetry({
          category: 'QUEUE_STUCK',
          retryCount: row.retryCount,
          maxRetries: row.maxRetries,
        })
      ) {
        await this.execution.transitionMessageStatus({
          messageId: row.id,
          organizationId: row.organizationId,
          toStatus: 'FAILED',
          reason: 'dispatch.stuck.max-retries',
        });
        continue;
      }
      await this.queue.scheduleRetry({
        messageId: row.id,
        organizationId: row.organizationId,
        reason: 'dispatch.stuck',
        retryCount: nextRetryCount,
        nextRetryAt: this.retryPolicy.nextRetryAt(nextRetryCount),
      });
      recoveredDispatching += 1;
    }

    const callbackStale = await this.repo.findDispatchWithoutCallback(callbackBefore, 200);
    let recoveredCallback = 0;
    for (const row of callbackStale) {
      const nextRetryCount = row.retryCount + 1;
      if (
        !this.retryPolicy.shouldRetry({
          category: 'CALLBACK_TIMEOUT',
          retryCount: row.retryCount,
          maxRetries: row.maxRetries,
        })
      ) {
        await this.execution.transitionMessageStatus({
          messageId: row.id,
          organizationId: row.organizationId,
          toStatus: 'FAILED',
          reason: 'callback.timeout.max-retries',
        });
        continue;
      }
      await this.queue.scheduleRetry({
        messageId: row.id,
        organizationId: row.organizationId,
        reason: 'callback.timeout',
        retryCount: nextRetryCount,
        nextRetryAt: this.retryPolicy.nextRetryAt(nextRetryCount),
      });
      recoveredCallback += 1;
    }

    const campaignsFinalized = await this.repo.finalizeProcessingCampaignsIfTerminal();
    this.logger.log({
      msg: 'messages.recovery.sweep',
      recoveredDispatching,
      recoveredCallback,
      campaignsFinalized,
    });
    return {
      stuckDispatching: recoveredDispatching,
      callbackTimeouts: recoveredCallback,
      campaignsFinalized,
    };
  }
}
