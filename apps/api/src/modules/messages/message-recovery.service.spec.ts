import type { ConfigService } from '@nestjs/config';
import { MessageRecoveryService } from './message-recovery.service';

describe('MessageRecoveryService', () => {
  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'queue.enabled') return true;
      if (key === 'queue.message.recoverySweepSeconds') return 1;
      if (key === 'queue.message.retryBatchSize') return 100;
      if (key === 'queue.message.dispatchStuckThresholdSeconds') return 300;
      if (key === 'queue.message.callbackTimeoutSeconds') return 900;
      throw new Error(`Unexpected key: ${key}`);
    }),
  } as unknown as ConfigService;
  const repo = {
    findDueRetries: jest.fn(),
    findStuckDispatching: jest.fn(),
    findDispatchWithoutCallback: jest.fn(),
    finalizeProcessingCampaignsIfTerminal: jest.fn(),
  };
  const queue = {
    reopenFailedToReadyAndEnqueue: jest.fn(),
    scheduleRetry: jest.fn(),
  };
  const retryPolicy = {
    shouldRetry: jest.fn().mockReturnValue(true),
    nextRetryAt: jest.fn().mockReturnValue(new Date()),
  };
  const execution = {
    transitionMessageStatus: jest.fn(),
  };
  const producer = {
    enqueueRetryDueSweep: jest.fn(),
    enqueueRecoverySweep: jest.fn(),
  };

  const service = new MessageRecoveryService(
    config,
    repo as never,
    queue as never,
    retryPolicy as never,
    execution as never,
    producer as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    repo.findDueRetries.mockResolvedValue([
      { id: 'm1', organizationId: 'o1', retryCount: 1, maxRetries: 3 },
    ]);
    repo.findStuckDispatching.mockResolvedValue([]);
    repo.findDispatchWithoutCallback.mockResolvedValue([]);
    repo.finalizeProcessingCampaignsIfTerminal.mockResolvedValue(0);
  });

  it('requeues due retries idempotently', async () => {
    const count = await service.requeueDueRetries(10);
    expect(count).toBe(1);
    expect(queue.reopenFailedToReadyAndEnqueue).toHaveBeenCalledTimes(1);
  });

  it('registers repeatable recovery jobs on init', async () => {
    await service.onModuleInit();
    expect(producer.enqueueRetryDueSweep).toHaveBeenCalledTimes(1);
    expect(producer.enqueueRecoverySweep).toHaveBeenCalledTimes(1);
  });
});
