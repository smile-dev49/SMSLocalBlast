import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_STRATEGY } from '../../common/constants/auth.constants';
import type { JwtAccessPayload } from '../../common/types/jwt-payload.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  validate(payload: unknown): JwtAccessPayload | null {
    if (!payload || typeof payload !== 'object') return null;
    const record = payload as Record<string, unknown>;
    const sub = record['sub'];
    const email = record['email'];
    if (typeof sub !== 'string' || typeof email !== 'string') return null;
    const organizationId = record['organizationId'];
    const core = { sub, email };
    return typeof organizationId === 'string' ? { ...core, organizationId } : core;
  }
}
