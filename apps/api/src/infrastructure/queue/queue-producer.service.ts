import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { JobsOptions, Queue } from 'bullmq';
import { QUEUE_AUDIT, QUEUE_MESSAGES, QUEUE_SCHEDULES, QUEUE_WEBHOOKS } from './queue.constants';

const defaultJobOptions: JobsOptions = {
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

/**
 * Thin abstraction over BullMQ producers — domain modules should depend on this service, not on Queues directly.
 */
@Injectable()
export class QueueProducerService {
  constructor(
    @InjectQueue(QUEUE_MESSAGES) private readonly messagesQueue: Queue,
    @InjectQueue(QUEUE_SCHEDULES) private readonly schedulesQueue: Queue,
    @InjectQueue(QUEUE_WEBHOOKS) private readonly webhooksQueue: Queue,
    @InjectQueue(QUEUE_AUDIT) private readonly auditQueue: Queue,
  ) {}

  async enqueueMessageStub(payload: Record<string, unknown>): Promise<void> {
    await this.messagesQueue.add('messages.placeholder', payload, defaultJobOptions);
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
