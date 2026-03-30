import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../constants/auth.constants';
import { AppHttpException } from '../exceptions/app-http.exception';
import { ApiErrorCodes } from '../constants/http.constants';
import type { AuthPrincipal } from '../types/auth-principal.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) as string[] | undefined;

    const effectivePermissions = requiredPermissions ?? [];

    if (effectivePermissions.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthPrincipal }>();
    const principal = req.user;

    if (!principal) {
      throw new AppHttpException(
        ApiErrorCodes.FORBIDDEN,
        'Missing auth context',
        HttpStatus.FORBIDDEN,
      );
    }

    const hasAll = effectivePermissions.every((p) => principal.permissions.includes(p));

    if (!hasAll) {
      throw new AppHttpException(
        ApiErrorCodes.FORBIDDEN,
        'Insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
