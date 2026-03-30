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

describe('Devices (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const assertString = (value: unknown, label: string): string => {
    if (typeof value !== 'string') {
      throw new Error(`Expected ${label} to be a string`);
    }
    return value;
  };

  const registerOwner = async () => {
    const suffix = Math.random().toString(36).slice(2, 10);
    const orgSlug = `org-${suffix}`;
    const email = `owner-${suffix}@example.com`;

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        organizationName: `Org ${suffix}`,
        organizationSlug: orgSlug,
        firstName: 'Test',
        lastName: `Owner${suffix}`,
        email,
        password: 'StrongPassw0rdAA1!',
      });

    expect(res.status).toBe(201);
    expect(typeof res.body.accessToken).toBe('string');

    return {
      accessToken: res.body.accessToken as string,
      orgSlug,
      email,
    };
  };

  const mkDevice = (suffix: string) => ({
    name: `Device ${suffix}`,
    platform: 'ANDROID' as const,
    deviceIdentifier: `dev-ext-${suffix}`,
    appVersion: '1.0.0',
    osVersion: '14',
    deviceModel: 'Pixel',
    pushToken: `push-${suffix}`,
    phoneNumber: `+1555${suffix}`.slice(0, 16),
    simLabel: `SIM-${suffix}`.slice(0, 20),
    capabilities: { smsSend: true, backgroundHeartbeat: true },
  });

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

    await prisma.deviceHeartbeat.deleteMany();
    await prisma.device.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('create/list/get/update/soft-delete device', async () => {
    const owner = await registerOwner();

    const suffix = Math.random().toString(36).slice(2, 10);
    const device = mkDevice(suffix);

    const created = await request(app.getHttpServer())
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(device);

    expect(created.status).toBe(201);
    const deviceId = assertString(created.body.id, 'deviceId');
    expect(created.body.deviceIdentifier).toBe(device.deviceIdentifier);

    const list = await request(app.getHttpServer())
      .get('/api/v1/devices')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.items)).toBe(true);
    expect(list.body.total).toBeGreaterThanOrEqual(1);

    const got = await request(app.getHttpServer())
      .get(`/api/v1/devices/${deviceId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(got.status).toBe(200);
    expect(got.body.id).toBe(created.body.id);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/devices/${deviceId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: `Device Updated ${suffix}` });

    expect(updated.status).toBe(200);
    expect(updated.body.name).toContain('Device Updated');

    const del = await request(app.getHttpServer())
      .delete(`/api/v1/devices/${deviceId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(del.status).toBe(204);

    const afterDelete = await request(app.getHttpServer())
      .get(`/api/v1/devices/${deviceId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(afterDelete.status).toBe(404);
    expect(afterDelete.body.error.code).toBe('NOT_FOUND');
  });

  it('heartbeat updates status/health', async () => {
    const owner = await registerOwner();
    const suffix = Math.random().toString(36).slice(2, 10);
    const device = mkDevice(suffix);

    const created = await request(app.getHttpServer())
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(device);

    const deviceId = assertString(created.body.id, 'deviceId');
    const heartbeat = await request(app.getHttpServer())
      .post(`/api/v1/devices/${deviceId}/heartbeat`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        status: 'ONLINE',
        batteryLevel: 85,
        signalStrength: 70,
        networkType: 'wifi',
        appVersion: '1.0.1',
        payload: { ts: Date.now(), note: 'ok' },
      });

    expect(heartbeat.status).toBe(201);
    expect(heartbeat.body.device.status).toBe('ONLINE');
    expect(heartbeat.body.device.healthStatus).toBe('HEALTHY');
    expect(typeof heartbeat.body.device.lastHeartbeatAt).toBe('string');
  });

  it('set-primary enforces a single primary device', async () => {
    const owner = await registerOwner();

    const suffixA = Math.random().toString(36).slice(2, 10);
    const suffixB = Math.random().toString(36).slice(2, 10);

    const createdA = await request(app.getHttpServer())
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(mkDevice(suffixA));

    const createdB = await request(app.getHttpServer())
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(mkDevice(suffixB));

    const deviceIdA = assertString(createdA.body.id, 'deviceIdA');
    const deviceIdB = assertString(createdB.body.id, 'deviceIdB');

    const setPrimaryB = await request(app.getHttpServer())
      .post(`/api/v1/devices/${deviceIdB}/set-primary`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({});

    expect(setPrimaryB.status).toBe(201);
    expect(setPrimaryB.body.id).toBe(deviceIdB);
    expect(setPrimaryB.body.isPrimary).toBe(true);

    const gotA = await request(app.getHttpServer())
      .get(`/api/v1/devices/${deviceIdA}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(gotA.body.isPrimary).toBe(false);
  });

  it('quota update can suspend a device', async () => {
    const owner = await registerOwner();
    const suffix = Math.random().toString(36).slice(2, 10);
    const device = mkDevice(suffix);

    const created = await request(app.getHttpServer())
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(device);

    const deviceId = assertString(created.body.id, 'deviceId');
    const quota = await request(app.getHttpServer())
      .patch(`/api/v1/devices/${deviceId}/quota`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        dailySendLimit: 10,
        hourlySendLimit: 2,
        status: 'SUSPENDED',
      });

    expect(quota.status).toBe(200);
    expect(quota.body.status).toBe('SUSPENDED');
    expect(quota.body.healthStatus).toBe('UNKNOWN');
    expect(quota.body.dailySendLimit).toBe(10);
    expect(quota.body.hourlySendLimit).toBe(2);
  });

  it('requires auth (401) and enforces cross-organization access (403)', async () => {
    const owner1 = await registerOwner();
    const suffix = Math.random().toString(36).slice(2, 10);

    const created = await request(app.getHttpServer())
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${owner1.accessToken}`)
      .send(mkDevice(suffix));

    const deviceId = assertString(created.body.id, 'deviceId');

    // 401 without token
    const unauth = await request(app.getHttpServer()).get(`/api/v1/devices/${deviceId}`);
    expect(unauth.status).toBe(401);
    expect(unauth.body.error.code).toBe('UNAUTHORIZED');

    const owner2 = await registerOwner();

    // 403 when trying to access a device outside the current organization
    const forbidden = await request(app.getHttpServer())
      .get(`/api/v1/devices/${deviceId}`)
      .set('Authorization', `Bearer ${owner2.accessToken}`);

    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');
  });
});
