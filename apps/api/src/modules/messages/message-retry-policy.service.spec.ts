import { ConfigService } from '@nestjs/config';
import { MessageRetryPolicyService } from './message-retry-policy.service';

describe('MessageRetryPolicyService', () => {
  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'queue.message.retryBaseDelaySeconds') return 10;
      if (key === 'queue.message.retryMaxDelaySeconds') return 60;
      throw new Error(`Unexpected key: ${key}`);
    }),
  } as unknown as ConfigService;

  const service = new MessageRetryPolicyService(config);

  it('does not retry permanent failures', () => {
    expect(
      service.shouldRetry({ category: 'PERMANENT_FAILURE', retryCount: 0, maxRetries: 3 }),
    ).toBe(false);
  });

  it('retries transient failures within max retries', () => {
    expect(
      service.shouldRetry({ category: 'NO_ELIGIBLE_DEVICE', retryCount: 1, maxRetries: 3 }),
    ).toBe(true);
    expect(
      service.shouldRetry({ category: 'NO_ELIGIBLE_DEVICE', retryCount: 3, maxRetries: 3 }),
    ).toBe(false);
  });

  it('calculates bounded backoff', () => {
    const next = service.nextRetryAt(5);
    expect(next.getTime()).toBeGreaterThan(Date.now());
    expect(next.getTime()).toBeLessThanOrEqual(Date.now() + 80 * 1000);
  });
});
