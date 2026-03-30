import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_STRATEGY } from '../../common/constants/auth.constants';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import type { JwtAccessClaims } from '../../common/types/jwt-payload.types';
import { AuthContextResolver } from './auth-context/auth-context.resolver';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY) {
  constructor(
    config: ConfigService,
    private readonly resolver: AuthContextResolver,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: unknown): Promise<AuthPrincipal | null> {
    const claims = parseAccessClaims(payload);
    if (!claims) return null;
    return this.resolver.resolveFromAccessClaims(claims);
  }
}

function parseAccessClaims(payload: unknown): JwtAccessClaims | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;

  const sub = record['sub'];
  const email = record['email'];
  const sessionId = record['sessionId'];
  if (typeof sub !== 'string' || typeof email !== 'string' || typeof sessionId !== 'string') {
    return null;
  }

  const organizationId =
    record['organizationId'] === null
      ? null
      : typeof record['organizationId'] === 'string'
        ? record['organizationId']
        : null;

  const membershipId =
    record['membershipId'] === null
      ? null
      : typeof record['membershipId'] === 'string'
        ? record['membershipId']
        : null;

  const roleCode =
    record['roleCode'] === null
      ? null
      : typeof record['roleCode'] === 'string'
        ? record['roleCode']
        : null;

  const roleScope =
    record['roleScope'] === null
      ? null
      : record['roleScope'] === 'SYSTEM' || record['roleScope'] === 'ORGANIZATION'
        ? record['roleScope']
        : null;

  return {
    sub,
    email,
    sessionId,
    organizationId,
    membershipId,
    roleCode,
    roleScope,
  };
}
