import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { DeviceHealthStatus, DevicePlatform, DeviceStatus } from '@prisma/client';

export interface DeviceLatestHeartbeatRow {
  readonly status: DeviceStatus;
  readonly batteryLevel: number | null;
  readonly signalStrength: number | null;
}

export interface DeviceRow {
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
  readonly deletedAt: Date | null;

  readonly heartbeats: readonly DeviceLatestHeartbeatRow[];
}

type DeviceOrderByKey =
  | 'createdAt'
  | 'name'
  | 'platform'
  | 'status'
  | 'healthStatus'
  | 'lastSeenAt'
  | 'lastHeartbeatAt'
  | 'dailySentCount';

@Injectable()
export class DevicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByOrganization(args: {
    readonly organizationId: string;
    readonly where: Prisma.DeviceWhereInput;
    readonly skip: number;
    readonly take: number;
    readonly orderByKey: DeviceOrderByKey;
    readonly orderBy: 'asc' | 'desc';
  }): Promise<readonly DeviceRow[]> {
    const orderBy = {
      [args.orderByKey]: args.orderBy,
    } as unknown as Prisma.DeviceOrderByWithRelationInput;

    return this.prisma.device.findMany({
      where: args.where,
      skip: args.skip,
      take: args.take,
      orderBy,
      select: {
        id: true,
        organizationId: true,
        createdByUserId: true,

        name: true,
        platform: true,
        appVersion: true,
        osVersion: true,
        deviceModel: true,
        deviceIdentifier: true,

        pushToken: true,
        phoneNumber: true,
        simLabel: true,

        status: true,
        healthStatus: true,
        isActive: true,
        isPrimary: true,

        dailySendLimit: true,
        hourlySendLimit: true,
        dailySentCount: true,
        hourlySentCount: true,

        lastSeenAt: true,
        lastHeartbeatAt: true,
        lastKnownIp: true,

        metadata: true,
        capabilities: true,

        createdAt: true,
        updatedAt: true,
        deletedAt: true,

        heartbeats: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            status: true,
            batteryLevel: true,
            signalStrength: true,
          },
        },
      },
    });
  }

  countByOrganization(args: {
    readonly organizationId: string;
    readonly where: Prisma.DeviceWhereInput;
  }): Promise<number> {
    return this.prisma.device.count({
      where: args.where,
    });
  }

  findById(args: { readonly deviceId: string }): Promise<DeviceRow | null> {
    return this.prisma.device.findUnique({
      where: { id: args.deviceId },
      select: {
        id: true,
        organizationId: true,
        createdByUserId: true,

        name: true,
        platform: true,
        appVersion: true,
        osVersion: true,
        deviceModel: true,
        deviceIdentifier: true,

        pushToken: true,
        phoneNumber: true,
        simLabel: true,

        status: true,
        healthStatus: true,
        isActive: true,
        isPrimary: true,

        dailySendLimit: true,
        hourlySendLimit: true,
        dailySentCount: true,
        hourlySentCount: true,

        lastSeenAt: true,
        lastHeartbeatAt: true,
        lastKnownIp: true,

        metadata: true,
        capabilities: true,

        createdAt: true,
        updatedAt: true,
        deletedAt: true,

        heartbeats: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            status: true,
            batteryLevel: true,
            signalStrength: true,
          },
        },
      },
    });
  }

  create(args: {
    readonly organizationId: string;
    readonly createdByUserId: string;
    readonly data: Omit<Prisma.DeviceUncheckedCreateInput, 'organizationId' | 'createdByUserId'>;
  }): Promise<DeviceRow> {
    return this.prisma.device.create({
      data: {
        organizationId: args.organizationId,
        createdByUserId: args.createdByUserId,
        ...args.data,
      },
      select: {
        id: true,
        organizationId: true,
        createdByUserId: true,

        name: true,
        platform: true,
        appVersion: true,
        osVersion: true,
        deviceModel: true,
        deviceIdentifier: true,

        pushToken: true,
        phoneNumber: true,
        simLabel: true,

        status: true,
        healthStatus: true,
        isActive: true,
        isPrimary: true,

        dailySendLimit: true,
        hourlySendLimit: true,
        dailySentCount: true,
        hourlySentCount: true,

        lastSeenAt: true,
        lastHeartbeatAt: true,
        lastKnownIp: true,

        metadata: true,
        capabilities: true,

        createdAt: true,
        updatedAt: true,
        deletedAt: true,

        heartbeats: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            status: true,
            batteryLevel: true,
            signalStrength: true,
          },
        },
      },
    }) as unknown as Promise<DeviceRow>;
  }

  update(args: {
    readonly deviceId: string;
    readonly data: Prisma.DeviceUpdateInput;
  }): Promise<DeviceRow> {
    return this.prisma.device.update({
      where: { id: args.deviceId },
      data: args.data,
      select: {
        id: true,
        organizationId: true,
        createdByUserId: true,

        name: true,
        platform: true,
        appVersion: true,
        osVersion: true,
        deviceModel: true,
        deviceIdentifier: true,

        pushToken: true,
        phoneNumber: true,
        simLabel: true,

        status: true,
        healthStatus: true,
        isActive: true,
        isPrimary: true,

        dailySendLimit: true,
        hourlySendLimit: true,
        dailySentCount: true,
        hourlySentCount: true,

        lastSeenAt: true,
        lastHeartbeatAt: true,
        lastKnownIp: true,

        metadata: true,
        capabilities: true,

        createdAt: true,
        updatedAt: true,
        deletedAt: true,

        heartbeats: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            status: true,
            batteryLevel: true,
            signalStrength: true,
          },
        },
      },
    });
  }

  softDelete(args: { readonly deviceId: string; readonly at: Date }): Promise<void> {
    return this.prisma.device
      .update({
        where: { id: args.deviceId },
        data: {
          deletedAt: args.at,
          isActive: false,
          isPrimary: false,
          status: 'DISCONNECTED',
          healthStatus: 'UNKNOWN',
        },
      })
      .then(() => undefined);
  }
}
