import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { DeviceGatewayUnauthorizedException } from './exceptions/messages.exceptions';
import type { DeviceGatewayLoginBody } from './dto/device-gateway.dto';

interface DeviceGatewayClaims {
  readonly sub: string;
  readonly organizationId: string;
  readonly deviceIdentifier: string;
  readonly scope: 'device-gateway';
}

@Injectable()
export class DeviceGatewayAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditLogService,
  ) {}

  private secret(): string {
    return (
      this.config.get<string>('deviceGateway.jwtSecret') ??
      this.config.getOrThrow<string>('jwt.accessSecret')
    );
  }

  private ttlSeconds(): number {
    return this.config.get<number>('deviceGateway.accessTtlSeconds') ?? 900;
  }

  async login(body: DeviceGatewayLoginBody): Promise<{ accessToken: string }> {
    const device = await this.prisma.device.findUnique({
      where: { deviceIdentifier: body.deviceIdentifier },
      select: {
        id: true,
        organizationId: true,
        deviceIdentifier: true,
        authSecretHash: true,
        status: true,
        isActive: true,
        deletedAt: true,
      },
    });
    if (!device?.authSecretHash) {
      throw new DeviceGatewayUnauthorizedException();
    }
    if (
      device.deletedAt !== null ||
      !device.isActive ||
      ['SUSPENDED', 'DISCONNECTED'].includes(device.status)
    ) {
      throw new DeviceGatewayUnauthorizedException('Device is not allowed to authenticate');
    }
    const ok = await argon2.verify(device.authSecretHash, body.secret);
    if (!ok) throw new DeviceGatewayUnauthorizedException();
    const claims: DeviceGatewayClaims = {
      sub: device.id,
      organizationId: device.organizationId,
      deviceIdentifier: device.deviceIdentifier,
      scope: 'device-gateway',
    };
    const accessToken = await this.jwt.signAsync(claims, {
      secret: this.secret(),
      expiresIn: this.ttlSeconds(),
    });
    await this.prisma.device.update({
      where: { id: device.id },
      data: { lastAuthenticatedAt: new Date(), lastTokenIssuedAt: new Date() },
    });
    await this.audit.emit({
      action: 'DEVICE_GATEWAY_AUTHENTICATED',
      organizationId: device.organizationId,
      entityType: 'device',
      entityId: device.id,
      metadata: { deviceIdentifier: device.deviceIdentifier },
    });
    return { accessToken };
  }

  async verifyToken(token: string): Promise<DeviceGatewayClaims> {
    const record = await this.jwt.verifyAsync<Record<string, unknown>>(token, {
      secret: this.secret(),
    });
    if (
      typeof record['sub'] !== 'string' ||
      typeof record['organizationId'] !== 'string' ||
      typeof record['deviceIdentifier'] !== 'string' ||
      record['scope'] !== 'device-gateway'
    ) {
      throw new DeviceGatewayUnauthorizedException();
    }
    return {
      sub: record['sub'],
      organizationId: record['organizationId'],
      deviceIdentifier: record['deviceIdentifier'],
      scope: 'device-gateway',
    };
  }
}
