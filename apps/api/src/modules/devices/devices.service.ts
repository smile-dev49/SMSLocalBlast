import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuditAction } from '@prisma/client';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { MembershipInactiveException } from '../auth/exceptions/auth.exceptions';
import type { CreateDeviceBody } from './dto/create-device.dto';
import type { DeviceHeartbeatBody } from './dto/device-heartbeat.dto';
import type { ListDevicesQuery } from './dto/list-devices.query.dto';
import type { SetDevicePrimaryBody } from './dto/set-device-primary.dto';
import type { UpdateDeviceBody } from './dto/update-device.dto';
import type { UpdateDeviceQuotaBody } from './dto/update-device-quota.dto';
import type {
  DeviceHeartbeatResponse,
  DeviceListResponse,
  DeviceResponse,
} from './types/device.types';
import { DevicesHealthService } from './devices-health.service';
import {
  DevicesRepository,
  type DeviceRow,
  type DeviceLatestHeartbeatRow,
} from './devices.repository';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { createPaginatedResponse } from '../../common/utils/pagination';
import { getRequestContext } from '../../infrastructure/request-context/request-context.storage';
import {
  DeviceAccessDeniedException,
  DeviceNotFoundException,
} from './exceptions/devices.exceptions';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: DevicesRepository,
    private readonly health: DevicesHealthService,
    private readonly audit: AuditLogService,
  ) {}

  private requireOrganizationId(principal: AuthPrincipal): string {
    const orgId = principal.organizationId;
    if (!orgId) throw new MembershipInactiveException();
    return orgId;
  }

  private mapRow(args: { readonly row: DeviceRow; readonly now: Date }): DeviceResponse {
    const latestHeartbeat: DeviceLatestHeartbeatRow | null = args.row.heartbeats.at(0) ?? null;

    const derived = this.health.deriveDeviceStatusAndHealth({
      isActive: args.row.isActive,
      storedStatus: args.row.status,
      lastHeartbeatAt: args.row.lastHeartbeatAt,
      now: args.now,
      latestHeartbeat: latestHeartbeat,
    });

    return {
      id: args.row.id,
      organizationId: args.row.organizationId,
      createdByUserId: args.row.createdByUserId,
      name: args.row.name,
      platform: args.row.platform,
      appVersion: args.row.appVersion,
      osVersion: args.row.osVersion,
      deviceModel: args.row.deviceModel,
      deviceIdentifier: args.row.deviceIdentifier,
      pushToken: args.row.pushToken,
      phoneNumber: args.row.phoneNumber,
      simLabel: args.row.simLabel,

      status: derived.status,
      healthStatus: derived.healthStatus,
      isActive: args.row.isActive,
      isPrimary: args.row.isPrimary,

      dailySendLimit: args.row.dailySendLimit,
      hourlySendLimit: args.row.hourlySendLimit,
      dailySentCount: args.row.dailySentCount,
      hourlySentCount: args.row.hourlySentCount,

      lastSeenAt: args.row.lastSeenAt,
      lastHeartbeatAt: args.row.lastHeartbeatAt,
      lastKnownIp: args.row.lastKnownIp,

      metadata: args.row.metadata,
      capabilities: args.row.capabilities,

      createdAt: args.row.createdAt,
      updatedAt: args.row.updatedAt,
    };
  }

  private async emitDeviceAudit(args: {
    readonly action: AuditAction;
    readonly organizationId: string;
    readonly actorUserId: string;
    readonly entityId: string;
    readonly metadata?: Record<string, unknown>;
  }): Promise<void> {
    const reqCtx = getRequestContext();
    const requestId = reqCtx?.requestId;
    const ipAddress = reqCtx?.ip;
    const userAgent = reqCtx?.userAgent;

    await this.audit.emit({
      action: args.action,
      entityType: 'device',
      entityId: args.entityId,
      organizationId: args.organizationId,
      actorUserId: args.actorUserId,
      ...(args.metadata !== undefined ? { metadata: args.metadata } : {}),
      ...(requestId ? { requestId } : {}),
      ...(ipAddress ? { ipAddress } : {}),
      ...(userAgent ? { userAgent } : {}),
    });
  }

  async listDevices(
    principal: AuthPrincipal,
    query: ListDevicesQuery,
  ): Promise<DeviceListResponse> {
    const organizationId = this.requireOrganizationId(principal);
    const now = new Date();

    const where: Prisma.DeviceWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (query.platform) {
      where.platform = query.platform;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (typeof query.isActive === 'boolean') {
      where.isActive = query.isActive;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { deviceIdentifier: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search, mode: 'insensitive' } },
        { simLabel: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [total, rows] = await Promise.all([
      this.repo.countByOrganization({ organizationId, where }),
      this.repo.listByOrganization({
        organizationId,
        where,
        skip,
        take: query.limit,
        orderByKey: query.sortBy,
        orderBy: query.sortOrder,
      }),
    ]);

    const items = rows.map((row) => this.mapRow({ row, now }));

    return createPaginatedResponse({
      items,
      page: query.page,
      limit: query.limit,
      total,
    });
  }

  async getDevice(principal: AuthPrincipal, deviceId: string): Promise<DeviceResponse> {
    const organizationId = this.requireOrganizationId(principal);
    const now = new Date();

    const row = await this.repo.findById({ deviceId });
    if (!row) throw new DeviceNotFoundException();
    if (row.deletedAt !== null) throw new DeviceNotFoundException();
    if (row.organizationId !== organizationId) throw new DeviceAccessDeniedException();

    return this.mapRow({ row, now });
  }

  async registerDevice(principal: AuthPrincipal, input: CreateDeviceBody): Promise<DeviceResponse> {
    const organizationId = this.requireOrganizationId(principal);
    const createdByUserId = principal.userId;
    const now = new Date();

    const row = await this.repo.create({
      organizationId,
      createdByUserId,
      data: {
        name: input.name,
        platform: input.platform,
        deviceIdentifier: input.deviceIdentifier,

        appVersion: input.appVersion ?? null,
        osVersion: input.osVersion ?? null,
        deviceModel: input.deviceModel ?? null,

        phoneNumber: input.phoneNumber ?? null,
        simLabel: input.simLabel ?? null,
        pushToken: input.pushToken ?? null,
        ...(input.capabilities === undefined
          ? {}
          : {
              capabilities: input.capabilities as unknown as Prisma.InputJsonValue,
            }),
      },
    });

    await this.emitDeviceAudit({
      action: 'DEVICE_CREATED' as AuditAction,
      organizationId,
      actorUserId: createdByUserId,
      entityId: row.id,
      metadata: {
        platform: input.platform,
        deviceIdentifier: input.deviceIdentifier,
      },
    });

    return this.mapRow({ row, now });
  }

  async updateDevice(
    principal: AuthPrincipal,
    deviceId: string,
    input: UpdateDeviceBody,
  ): Promise<DeviceResponse> {
    const organizationId = this.requireOrganizationId(principal);
    const existing = await this.repo.findById({ deviceId });
    if (!existing) throw new DeviceNotFoundException();
    if (existing.deletedAt !== null) throw new DeviceNotFoundException();
    if (existing.organizationId !== organizationId) throw new DeviceAccessDeniedException();

    const data: Prisma.DeviceUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phoneNumber !== undefined ? { phoneNumber: input.phoneNumber } : {}),
      ...(input.simLabel !== undefined ? { simLabel: input.simLabel } : {}),
      ...(input.pushToken !== undefined ? { pushToken: input.pushToken } : {}),
      ...(input.appVersion !== undefined ? { appVersion: input.appVersion } : {}),
      ...(input.osVersion !== undefined ? { osVersion: input.osVersion } : {}),
      ...(input.deviceModel !== undefined ? { deviceModel: input.deviceModel } : {}),
      ...(input.metadata !== undefined
        ? { metadata: input.metadata as unknown as Prisma.InputJsonValue }
        : {}),
      ...(input.capabilities !== undefined
        ? { capabilities: input.capabilities as unknown as Prisma.InputJsonValue }
        : {}),
    };

    await this.prisma.device.update({
      where: { id: deviceId },
      data,
    });

    const response = await this.getDevice(principal, deviceId);

    await this.emitDeviceAudit({
      action: 'DEVICE_UPDATED' as AuditAction,
      organizationId,
      actorUserId: principal.userId,
      entityId: deviceId,
      metadata: { updatedFields: Object.keys(input) },
    });

    return response;
  }

  async softDeleteDevice(principal: AuthPrincipal, deviceId: string): Promise<void> {
    const organizationId = this.requireOrganizationId(principal);
    const existing = await this.repo.findById({ deviceId });
    if (!existing) throw new DeviceNotFoundException();
    if (existing.deletedAt !== null) throw new DeviceNotFoundException();
    if (existing.organizationId !== organizationId) throw new DeviceAccessDeniedException();

    await this.repo.softDelete({ deviceId, at: new Date() });

    await this.emitDeviceAudit({
      action: 'DEVICE_DELETED' as AuditAction,
      organizationId,
      actorUserId: principal.userId,
      entityId: deviceId,
      metadata: {},
    });
  }

  async receiveHeartbeat(
    principal: AuthPrincipal,
    deviceId: string,
    input: DeviceHeartbeatBody,
  ): Promise<{ heartbeat: DeviceHeartbeatResponse; device: DeviceResponse }> {
    const organizationId = this.requireOrganizationId(principal);
    const deviceRow = await this.repo.findById({ deviceId });
    if (!deviceRow) throw new DeviceNotFoundException();
    if (deviceRow.deletedAt !== null) throw new DeviceNotFoundException();
    if (deviceRow.organizationId !== organizationId) throw new DeviceAccessDeniedException();

    const now = new Date();
    const reqCtx = getRequestContext();
    const ipAddress = reqCtx?.ip ?? null;

    const heartbeat = await this.prisma.deviceHeartbeat.create({
      data: {
        deviceId,
        organizationId,
        status: input.status,
        batteryLevel: input.batteryLevel ?? null,
        signalStrength: input.signalStrength ?? null,
        networkType: input.networkType ?? null,
        appVersion: input.appVersion ?? null,
        ipAddress,
        ...(input.payload === undefined
          ? {}
          : {
              payload: input.payload as unknown as Prisma.InputJsonValue,
            }),
      },
      select: {
        id: true,
        status: true,
        batteryLevel: true,
        signalStrength: true,
        networkType: true,
        appVersion: true,
        ipAddress: true,
        payload: true,
        createdAt: true,
      },
    });

    const latestHeartbeat = {
      status: input.status,
      batteryLevel: input.batteryLevel ?? null,
      signalStrength: input.signalStrength ?? null,
    };

    const derived = this.health.deriveDeviceStatusAndHealth({
      isActive: deviceRow.isActive,
      storedStatus: deviceRow.status,
      lastHeartbeatAt: now,
      now,
      latestHeartbeat,
    });

    await this.prisma.device.update({
      where: { id: deviceId },
      data: {
        lastSeenAt: now,
        lastHeartbeatAt: now,
        lastKnownIp: ipAddress,
        status: derived.status,
        healthStatus: derived.healthStatus,
        ...(input.appVersion !== undefined ? { appVersion: input.appVersion } : {}),
      },
    });

    const after = await this.getDevice(principal, deviceId);

    const isMeaningful =
      deviceRow.lastHeartbeatAt === null ||
      deviceRow.status !== derived.status ||
      deviceRow.healthStatus !== derived.healthStatus;

    if (isMeaningful) {
      await this.emitDeviceAudit({
        action: 'DEVICE_HEARTBEAT_RECEIVED' as AuditAction,
        organizationId,
        actorUserId: principal.userId,
        entityId: deviceId,
        metadata: {
          heartbeatStatus: input.status,
          batteryLevel: input.batteryLevel ?? null,
          signalStrength: input.signalStrength ?? null,
          networkType: input.networkType ?? null,
        },
      });
    }

    const heartbeatResponse: DeviceHeartbeatResponse = {
      id: heartbeat.id,
      status: heartbeat.status,
      batteryLevel: heartbeat.batteryLevel,
      signalStrength: heartbeat.signalStrength,
      networkType: heartbeat.networkType,
      appVersion: heartbeat.appVersion,
      ipAddress: heartbeat.ipAddress,
      payload: heartbeat.payload,
      createdAt: heartbeat.createdAt,
    };

    return { heartbeat: heartbeatResponse, device: after };
  }

  async setPrimary(
    principal: AuthPrincipal,
    deviceId: string,
    _body: SetDevicePrimaryBody,
  ): Promise<DeviceResponse> {
    void _body;
    const organizationId = this.requireOrganizationId(principal);
    const existing = await this.repo.findById({ deviceId });
    if (!existing) throw new DeviceNotFoundException();
    if (existing.deletedAt !== null) throw new DeviceNotFoundException();
    if (existing.organizationId !== organizationId) throw new DeviceAccessDeniedException();

    await this.prisma.$transaction(async (tx) => {
      await tx.device.updateMany({
        where: {
          organizationId,
          deletedAt: null,
          isPrimary: true,
          id: { not: deviceId },
        },
        data: { isPrimary: false },
      });

      await tx.device.update({
        where: { id: deviceId },
        data: { isPrimary: true },
      });
    });

    await this.emitDeviceAudit({
      action: 'DEVICE_PRIMARY_SET' as AuditAction,
      organizationId,
      actorUserId: principal.userId,
      entityId: deviceId,
      metadata: {},
    });

    return this.getDevice(principal, deviceId);
  }

  async updateQuota(
    principal: AuthPrincipal,
    deviceId: string,
    input: UpdateDeviceQuotaBody,
  ): Promise<DeviceResponse> {
    const organizationId = this.requireOrganizationId(principal);
    const deviceRow = await this.repo.findById({ deviceId });
    if (!deviceRow) throw new DeviceNotFoundException();
    if (deviceRow.deletedAt !== null) throw new DeviceNotFoundException();
    if (deviceRow.organizationId !== organizationId) throw new DeviceAccessDeniedException();

    const now = new Date();

    let nextIsActive = input.isActive ?? deviceRow.isActive;
    const nextStoredStatus = input.status ?? deviceRow.status;

    // When admin explicitly disconnects a device, we treat it as inactive.
    if (nextStoredStatus === 'DISCONNECTED') nextIsActive = false;

    const latestHeartbeat = deviceRow.heartbeats[0] ?? null;
    const derived = this.health.deriveDeviceStatusAndHealth({
      isActive: nextIsActive,
      storedStatus: nextStoredStatus,
      lastHeartbeatAt: deviceRow.lastHeartbeatAt,
      now,
      latestHeartbeat: latestHeartbeat,
    });

    const data: Prisma.DeviceUpdateInput = {
      ...(input.dailySendLimit !== undefined ? { dailySendLimit: input.dailySendLimit } : {}),
      ...(input.hourlySendLimit !== undefined ? { hourlySendLimit: input.hourlySendLimit } : {}),
      ...(nextIsActive !== deviceRow.isActive ? { isActive: nextIsActive } : {}),
      status: derived.status,
      healthStatus: derived.healthStatus,
    };

    await this.prisma.device.update({
      where: { id: deviceId },
      data,
    });

    const response = await this.getDevice(principal, deviceId);

    await this.emitDeviceAudit({
      action: 'DEVICE_QUOTA_UPDATED' as AuditAction,
      organizationId,
      actorUserId: principal.userId,
      entityId: deviceId,
      metadata: {
        updatedFields: Object.keys(input),
      },
    });

    return response;
  }
}
