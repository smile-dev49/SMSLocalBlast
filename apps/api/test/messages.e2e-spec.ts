import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
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

describe('Messages + Device Gateway (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const assertString = (v: unknown, label: string): string => {
    if (typeof v !== 'string') throw new Error(`Expected ${label} string`);
    return v;
  };

  const registerOwner = async () => {
    const suffix = Math.random().toString(36).slice(2, 10);
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        organizationName: `Msg Org ${suffix}`,
        organizationSlug: `msg-org-${suffix}`,
        firstName: 'Owner',
        lastName: suffix,
        email: `msg-owner-${suffix}@example.com`,
        password: 'StrongPassw0rdAA1!',
      });
    expect(res.status).toBe(201);
    return { accessToken: assertString(res.body.accessToken, 'accessToken') };
  };

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
    if (!isNestExpressApp(raw)) throw new Error('Expected express app');
    app = raw;
    prisma = app.get(PrismaService);
    configureHttpApplication(app, app.get(ConfigService));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('starting campaign generates messages and supports list/detail/events/retry/cancel', async () => {
    const owner = await registerOwner();

    const tpl = await request(app.getHttpServer())
      .post('/api/v1/templates')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: `MsgTpl-${String(Date.now())}`, body: 'Hi {{FirstName}}', channelType: 'SMS' });
    expect(tpl.status).toBe(201);
    const templateId = assertString(tpl.body.id, 'templateId');

    const contact = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ firstName: 'Amy', phoneNumber: '+15556001001' });
    expect(contact.status).toBe(201);
    const contactId = assertString(contact.body.id, 'contactId');

    const campaign = await request(app.getHttpServer())
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: `MsgCamp-${String(Date.now())}`,
        templateId,
        target: { contactIds: [contactId], contactListIds: [] },
      });
    expect(campaign.status).toBe(201);
    const campaignId = assertString(campaign.body.id, 'campaignId');

    const started = await request(app.getHttpServer())
      .post(`/api/v1/campaigns/${campaignId}/start`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(started.status).toBe(200);

    const listed = await request(app.getHttpServer())
      .get('/api/v1/messages')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(listed.status).toBe(200);
    expect(listed.body.total).toBeGreaterThanOrEqual(1);
    const messageId = assertString(listed.body.items[0].id, 'messageId');

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/messages/${messageId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(detail.status).toBe(200);

    const events = await request(app.getHttpServer())
      .get(`/api/v1/messages/${messageId}/events`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(events.status).toBe(200);

    await prisma.outboundMessage.update({
      where: { id: messageId },
      data: { status: 'FAILED', failedAt: new Date() },
    });
    const retried = await request(app.getHttpServer())
      .post(`/api/v1/messages/${messageId}/retry`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({});
    expect(retried.status).toBe(201);
    expect(retried.body.status).toBe('READY');

    await prisma.outboundMessage.update({
      where: { id: messageId },
      data: { status: 'READY', failedAt: null },
    });
    const cancelled = await request(app.getHttpServer())
      .post(`/api/v1/messages/${messageId}/cancel`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({});
    expect(cancelled.status).toBe(201);
    expect(cancelled.body.status).toBe('CANCELLED');
  });

  it('device gateway auth + pull + callback endpoints work idempotently', async () => {
    const owner = await registerOwner();
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    const orgId = assertString(me.body.organization.id, 'organizationId');

    const device = await request(app.getHttpServer())
      .post('/api/v1/devices')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'GW', platform: 'ANDROID', deviceIdentifier: `gw-${String(Date.now())}` });
    expect(device.status).toBe(201);
    const deviceId = assertString(device.body.id, 'deviceId');
    const deviceIdentifier = assertString(device.body.deviceIdentifier, 'deviceIdentifier');
    const secret = 'GatewaySecretAA11!';
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        authSecretHash: await argon2.hash(secret),
        status: 'ONLINE',
        isActive: true,
      },
    });

    const message = await prisma.outboundMessage.create({
      data: {
        organizationId: orgId,
        normalizedPhoneNumber: '15556002001',
        renderedBody: 'Gateway body',
        status: 'QUEUED',
      },
      select: { id: true },
    });

    const login = await request(app.getHttpServer())
      .post('/api/v1/device-gateway/auth/login')
      .send({ deviceIdentifier, secret });
    expect(login.status).toBe(201);
    const gwToken = assertString(login.body.accessToken, 'gatewayToken');

    const pull = await request(app.getHttpServer())
      .post('/api/v1/device-gateway/dispatch/pull')
      .set('Authorization', `Bearer ${gwToken}`)
      .send({});
    expect(pull.status).toBe(201);
    expect(pull.body.items.length).toBeGreaterThanOrEqual(1);

    const ack = await request(app.getHttpServer())
      .post(`/api/v1/device-gateway/messages/${message.id}/ack-dispatch`)
      .set('Authorization', `Bearer ${gwToken}`)
      .send({ idempotencyKey: 'ack-1' });
    expect(ack.status).toBe(201);

    const sent = await request(app.getHttpServer())
      .post(`/api/v1/device-gateway/messages/${message.id}/report-sent`)
      .set('Authorization', `Bearer ${gwToken}`)
      .send({ idempotencyKey: 'sent-1' });
    expect(sent.status).toBe(201);

    const delivered = await request(app.getHttpServer())
      .post(`/api/v1/device-gateway/messages/${message.id}/report-delivered`)
      .set('Authorization', `Bearer ${gwToken}`)
      .send({ idempotencyKey: 'dlv-1' });
    expect(delivered.status).toBe(201);

    const duplicateDelivered = await request(app.getHttpServer())
      .post(`/api/v1/device-gateway/messages/${message.id}/report-delivered`)
      .set('Authorization', `Bearer ${gwToken}`)
      .send({ idempotencyKey: 'dlv-1' });
    expect(duplicateDelivered.status).toBe(201);
  });

  it('operations endpoints expose queue and processing visibility', async () => {
    const owner = await registerOwner();
    const summary = await request(app.getHttpServer())
      .get('/api/v1/operations/queues/summary')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(summary.status).toBe(200);

    const lag = await request(app.getHttpServer())
      .get('/api/v1/operations/queues/lag')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(lag.status).toBe(200);
    expect(typeof lag.body.queue).toBe('string');

    const processing = await request(app.getHttpServer())
      .get('/api/v1/operations/campaigns/processing?limit=5')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(processing.status).toBe(200);
    expect(Array.isArray(processing.body)).toBe(true);
  });
});
