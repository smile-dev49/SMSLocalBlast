import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DeviceHealthStatus, DeviceStatus } from '@prisma/client';

type Severity = 0 | 1 | 2 | 3;

function statusSeverity(status: DeviceHealthStatus): Severity {
  switch (status) {
    case 'UNKNOWN':
      return 0;
    case 'HEALTHY':
      return 1;
    case 'WARNING':
      return 2;
    case 'CRITICAL':
      return 3;
  }
}

function pickWorseStatus(a: DeviceHealthStatus, b: DeviceHealthStatus): DeviceHealthStatus {
  return statusSeverity(a) >= statusSeverity(b) ? a : b;
}

@Injectable()
export class DevicesHealthService {
  constructor(private readonly config: ConfigService) {}

  deriveStatus(args: {
    readonly isActive: boolean;
    readonly storedStatus: DeviceStatus;
    readonly lastHeartbeatAt: Date | null;
    readonly now: Date;
  }): DeviceStatus {
    if (args.storedStatus === 'SUSPENDED') return 'SUSPENDED';
    if (args.storedStatus === 'DISCONNECTED') return 'DISCONNECTED';
    if (!args.isActive) return 'DISCONNECTED';
    if (!args.lastHeartbeatAt) return 'PENDING';

    const ageSeconds = (args.now.getTime() - args.lastHeartbeatAt.getTime()) / 1000;
    const onlineThresholdSeconds = this.config.getOrThrow<number>('device.onlineThresholdSeconds');

    return ageSeconds <= onlineThresholdSeconds ? 'ONLINE' : 'OFFLINE';
  }

  deriveHealthStatus(args: {
    readonly lastHeartbeatAt: Date | null;
    readonly now: Date;
    readonly heartbeatStatus?: DeviceStatus | null;
    readonly batteryLevel?: number | null;
    readonly signalStrength?: number | null;
  }): DeviceHealthStatus {
    if (!args.lastHeartbeatAt) return 'UNKNOWN';

    const ageSeconds = (args.now.getTime() - args.lastHeartbeatAt.getTime()) / 1000;
    const onlineThresholdSeconds = this.config.getOrThrow<number>('device.onlineThresholdSeconds');
    const warningThresholdSeconds = this.config.getOrThrow<number>(
      'device.warningThresholdSeconds',
    );

    let healthStatus: DeviceHealthStatus =
      ageSeconds <= onlineThresholdSeconds
        ? 'HEALTHY'
        : ageSeconds <= warningThresholdSeconds
          ? 'WARNING'
          : 'CRITICAL';

    if (args.heartbeatStatus === 'DISCONNECTED') return 'CRITICAL';
    if (args.heartbeatStatus === 'SUSPENDED') return 'UNKNOWN';
    if (args.heartbeatStatus === 'OFFLINE') healthStatus = pickWorseStatus(healthStatus, 'WARNING');

    // These are intentionally conservative defaults; if clients use different units,
    // we can later normalize at ingest-time.
    if (args.batteryLevel !== null && args.batteryLevel !== undefined) {
      if (args.batteryLevel <= 10) return 'CRITICAL';
      if (args.batteryLevel <= 20) healthStatus = pickWorseStatus(healthStatus, 'WARNING');
    }

    if (args.signalStrength !== null && args.signalStrength !== undefined) {
      if (args.signalStrength <= 20) return 'CRITICAL';
      if (args.signalStrength <= 40) healthStatus = pickWorseStatus(healthStatus, 'WARNING');
    }

    if (healthStatus === 'HEALTHY' && args.heartbeatStatus === 'PENDING') return 'UNKNOWN';
    return healthStatus;
  }

  deriveDeviceStatusAndHealth(args: {
    readonly isActive: boolean;
    readonly storedStatus: DeviceStatus;
    readonly lastHeartbeatAt: Date | null;
    readonly now: Date;
    readonly latestHeartbeat?: {
      readonly status: DeviceStatus;
      readonly batteryLevel: number | null;
      readonly signalStrength: number | null;
    } | null;
  }): { readonly status: DeviceStatus; readonly healthStatus: DeviceHealthStatus } {
    const status = this.deriveStatus({
      isActive: args.isActive,
      storedStatus: args.storedStatus,
      lastHeartbeatAt: args.lastHeartbeatAt,
      now: args.now,
    });

    // For intentionally suspended/disconnected devices, we avoid misleading health
    // interpretations based on stale telemetry.
    if (status === 'SUSPENDED' || status === 'DISCONNECTED') {
      return { status, healthStatus: 'UNKNOWN' };
    }

    const healthStatus = this.deriveHealthStatus({
      lastHeartbeatAt: args.lastHeartbeatAt,
      now: args.now,
      heartbeatStatus: args.latestHeartbeat?.status ?? null,
      batteryLevel: args.latestHeartbeat?.batteryLevel ?? null,
      signalStrength: args.latestHeartbeat?.signalStrength ?? null,
    });

    return { status, healthStatus };
  }
}
