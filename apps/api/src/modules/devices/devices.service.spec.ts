import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import type { AuditLogService } from '../audit-logs/audit-log.service';
import type { DevicesRepository } from './devices.repository';
import { DevicesService } from './devices.service';
import type { DevicesHealthService } from './devices-health.service';
import type { SetDevicePrimaryBody } from './dto/set-device-primary.dto';

describe('DevicesService', () => {
  const principal: AuthPrincipal = {
    userId: 'u1',
    sessionId: 's1',
    organizationId: 'org_1',
    membershipId: 'm1',
    roleCode: 'org_owner',
    roleScope: 'ORGANIZATION',
    permissions: [],
  };

  const deviceRowBase = {
    id: 'd1',
    organizationId: 'org_1',
    createdByUserId: 'u1',
    name: 'Device A',
    platform: 'ANDROID' as const,
    appVersion: null,
    osVersion: null,
    deviceModel: null,
    deviceIdentifier: 'dev-ext-A',
    pushToken: null,
    phoneNumber: null,
    simLabel: null,
    status: 'ONLINE' as const,
    healthStatus: 'HEALTHY' as const,
    isActive: true,
    isPrimary: false,
    dailySendLimit: 1000,
    hourlySendLimit: 100,
    dailySentCount: 0,
    hourlySentCount: 0,
    lastSeenAt: null,
    lastHeartbeatAt: null,
    lastKnownIp: null,
    metadata: null,
    capabilities: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    heartbeats: [],
  };

  it('setPrimary unsets previous primary and sets the target primary', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const updatePrimary = jest.fn().mockResolvedValue({ id: 'd2' });

    const prismaMock = {
      $transaction: jest.fn(async (cb: (tx: unknown) => Promise<void>) => {
        const tx = {
          device: {
            updateMany,
            update: updatePrimary,
          },
        };
        return cb(tx);
      }),
      device: {
        update: jest.fn(),
      },
    };

    const repoMock = {
      findById: jest
        .fn()
        .mockResolvedValueOnce({ ...deviceRowBase, id: 'd2' })
        .mockResolvedValueOnce({ ...deviceRowBase, id: 'd2', isPrimary: true }),
    } as unknown as DevicesRepository;

    const healthMock = {
      deriveDeviceStatusAndHealth: jest.fn().mockReturnValue({
        status: 'ONLINE',
        healthStatus: 'HEALTHY',
      }),
    } as unknown as DevicesHealthService;

    const auditMock = {
      emit: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditLogService;

    const svc = new DevicesService(prismaMock as unknown as never, repoMock, healthMock, auditMock);

    const body = {} as SetDevicePrimaryBody;
    const out = await svc.setPrimary(principal, 'd2', body);

    expect(out.id).toBe('d2');
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        organizationId: 'org_1',
        deletedAt: null,
        isPrimary: true,
        id: { not: 'd2' },
      },
      data: { isPrimary: false },
    });
    expect(updatePrimary).toHaveBeenCalledWith({
      where: { id: 'd2' },
      data: { isPrimary: true },
    });
  });

  it('updateQuota sets isActive false when status DISCONNECTED is provided', async () => {
    const prismaDeviceUpdate = jest.fn().mockResolvedValue({});

    const prismaMock = {
      device: {
        update: prismaDeviceUpdate,
      },
    };

    const repoMock = {
      findById: jest.fn().mockResolvedValue({
        ...deviceRowBase,
        id: 'd1',
        lastHeartbeatAt: new Date('2026-01-01T00:00:00Z'),
        isActive: true,
        status: 'ONLINE',
      }),
    } as unknown as DevicesRepository;

    const healthMock = {
      deriveDeviceStatusAndHealth: jest.fn().mockReturnValue({
        status: 'DISCONNECTED',
        healthStatus: 'UNKNOWN',
      }),
    } as unknown as DevicesHealthService;

    const auditMock = {
      emit: jest.fn().mockResolvedValue(undefined),
    } as unknown as AuditLogService;

    const svc = new DevicesService(prismaMock as unknown as never, repoMock, healthMock, auditMock);

    const out = await svc.updateQuota(principal, 'd1', {
      status: 'DISCONNECTED',
    });

    expect(out.id).toBe('d1');
    expect(prismaDeviceUpdate).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: {
        status: 'DISCONNECTED',
        healthStatus: 'UNKNOWN',
        isActive: false,
      },
    });
  });
});
