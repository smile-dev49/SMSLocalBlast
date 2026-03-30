import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { HealthLiveResponse, HealthReadyResponse } from './health.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  getLive(): HealthLiveResponse {
    return { status: 'alive', uptimeSeconds: process.uptime() };
  }

  async getReady(): Promise<HealthReadyResponse> {
    const checks = await Promise.all([this.checkDatabase(), this.checkRedis()]);
    const down = checks.filter((c) => c.status === 'down');
    return {
      status: down.length === 0 ? 'ready' : 'degraded',
      checks,
    };
  }

  private async checkDatabase(): Promise<HealthReadyResponse['checks'][number]> {
    try {
      await this.prisma.$queryRaw(Prisma.sql`SELECT 1`);
      return { name: 'database', status: 'up' };
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'unknown error';
      return { name: 'database', status: 'down', detail };
    }
  }

  private async checkRedis(): Promise<HealthReadyResponse['checks'][number]> {
    try {
      await this.redis.ping();
      return { name: 'redis', status: 'up' };
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'unknown error';
      return { name: 'redis', status: 'down', detail };
    }
  }
}
