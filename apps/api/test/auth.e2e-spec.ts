import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { configureHttpApplication } from '../src/bootstrap/http-application';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { REDIS_CLIENT } from '../src/infrastructure/redis/redis.tokens';

function isNestExpressApp(app: INestApplication): app is NestExpressApplication {
  return typeof (app as NestExpressApplication).getHttpAdapter === 'function';
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  expect(parts.length).toBe(3);
  const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad = payloadB64.length % 4 === 0 ? '' : '='.repeat(4 - (payloadB64.length % 4));
  const json = Buffer.from(payloadB64 + pad, 'base64').toString('utf8');
  return JSON.parse(json) as Record<string, unknown>;
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Expected ${label} to be a string`);
  }
  return value;
}

describe('Auth (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(REDIS_CLIENT)
      .useValue({
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn().mockResolvedValue('OK'),
      })
      .compile();

    const raw = moduleFixture.createNestApplication({ bodyParser: false });
    if (!isNestExpressApp(raw)) {
      throw new Error('Expected Express adapter');
    }
    app = raw;
    prisma = app.get(PrismaService);

    const config = app.get(ConfigService);
    configureHttpApplication(app, config);

    await app.init();

    // Keep roles/permissions seeded via AuthService bootstrap; clear user/org/session data for test isolation.
    await prisma.session.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  const mk = () => {
    const suffix = Math.random().toString(36).slice(2, 10);
    return {
      orgName: `Org ${suffix}`,
      orgSlug: `org-${suffix}`,
      firstName: 'Test',
      lastName: `User${suffix}`,
      email: `user-${suffix}@example.com`,
      password: 'StrongPassw0rdAA1!',
    };
  };

  it('register success + me endpoint', async () => {
    const input = mk();

    const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      organizationName: input.orgName,
      organizationSlug: input.orgSlug,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
    });

    expect(res.status).toBe(201);

    const accessToken = assertString(res.body.accessToken, 'accessToken');
    const refreshToken = assertString(res.body.refreshToken, 'refreshToken');
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');

    const payload = decodeJwtPayload(accessToken);
    expect(payload.sub).toBeDefined();
    expect(typeof payload.sessionId).toBe('string');

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(input.email.toLowerCase());
    expect(me.body.organization.slug).toBe(input.orgSlug.toLowerCase());
    expect(me.body.role.code).toBe('org_owner');
    expect(Array.isArray(me.body.permissions)).toBe(true);
  });

  it('login invalid password returns INVALID_CREDENTIALS', async () => {
    const input = mk();

    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      organizationName: input.orgName,
      organizationSlug: input.orgSlug,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: input.email, password: 'WrongPassword123A!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('refresh success rotates refresh token + me works', async () => {
    const input = mk();

    const reg = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      organizationName: input.orgName,
      organizationSlug: input.orgSlug,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
    });

    const refresh = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: assertString(reg.body.refreshToken, 'refreshToken') });

    expect(refresh.status).toBe(201);
    const accessToken = assertString(refresh.body.accessToken, 'accessToken');
    assertString(refresh.body.refreshToken, 'refreshToken');

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(input.email.toLowerCase());
  });

  it('logout success revokes access token', async () => {
    const input = mk();

    const reg = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      organizationName: input.orgName,
      organizationSlug: input.orgSlug,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
    });

    const accessToken = assertString(reg.body.accessToken, 'accessToken');

    const logout = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(logout.status).toBe(204);

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(me.status).toBe(401);
    expect(me.body.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('revoke one session', async () => {
    const input = mk();

    const reg = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      organizationName: input.orgName,
      organizationSlug: input.orgSlug,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
    });

    const accessTokenA = assertString(reg.body.accessToken, 'accessTokenA');
    const decodedA = decodeJwtPayload(accessTokenA);
    const sessionIdA = assertString(decodedA.sessionId, 'sessionIdA');

    const login2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: input.email, password: input.password, organizationSlug: input.orgSlug });

    const accessTokenB = assertString(login2.body.accessToken, 'accessTokenB');
    const decodedB = decodeJwtPayload(accessTokenB);
    const sessionIdB = assertString(decodedB.sessionId, 'sessionIdB');
    expect(sessionIdA).not.toBe(sessionIdB);

    const list1 = await request(app.getHttpServer())
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessTokenA}`);

    expect(list1.status).toBe(200);
    expect(Array.isArray(list1.body.sessions)).toBe(true);

    const revoke = await request(app.getHttpServer())
      .delete(`/api/v1/auth/sessions/${sessionIdB}`)
      .set('Authorization', `Bearer ${accessTokenA}`);
    expect(revoke.status).toBe(204);

    const meB = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessTokenB}`);
    expect(meB.status).toBe(401);

    const meA = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessTokenA}`);
    expect(meA.status).toBe(200);
  });

  it('logout-all revokes other sessions but keeps current session', async () => {
    const input = mk();

    const reg = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      organizationName: input.orgName,
      organizationSlug: input.orgSlug,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
    });

    const accessTokenA = assertString(reg.body.accessToken, 'accessTokenA');
    const decodedA = decodeJwtPayload(accessTokenA);
    const sessionIdA = assertString(decodedA.sessionId, 'sessionIdA');

    const login2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: input.email, password: input.password, organizationSlug: input.orgSlug });

    const accessTokenB = assertString(login2.body.accessToken, 'accessTokenB');
    const decodedB = decodeJwtPayload(accessTokenB);
    const sessionIdB = assertString(decodedB.sessionId, 'sessionIdB');
    expect(sessionIdA).not.toBe(sessionIdB);

    const logoutAll = await request(app.getHttpServer())
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${accessTokenA}`);
    expect(logoutAll.status).toBe(201);
    expect(logoutAll.body.keptSessionId).toBe(sessionIdA);
    expect(logoutAll.body.revokedSessionIds).toEqual(expect.arrayContaining([sessionIdB]));

    const meB = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessTokenB}`);
    expect(meB.status).toBe(401);

    const meA = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessTokenA}`);
    expect(meA.status).toBe(200);
  });
});
