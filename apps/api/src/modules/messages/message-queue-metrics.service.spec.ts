import { MessageQueueMetricsService } from './message-queue-metrics.service';

describe('MessageQueueMetricsService', () => {
  const queue = {
    getJobCounts: jest.fn().mockResolvedValue({ waiting: 3, active: 1, failed: 2 }),
  };
  const prisma = {
    outboundMessage: {
      groupBy: jest.fn().mockResolvedValue([
        { status: 'QUEUED', _count: { _all: 3 } },
        { status: 'FAILED', _count: { _all: 2 } },
      ]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    campaign: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const service = new MessageQueueMetricsService(queue as never, prisma as never);

  it('aggregates queue summary by status', async () => {
    const summary = await service.queueSummary();
    expect(summary).toEqual({ QUEUED: 3, FAILED: 2 });
  });

  it('returns queue lag counts', async () => {
    const lag = await service.queueLag();
    expect(lag.counts.waiting).toBe(3);
  });
});
