import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MessageDeviceSelectionService } from './message-device-selection.service';

describe('MessageDeviceSelectionService', () => {
  let service: MessageDeviceSelectionService;
  const prisma = {
    device: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageDeviceSelectionService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(MessageDeviceSelectionService);
    prisma.device.findMany.mockReset();
  });

  it('returns no eligible device when none pass filters', async () => {
    prisma.device.findMany.mockResolvedValue([]);
    const selected = await service.selectEligibleDevice('org1');
    expect(selected.deviceId).toBeNull();
    expect(selected.reason).toBe('NO_ELIGIBLE_DEVICE');
  });

  it('prioritizes primary eligible device', async () => {
    prisma.device.findMany.mockResolvedValue([
      {
        id: 'd2',
        isPrimary: false,
        healthStatus: 'HEALTHY',
        lastSeenAt: new Date('2026-01-01T00:00:00.000Z'),
        dailySendLimit: 100,
        hourlySendLimit: 10,
        dailySentCount: 0,
        hourlySentCount: 0,
      },
      {
        id: 'd1',
        isPrimary: true,
        healthStatus: 'WARNING',
        lastSeenAt: new Date('2026-01-01T00:00:01.000Z'),
        dailySendLimit: 100,
        hourlySendLimit: 10,
        dailySentCount: 0,
        hourlySentCount: 0,
      },
    ]);
    const selected = await service.selectEligibleDevice('org1');
    expect(selected.deviceId).toBe('d1');
  });
});
