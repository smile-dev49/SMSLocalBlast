import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JobsOptions, Queue } from 'bullmq';
import {
  MESSAGE_JOB_DEAD_LETTER,
  MESSAGE_JOB_DISPATCH,
  MESSAGE_JOB_RECOVERY_SWEEP,
  MESSAGE_JOB_RETRY_DUE,
  QUEUE_AUDIT,
  QUEUE_MESSAGES,
  QUEUE_SCHEDULES,
  QUEUE_WEBHOOKS,
} from './queue.constants';

const defaultJobOptions: JobsOptions = {
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

/**
 * Thin abstraction over BullMQ producers — domain modules should depend on this service, not on Queues directly.
 */
@Injectable()
export class QueueProducerService {
  private readonly deadLetterThreshold: number;

  constructor(
    @InjectQueue(QUEUE_MESSAGES) private readonly messagesQueue: Queue,
    @InjectQueue(QUEUE_SCHEDULES) private readonly schedulesQueue: Queue,
    @InjectQueue(QUEUE_WEBHOOKS) private readonly webhooksQueue: Queue,
    @InjectQueue(QUEUE_AUDIT) private readonly auditQueue: Queue,
    config: ConfigService,
  ) {
    this.deadLetterThreshold = config.getOrThrow<number>('queue.message.deadLetterThreshold');
  }

  async enqueueMessageDispatch(
    payload: { readonly messageId: string; readonly organizationId: string },
    opts: JobsOptions = {},
  ): Promise<void> {
    await this.messagesQueue.add(MESSAGE_JOB_DISPATCH, payload, {
      ...defaultJobOptions,
      attempts: this.deadLetterThreshold,
      jobId: `dispatch:${payload.messageId}`,
      ...opts,
    });
  }

  async enqueueRetryDueSweep(opts: JobsOptions = {}): Promise<void> {
    await this.messagesQueue.add(
      MESSAGE_JOB_RETRY_DUE,
      { requestedAt: new Date().toISOString() },
      {
        ...defaultJobOptions,
        attempts: 1,
        jobId: 'retry-due:singleton',
        ...opts,
      },
    );
  }

  async enqueueRecoverySweep(opts: JobsOptions = {}): Promise<void> {
    await this.messagesQueue.add(
      MESSAGE_JOB_RECOVERY_SWEEP,
      { requestedAt: new Date().toISOString() },
      {
        ...defaultJobOptions,
        attempts: 1,
        jobId: 'recovery-sweep:singleton',
        ...opts,
      },
    );
  }

  async enqueueMessageDeadLetter(
    payload: Record<string, unknown>,
    opts: JobsOptions = {},
  ): Promise<void> {
    await this.messagesQueue.add(MESSAGE_JOB_DEAD_LETTER, payload, {
      ...defaultJobOptions,
      attempts: 1,
      ...opts,
    });
  }

  async enqueueScheduleStub(payload: Record<string, unknown>): Promise<void> {
    await this.schedulesQueue.add('schedules.placeholder', payload, defaultJobOptions);
  }

  async enqueueWebhookStub(payload: Record<string, unknown>): Promise<void> {
    await this.webhooksQueue.add('webhooks.placeholder', payload, defaultJobOptions);
  }

  async enqueueAuditStub(payload: Record<string, unknown>): Promise<void> {
    await this.auditQueue.add('audit.placeholder', payload, defaultJobOptions);
  }
}
