import { MessageDeadLetterService } from './message-dead-letter.service';

describe('MessageDeadLetterService', () => {
  const update = jest.fn().mockResolvedValue({});
  const enqueueMessageDeadLetter = jest.fn().mockResolvedValue(undefined);
  const service = new MessageDeadLetterService(
    {
      outboundMessage: { update },
    } as never,
    { enqueueMessageDeadLetter } as never,
  );

  beforeEach(() => {
    update.mockClear();
    enqueueMessageDeadLetter.mockClear();
  });

  it('persists dead-letter context and enqueues dlq item', async () => {
    await service.moveToDeadLetter({
      messageId: 'm1',
      organizationId: 'o1',
      reason: 'worker.dispatch.max-attempts',
      details: { foo: 'bar' },
    });
    expect(update).toHaveBeenCalledTimes(1);
    expect(enqueueMessageDeadLetter).toHaveBeenCalledTimes(1);
  });
});
