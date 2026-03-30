import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TokenService } from './token.service';
import type { JwtAccessClaims } from '../../../common/types/jwt-payload.types';

describe('TokenService', () => {
  it('signs and verifies refresh tokens', async () => {
    const configMap = {
      'jwt.accessSecret': 'access-secret-min-16',
      'jwt.refreshSecret': 'refresh-secret-min-16',
      'jwt.accessTtlSeconds': 900,
      'jwt.refreshTtlSeconds': 2592000,
    } as const;

    const configMock = {
      getOrThrow: (key: keyof typeof configMap) => configMap[key],
    } as unknown as ConfigService;

    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'unused', signOptions: { expiresIn: 1 } })],
      providers: [TokenService, { provide: ConfigService, useValue: configMock }],
    }).compile();

    const svc = moduleRef.get(TokenService);

    const claims: JwtAccessClaims = {
      sub: 'user_1',
      email: 'user@example.com',
      sessionId: 'session_1',
      organizationId: 'org_1',
      membershipId: 'membership_1',
      roleCode: 'org_owner',
      roleScope: 'ORGANIZATION',
    };

    const refreshToken = await svc.signRefreshToken(claims);
    const verified = await svc.verifyRefreshToken(refreshToken);
    expect(verified.sub).toBe(claims.sub);
    expect(verified.sessionId).toBe(claims.sessionId);
    expect(verified.organizationId).toBe(claims.organizationId);

    const hash1 = svc.hashRefreshToken(refreshToken);
    const hash2 = svc.hashRefreshToken(refreshToken);
    expect(hash1).toBe(hash2);
  });
});
