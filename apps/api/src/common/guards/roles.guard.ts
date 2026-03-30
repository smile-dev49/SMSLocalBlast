import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants/auth.constants';
import { AppHttpException } from '../exceptions/app-http.exception';
import { ApiErrorCodes } from '../constants/http.constants';
import type { AuthPrincipal } from '../types/auth-principal.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) as string[] | undefined;

    const effectiveRoles = requiredRoles ?? [];

    if (effectiveRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthPrincipal }>();
    const principal = req.user;
    if (!principal?.roleCode) {
      throw new AppHttpException(
        ApiErrorCodes.ROLE_FORBIDDEN,
        'Missing role context',
        HttpStatus.FORBIDDEN,
      );
    }

    const allowed = effectiveRoles.includes(principal.roleCode);
    if (!allowed) {
      throw new AppHttpException(
        ApiErrorCodes.ROLE_FORBIDDEN,
        'Insufficient role permissions',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
