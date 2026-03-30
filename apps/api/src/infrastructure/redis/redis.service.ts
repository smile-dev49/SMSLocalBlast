import type { OnModuleDestroy } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.tokens';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<'PONG'> {
    const result = await this.client.ping();
    if (result.toUpperCase() !== 'PONG') {
      throw new Error(`Unexpected Redis PING response: ${result}`);
    }
    return 'PONG';
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
