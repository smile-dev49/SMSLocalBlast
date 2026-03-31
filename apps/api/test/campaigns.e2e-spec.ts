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

describe('Campaigns (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const assertString = (value: unknown, label: string): string => {
    if (typeof value !== 'string') throw new Error(`Expected ${label} string`);
    return value;
  };

  const registerOwner = async () => {
    const suffix = Math.random().toString(36).slice(2, 10);
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        organizationName: `Camp Org ${suffix}`,
        organizationSlug: `camp-org-${suffix}`,
        firstName: 'Owner',
        lastName: suffix,
        email: `camp-owner-${suffix}@example.com`,
        password: 'StrongPassw0rdAA1!',
      });
    expect(res.status).toBe(201);
    return {
      accessToken: assertString(res.body.accessToken, 'accessToken'),
    };
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

  it('create with list + direct contacts, preview, summary, lifecycle, skipped blocked', async () => {
    const owner = await registerOwner();

    const tpl = await request(app.getHttpServer())
      .post('/api/v1/templates')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: `CmpTpl-${String(Date.now())}`, body: 'Hi {{FirstName}}', channelType: 'SMS' });
    expect(tpl.status).toBe(201);
    const templateId = assertString(tpl.body.id, 'templateId');

    const cActive = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ firstName: 'Ann', phoneNumber: '+15554001001' });
    expect(cActive.status).toBe(201);
    const activeId = assertString(cActive.body.id, 'activeId');

    const cBlocked = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ firstName: 'Bob', phoneNumber: '+15554001002' });
    expect(cBlocked.status).toBe(201);
    const blockedId = assertString(cBlocked.body.id, 'blockedId');

    await request(app.getHttpServer())
      .post(`/api/v1/contacts/${blockedId}/block`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(201);

    const list = await request(app.getHttpServer())
      .post('/api/v1/contact-lists')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: `List-${String(Date.now())}` });
    expect(list.status).toBe(201);
    const listId = assertString(list.body.id, 'listId');

    await request(app.getHttpServer())
      .post(`/api/v1/contact-lists/${listId}/contacts`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ contactIds: [activeId] })
      .expect(201);

    const preview = await request(app.getHttpServer())
      .post('/api/v1/campaigns/preview')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        templateId,
        target: { contactIds: [activeId, blockedId], contactListIds: [] },
        missingVariableStrategy: 'empty',
      });
    expect(preview.status).toBe(200);
    expect(preview.body.sendableRecipients).toBe(1);
    expect(preview.body.skippedRecipients).toBe(1);

    const created = await request(app.getHttpServer())
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: `Camp-${String(Date.now())}`,
        templateId,
        target: { contactIds: [blockedId], contactListIds: [listId] },
        snapshotMissingVariableStrategy: 'empty',
      });
    expect(created.status).toBe(201);
    const campaignId = assertString(created.body.id, 'campaignId');
    expect(created.body.skippedCount).toBeGreaterThanOrEqual(1);
    expect(created.body.readyCount).toBeGreaterThanOrEqual(1);

    const summary = await request(app.getHttpServer())
      .get(`/api/v1/campaigns/${campaignId}/summary`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(summary.status).toBe(200);
    expect(summary.body.campaign.id).toBe(campaignId);

    const future = new Date(Date.now() + 3_600_000).toISOString();
    const sched = await request(app.getHttpServer())
      .post(`/api/v1/campaigns/${campaignId}/schedule`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ scheduledAt: future });
    expect(sched.status).toBe(200);
    expect(sched.body.status).toBe('SCHEDULED');

    const start = await request(app.getHttpServer())
      .post(`/api/v1/campaigns/${campaignId}/start`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(start.status).toBe(200);
    expect(start.body.status).toBe('PROCESSING');

    const pause = await request(app.getHttpServer())
      .post(`/api/v1/campaigns/${campaignId}/pause`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(pause.status).toBe(200);
    expect(pause.body.status).toBe('PAUSED');

    const cancel = await request(app.getHttpServer())
      .post(`/api/v1/campaigns/${campaignId}/cancel`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe('CANCELLED');
  });

  it('denies cross-org access', async () => {
    const owner1 = await registerOwner();
    const owner2 = await registerOwner();

    const tpl = await request(app.getHttpServer())
      .post('/api/v1/templates')
      .set('Authorization', `Bearer ${owner1.accessToken}`)
      .send({ name: `X-${String(Date.now())}`, body: 'Hi {{FirstName}}', channelType: 'SMS' });
    expect(tpl.status).toBe(201);
    const templateId = assertString(tpl.body.id, 'templateId');

    const c = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${owner1.accessToken}`)
      .send({ firstName: 'X', phoneNumber: '+15554002001' });
    expect(c.status).toBe(201);
    const contactId = assertString(c.body.id, 'contactId');

    const camp = await request(app.getHttpServer())
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${owner1.accessToken}`)
      .send({
        name: `Xorg-${String(Date.now())}`,
        templateId,
        target: { contactIds: [contactId], contactListIds: [] },
      });
    expect(camp.status).toBe(201);
    const campaignId = assertString(camp.body.id, 'campaignId');

    const forbidden = await request(app.getHttpServer())
      .get(`/api/v1/campaigns/${campaignId}`)
      .set('Authorization', `Bearer ${owner2.accessToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('org_member can preview but not create campaigns', async () => {
    const owner = await registerOwner();
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    const organizationId = assertString(me.body.organization.id, 'organizationId');

    const memberRole = await prisma.role.findUnique({
      where: { code: 'org_member' },
      select: { id: true },
    });
    if (!memberRole) throw new Error('org_member role not found');

    const memberEmail = `camp-member-${Math.random().toString(36).slice(2, 10)}@example.com`;
    const memberHash = await argon2.hash('StrongPassw0rdAA1!');
    const memberUser = await prisma.user.create({
      data: {
        email: memberEmail,
        firstName: 'M',
        lastName: 'Member',
        passwordHash: memberHash,
      },
      select: { id: true },
    });
    await prisma.membership.create({
      data: {
        userId: memberUser.id,
        organizationId,
        roleId: memberRole.id,
      },
    });

    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: memberEmail,
      password: 'StrongPassw0rdAA1!',
      organizationSlug: me.body.organization.slug,
    });
    expect(login.status).toBe(201);
    const memberToken = assertString(login.body.accessToken, 'memberToken');

    const tpl = await request(app.getHttpServer())
      .post('/api/v1/templates')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: `Mtpl-${String(Date.now())}`, body: 'Hi {{FirstName}}', channelType: 'SMS' });
    const templateId = assertString(tpl.body.id, 'templateId');

    const c = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ firstName: 'Q', phoneNumber: '+15554003001' });
    const contactId = assertString(c.body.id, 'contactId');

    const okPreview = await request(app.getHttpServer())
      .post('/api/v1/campaigns/preview')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        templateId,
        target: { contactIds: [contactId], contactListIds: [] },
      });
    expect(okPreview.status).toBe(200);

    const denied = await request(app.getHttpServer())
      .post('/api/v1/campaigns')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'No',
        templateId,
        target: { contactIds: [contactId], contactListIds: [] },
      });
    expect(denied.status).toBe(403);
  });
});
