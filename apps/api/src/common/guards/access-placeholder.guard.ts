import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../constants/auth.constants';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Global guard placeholder: honours `@Public()`.
 * Prompt 3 will compose `JwtAuthGuard` for non-public routes.
 */
@Injectable()
export class AccessPlaceholderGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtAuthGuard: JwtAuthGuard,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return this.jwtAuthGuard.canActivate(context) as boolean;
  }
}
