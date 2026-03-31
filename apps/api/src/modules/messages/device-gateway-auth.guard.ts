import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { DeviceGatewayUnauthorizedException } from './exceptions/messages.exceptions';
import { DeviceGatewayAuthService } from './device-gateway-auth.service';
import type { DeviceGatewayPrincipal } from './types/message.types';

@Injectable()
export class DeviceGatewayAuthGuard implements CanActivate {
  constructor(private readonly auth: DeviceGatewayAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      deviceGateway?: DeviceGatewayPrincipal;
    }>();
    const authz = req.headers['authorization'];
    if (!authz?.startsWith('Bearer ')) {
      throw new DeviceGatewayUnauthorizedException('Missing bearer token');
    }
    const token = authz.slice('Bearer '.length).trim();
    const claims = await this.auth.verifyToken(token);
    req.deviceGateway = {
      deviceId: claims.sub,
      organizationId: claims.organizationId,
      deviceIdentifier: claims.deviceIdentifier,
    };
    return true;
  }
}
