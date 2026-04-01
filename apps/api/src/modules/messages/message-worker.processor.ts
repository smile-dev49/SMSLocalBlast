import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import {
  MESSAGE_JOB_DEAD_LETTER,
  MESSAGE_JOB_DISPATCH,
  MESSAGE_JOB_RECOVERY_SWEEP,
  MESSAGE_JOB_RETRY_DUE,
  QUEUE_MESSAGES,
} from '../../infrastructure/queue/queue.constants';
import { MessageDeadLetterService } from './message-dead-letter.service';
import { MessageExecutionService } from './message-execution.service';
import { MessageRecoveryService } from './message-recovery.service';

interface DispatchPayload {
  readonly messageId: string;
  readonly organizationId: string;
}

@Injectable()
@Processor(QUEUE_MESSAGES)
export class MessageWorkerProcessor extends WorkerHost {
  private readonly logger = new Logger(MessageWorkerProcessor.name);

  constructor(
    private readonly config: ConfigService,
    private readonly execution: MessageExecutionService,
    private readonly recovery: MessageRecoveryService,
    private readonly deadLetter: MessageDeadLetterService,
  ) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    if (job.name === MESSAGE_JOB_DISPATCH) {
      return this.processDispatch(job as Job<DispatchPayload>);
    }
    if (job.name === MESSAGE_JOB_RETRY_DUE) {
      const batchSize = this.config.getOrThrow<number>('queue.message.retryBatchSize');
      return this.recovery.requeueDueRetries(batchSize);
    }
    if (job.name === MESSAGE_JOB_RECOVERY_SWEEP) {
      return this.recovery.runRecoverySweep();
    }
    if (job.name === MESSAGE_JOB_DEAD_LETTER) {
      return { accepted: true };
    }
    this.logger.warn({ msg: 'messages.worker.unknown-job', name: job.name, id: job.id });
    return null;
  }

  private async processDispatch(job: Job<DispatchPayload>): Promise<void> {
    const payload = job.data;
    this.logger.log({
      msg: 'messages.worker.dispatch.start',
      jobId: job.id,
      messageId: payload.messageId,
      attempt: job.attemptsMade + 1,
    });
    try {
      await this.execution.processQueuedMessage(payload.messageId);
      this.logger.log({
        msg: 'messages.worker.dispatch.done',
        jobId: job.id,
        messageId: payload.messageId,
      });
    } catch (error) {
      const maxAttempts =
        job.opts.attempts ?? this.config.getOrThrow<number>('queue.message.deadLetterThreshold');
      const currentAttempt = job.attemptsMade + 1;
      const shouldDeadLetter = currentAttempt >= maxAttempts;
      this.logger.error({
        msg: 'messages.worker.dispatch.error',
        jobId: job.id,
        messageId: payload.messageId,
        currentAttempt,
        maxAttempts,
        shouldDeadLetter,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      if (shouldDeadLetter) {
        await this.deadLetter.moveToDeadLetter({
          messageId: payload.messageId,
          organizationId: payload.organizationId,
          reason: 'worker.dispatch.max-attempts',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            currentAttempt,
            maxAttempts,
          },
        });
        return;
      }
      throw error;
    }
  }
}
