import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { DevicesService } from './devices.service';
import { DeviceIdParamSchema } from './dto/device-id.schema';
import { ListDevicesQuerySchema, type ListDevicesQuery } from './dto/list-devices.query.dto';
import { CreateDeviceBodySchema, type CreateDeviceBody } from './dto/create-device.dto';
import { UpdateDeviceBodySchema, type UpdateDeviceBody } from './dto/update-device.dto';
import { DeviceHeartbeatBodySchema, type DeviceHeartbeatBody } from './dto/device-heartbeat.dto';
import {
  SetDevicePrimaryBodySchema,
  type SetDevicePrimaryBody,
} from './dto/set-device-primary.dto';
import {
  UpdateDeviceQuotaBodySchema,
  type UpdateDeviceQuotaBody,
} from './dto/update-device-quota.dto';
import type { DeviceListResponse, DeviceResponse } from './types/device.types';
import type { DeviceHeartbeatResponse } from './types/device.types';

@ApiTags('Devices')
@Controller({ path: 'devices', version: '1' })
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Permissions('devices.read')
  @ApiBearerAuth('access-token')
  @Get()
  @ApiOperation({ summary: 'List organization devices (paginated)' })
  async listDevices(
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(ListDevicesQuerySchema)) query: ListDevicesQuery,
  ): Promise<DeviceListResponse> {
    return this.devicesService.listDevices(user, query);
  }

  @Permissions('devices.write')
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({ summary: 'Register/create a device in the current organization' })
  @ApiResponse({ status: 201 })
  async createDevice(
    @CurrentUser() user: AuthPrincipal,
    @Body(new ZodValidationPipe(CreateDeviceBodySchema)) body: CreateDeviceBody,
  ): Promise<DeviceResponse> {
    return this.devicesService.registerDevice(user, body);
  }

  @Permissions('devices.read')
  @ApiBearerAuth('access-token')
  @Get(':deviceId')
  @ApiOperation({ summary: 'Get one device (organization-scoped)' })
  async getDevice(
    @CurrentUser() user: AuthPrincipal,
    @Param('deviceId', new ZodValidationPipe(DeviceIdParamSchema)) deviceId: string,
  ): Promise<DeviceResponse> {
    return this.devicesService.getDevice(user, deviceId);
  }

  @Permissions('devices.write')
  @ApiBearerAuth('access-token')
  @Patch(':deviceId')
  @ApiOperation({ summary: 'Update editable device fields (organization-scoped)' })
  async updateDevice(
    @CurrentUser() user: AuthPrincipal,
    @Param('deviceId', new ZodValidationPipe(DeviceIdParamSchema)) deviceId: string,
    @Body(new ZodValidationPipe(UpdateDeviceBodySchema)) body: UpdateDeviceBody,
  ): Promise<DeviceResponse> {
    return this.devicesService.updateDevice(user, deviceId, body);
  }

  @Permissions('devices.write')
  @ApiBearerAuth('access-token')
  @Delete(':deviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a device' })
  async deleteDevice(
    @CurrentUser() user: AuthPrincipal,
    @Param('deviceId', new ZodValidationPipe(DeviceIdParamSchema)) deviceId: string,
  ): Promise<void> {
    await this.devicesService.softDeleteDevice(user, deviceId);
  }

  @Permissions('devices.heartbeat')
  @ApiBearerAuth('access-token')
  @Post(':deviceId/heartbeat')
  @ApiOperation({ summary: 'Receive a device heartbeat' })
  async heartbeat(
    @CurrentUser() user: AuthPrincipal,
    @Param('deviceId', new ZodValidationPipe(DeviceIdParamSchema)) deviceId: string,
    @Body(new ZodValidationPipe(DeviceHeartbeatBodySchema)) body: DeviceHeartbeatBody,
  ): Promise<{ heartbeat: DeviceHeartbeatResponse; device: DeviceResponse }> {
    return this.devicesService.receiveHeartbeat(user, deviceId, body);
  }

  @Permissions('devices.manage')
  @ApiBearerAuth('access-token')
  @Post(':deviceId/set-primary')
  @ApiOperation({ summary: 'Set this device as the org primary device (only one allowed)' })
  async setPrimary(
    @CurrentUser() user: AuthPrincipal,
    @Param('deviceId', new ZodValidationPipe(DeviceIdParamSchema)) deviceId: string,
    @Body(new ZodValidationPipe(SetDevicePrimaryBodySchema)) body: SetDevicePrimaryBody,
  ): Promise<DeviceResponse> {
    return this.devicesService.setPrimary(user, deviceId, body);
  }

  @Permissions('devices.manage')
  @ApiBearerAuth('access-token')
  @Patch(':deviceId/quota')
  @ApiOperation({ summary: 'Update device quota and active/suspension state' })
  async updateQuota(
    @CurrentUser() user: AuthPrincipal,
    @Param('deviceId', new ZodValidationPipe(DeviceIdParamSchema)) deviceId: string,
    @Body(new ZodValidationPipe(UpdateDeviceQuotaBodySchema)) body: UpdateDeviceQuotaBody,
  ): Promise<DeviceResponse> {
    return this.devicesService.updateQuota(user, deviceId, body);
  }
}
