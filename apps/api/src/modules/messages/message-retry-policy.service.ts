import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type RetryCategory =
  | 'NO_ELIGIBLE_DEVICE'
  | 'TRANSPORT_TEMPORARY'
  | 'CALLBACK_TIMEOUT'
  | 'QUEUE_STUCK'
  | 'PERMANENT_FAILURE';

@Injectable()
export class MessageRetryPolicyService {
  constructor(private readonly config: ConfigService) {}

  shouldRetry(args: {
    readonly category: RetryCategory;
    readonly retryCount: number;
    readonly maxRetries: number;
  }): boolean {
    if (args.category === 'PERMANENT_FAILURE') return false;
    return args.retryCount < args.maxRetries;
  }

  nextRetryAt(retryCount: number): Date {
    const base = this.config.getOrThrow<number>('queue.message.retryBaseDelaySeconds');
    const max = this.config.getOrThrow<number>('queue.message.retryMaxDelaySeconds');
    const exponent = Math.max(0, retryCount - 1);
    const withoutJitter = Math.min(max, base * Math.pow(2, exponent));
    const jitter = Math.floor(Math.random() * Math.max(1, Math.floor(withoutJitter * 0.2)));
    return new Date(Date.now() + (withoutJitter + jitter) * 1000);
  }
}
