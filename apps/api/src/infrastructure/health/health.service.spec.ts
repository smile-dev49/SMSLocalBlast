import { HealthService } from './health.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { RedisService } from '../redis/redis.service';

describe('HealthService', () => {
  it('getLive returns alive status', () => {
    const prisma = {} as PrismaService;
    const redis = {} as RedisService;
    const svc = new HealthService(prisma, redis);
    const out = svc.getLive();
    expect(out.status).toBe('alive');
    expect(out.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('getReady is ready when database and redis are up', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue(1),
    } as unknown as PrismaService;
    const redis = {
      ping: jest.fn().mockResolvedValue('PONG' as const),
    } as unknown as RedisService;
    const svc = new HealthService(prisma, redis);
    const out = await svc.getReady();
    expect(out.status).toBe('ready');
    expect(out.checks).toHaveLength(2);
  });

  it('getReady is degraded when database fails', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as PrismaService;
    const redis = {
      ping: jest.fn().mockResolvedValue('PONG' as const),
    } as unknown as RedisService;
    const svc = new HealthService(prisma, redis);
    const out = await svc.getReady();
    expect(out.status).toBe('degraded');
    const db = out.checks.find((c) => c.name === 'database');
    expect(db?.status).toBe('down');
  });

  it('getReady is degraded when redis fails', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue(1),
    } as unknown as PrismaService;
    const redis = {
      ping: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    } as unknown as RedisService;
    const svc = new HealthService(prisma, redis);
    const out = await svc.getReady();
    expect(out.status).toBe('degraded');
    const r = out.checks.find((c) => c.name === 'redis');
    expect(r?.status).toBe('down');
  });
});
