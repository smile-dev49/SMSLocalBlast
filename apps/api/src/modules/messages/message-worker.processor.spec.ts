import type { ConfigService } from '@nestjs/config';
import { MESSAGE_JOB_DISPATCH } from '../../infrastructure/queue/queue.constants';
import { MessageWorkerProcessor } from './message-worker.processor';

describe('MessageWorkerProcessor', () => {
  const execution = {
    processQueuedMessage: jest.fn(),
  };
  const recovery = {
    requeueDueRetries: jest.fn(),
    runRecoverySweep: jest.fn(),
  };
  const deadLetter = {
    moveToDeadLetter: jest.fn(),
  };
  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'queue.message.retryBatchSize') return 100;
      if (key === 'queue.message.deadLetterThreshold') return 3;
      throw new Error(`unexpected key: ${key}`);
    }),
  } as unknown as ConfigService;
  const processor = new MessageWorkerProcessor(
    config,
    execution as never,
    recovery as never,
    deadLetter as never,
  );

  beforeEach(() => {
    execution.processQueuedMessage.mockReset();
    deadLetter.moveToDeadLetter.mockReset();
  });

  it('no-ops stale duplicate jobs via execution guard', async () => {
    execution.processQueuedMessage.mockResolvedValue(undefined);
    await processor.process({
      name: MESSAGE_JOB_DISPATCH,
      data: { messageId: 'm1', organizationId: 'o1' },
      attemptsMade: 0,
      opts: { attempts: 3 },
      id: 'j1',
    } as never);
    expect(execution.processQueuedMessage).toHaveBeenCalledWith('m1');
    expect(deadLetter.moveToDeadLetter).not.toHaveBeenCalled();
  });

  it('routes terminal worker failures to dead-letter', async () => {
    execution.processQueuedMessage.mockRejectedValue(new Error('boom'));
    await processor.process({
      name: MESSAGE_JOB_DISPATCH,
      data: { messageId: 'm2', organizationId: 'o1' },
      attemptsMade: 2,
      opts: { attempts: 3 },
      id: 'j2',
    } as never);
    expect(deadLetter.moveToDeadLetter).toHaveBeenCalledTimes(1);
  });
});
