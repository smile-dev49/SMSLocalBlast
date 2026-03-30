import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'node:crypto';
import type { JwtAccessClaims } from '../../../common/types/jwt-payload.types';
import { z } from 'zod';

const jwtAccessClaimsSchema = z.object({
  sub: z.string(),
  email: z.string(),
  sessionId: z.string(),
  organizationId: z.string().nullable(),
  membershipId: z.string().nullable(),
  roleCode: z.string().nullable(),
  roleScope: z.enum(['SYSTEM', 'ORGANIZATION']).nullable(),
});

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signAccessToken(claims: JwtAccessClaims): Promise<string> {
    const secret = this.config.getOrThrow<string>('jwt.accessSecret');
    const expiresInSeconds = this.config.getOrThrow<number>('jwt.accessTtlSeconds');
    return this.jwt.signAsync(claims, { secret, expiresIn: expiresInSeconds });
  }

  async signRefreshToken(claims: JwtAccessClaims): Promise<string> {
    const secret = this.config.getOrThrow<string>('jwt.refreshSecret');
    const expiresInSeconds = this.config.getOrThrow<number>('jwt.refreshTtlSeconds');
    return this.jwt.signAsync(claims, { secret, expiresIn: expiresInSeconds });
  }

  async verifyRefreshToken(token: string): Promise<JwtAccessClaims> {
    const secret = this.config.getOrThrow<string>('jwt.refreshSecret');
    const payload: unknown = await this.jwt.verifyAsync(token, { secret });
    return jwtAccessClaimsSchema.parse(payload);
  }

  hashRefreshToken(refreshToken: string): string {
    return crypto.createHash('sha256').update(refreshToken, 'utf8').digest('hex');
  }

  getRefreshExpiresAt(now: Date = new Date()): Date {
    const seconds = this.config.getOrThrow<number>('jwt.refreshTtlSeconds');
    return new Date(now.getTime() + seconds * 1000);
  }
}
