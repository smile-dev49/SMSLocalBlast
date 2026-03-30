import type { Prisma, DeviceHealthStatus, DevicePlatform, DeviceStatus } from '@prisma/client';

export type DeviceCapabilities = Record<string, unknown>;

export interface DeviceHeartbeatResponse {
  readonly id: string;
  readonly status: DeviceStatus;
  readonly batteryLevel: number | null;
  readonly signalStrength: number | null;
  readonly networkType: string | null;
  readonly appVersion: string | null;
  readonly ipAddress: string | null;
  readonly payload: Prisma.JsonValue | null;
  readonly createdAt: Date;
}

export interface DeviceResponse {
  readonly id: string;
  readonly organizationId: string;
  readonly createdByUserId: string | null;
  readonly name: string;
  readonly platform: DevicePlatform;
  readonly appVersion: string | null;
  readonly osVersion: string | null;
  readonly deviceModel: string | null;
  readonly deviceIdentifier: string;
  readonly pushToken: string | null;
  readonly phoneNumber: string | null;
  readonly simLabel: string | null;

  readonly status: DeviceStatus;
  readonly healthStatus: DeviceHealthStatus;
  readonly isActive: boolean;
  readonly isPrimary: boolean;

  readonly dailySendLimit: number;
  readonly hourlySendLimit: number;
  readonly dailySentCount: number;
  readonly hourlySentCount: number;

  readonly lastSeenAt: Date | null;
  readonly lastHeartbeatAt: Date | null;
  readonly lastKnownIp: string | null;

  readonly metadata: Prisma.JsonValue | null;
  readonly capabilities: Prisma.JsonValue | null;

  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface DeviceListResponse {
  readonly items: readonly DeviceResponse[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}
