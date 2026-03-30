import type { ConfigService } from '@nestjs/config';
import { DevicesHealthService } from './devices-health.service';

describe('DevicesHealthService', () => {
  const configMock = {
    getOrThrow: (key: string) => {
      switch (key) {
        case 'device.onlineThresholdSeconds':
          return 120;
        case 'device.warningThresholdSeconds':
          return 600;
        case 'device.criticalThresholdSeconds':
          return 1800;
        default:
          throw new Error(`Unexpected config key: ${key}`);
      }
    },
  } as unknown as ConfigService;

  it('derives status online/offline based on heartbeat recency', () => {
    const svc = new DevicesHealthService(configMock);
    const now = new Date();

    const online = svc.deriveStatus({
      isActive: true,
      storedStatus: 'ONLINE',
      lastHeartbeatAt: new Date(now.getTime() - 30_000),
      now,
    });
    expect(online).toBe('ONLINE');

    const offline = svc.deriveStatus({
      isActive: true,
      storedStatus: 'ONLINE',
      lastHeartbeatAt: new Date(now.getTime() - 500_000),
      now,
    });
    expect(offline).toBe('OFFLINE');
  });

  it('respects suspended devices for status and health', () => {
    const svc = new DevicesHealthService(configMock);
    const now = new Date();

    const derived = svc.deriveDeviceStatusAndHealth({
      isActive: true,
      storedStatus: 'SUSPENDED',
      lastHeartbeatAt: new Date(now.getTime() - 30_000),
      now,
      latestHeartbeat: null,
    });

    expect(derived.status).toBe('SUSPENDED');
    expect(derived.healthStatus).toBe('UNKNOWN');
  });

  it('computes health warning/critical using recency and heartbeat signals', () => {
    const svc = new DevicesHealthService(configMock);
    const now = new Date();

    const warning = svc.deriveHealthStatus({
      lastHeartbeatAt: new Date(now.getTime() - 400_000), // between 120s and 600s
      now,
      heartbeatStatus: 'OFFLINE',
      batteryLevel: null,
      signalStrength: null,
    });
    expect(warning).toBe('WARNING');

    const critical = svc.deriveHealthStatus({
      lastHeartbeatAt: new Date(now.getTime() - 800_000), // > 600s
      now,
      heartbeatStatus: 'DISCONNECTED',
      batteryLevel: null,
      signalStrength: null,
    });
    expect(critical).toBe('CRITICAL');
  });

  it('uses batteryLevel/signalStrength severity', () => {
    const svc = new DevicesHealthService(configMock);
    const now = new Date();

    const criticalBattery = svc.deriveHealthStatus({
      lastHeartbeatAt: new Date(now.getTime() - 30_000),
      now,
      heartbeatStatus: 'ONLINE',
      batteryLevel: 5,
      signalStrength: null,
    });
    expect(criticalBattery).toBe('CRITICAL');

    const warningSignal = svc.deriveHealthStatus({
      lastHeartbeatAt: new Date(now.getTime() - 30_000),
      now,
      heartbeatStatus: 'ONLINE',
      batteryLevel: null,
      signalStrength: 30,
    });
    expect(warningSignal).toBe('WARNING');
  });
});
