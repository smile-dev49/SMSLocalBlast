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

describe('Templates (e2e)', () => {
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
        organizationName: `Tpl Org ${suffix}`,
        organizationSlug: `tpl-org-${suffix}`,
        firstName: 'Owner',
        lastName: suffix,
        email: `tpl-owner-${suffix}@example.com`,
        password: 'StrongPassw0rdAA1!',
      });
    expect(res.status).toBe(201);
    return {
      accessToken: assertString(res.body.accessToken, 'accessToken'),
      organizationSlug: assertString(
        res.body.organization?.slug ?? `tpl-org-${suffix}`,
        'organizationSlug',
      ),
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

  it('create/list/get/update/delete template', async () => {
    const owner = await registerOwner();

    const created = await request(app.getHttpServer())
      .post('/api/v1/templates')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: 'Welcome Template',
        body: 'Hello {{FirstName}}',
        channelType: 'SMS',
      });
    expect(created.status).toBe(201);
    const templateId = assertString(created.body.id, 'templateId');

    const list = await request(app.getHttpServer())
      .get('/api/v1/templates')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);

    const got = await request(app.getHttpServer())
      .get(`/api/v1/templates/${templateId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(got.status).toBe(200);
    expect(got.body.variables).toContain('FirstName');

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/templates/${templateId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ body: 'Hi {{FirstName}} {{LastName}}' });
    expect(updated.status).toBe(200);

    const del = await request(app.getHttpServer())
      .delete(`/api/v1/templates/${templateId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(del.status).toBe(204);
  });

  it('validate and render preview (direct + stored with contact)', async () => {
    const owner = await registerOwner();

    const template = await request(app.getHttpServer())
      .post('/api/v1/templates')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: `Tpl-${String(Date.now())}`,
        body: 'Hello {{FirstName}}, balance {{Balance}}',
      });
    const templateId = assertString(template.body.id, 'templateId');

    const validate = await request(app.getHttpServer())
      .post('/api/v1/templates/validate')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        body: 'Hello {{FirstName}}',
        mergeFields: { FirstName: 'Jane' },
        missingVariableStrategy: 'strict',
      });
    expect(validate.status).toBe(201);
    expect(validate.body.isValid).toBe(true);
    expect(validate.body.renderedPreview).toBe('Hello Jane');

    const direct = await request(app.getHttpServer())
      .post('/api/v1/templates/render-preview')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        body: 'Hello {{FirstName}} {{Missing}}',
        mergeFields: { FirstName: 'Jane' },
        missingVariableStrategy: 'empty',
      });
    expect(direct.status).toBe(201);
    expect(direct.body.renderedText).toBe('Hello Jane ');

    const contact = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ firstName: 'Ana', phoneNumber: '+15559001000' });
    const contactId = assertString(contact.body.id, 'contactId');

    const stored = await request(app.getHttpServer())
      .post(`/api/v1/templates/${templateId}/render-preview`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ contactId, missingVariableStrategy: 'empty' });
    expect(stored.status).toBe(201);
    expect(stored.body.renderedText).toContain('Ana');
  });

  it('enforces org scoping and permissions', async () => {
    const owner1 = await registerOwner();
    const owner2 = await registerOwner();

    const created = await request(app.getHttpServer())
      .post('/api/v1/templates')
      .set('Authorization', `Bearer ${owner1.accessToken}`)
      .send({ name: 'PrivateTpl', body: 'x' });
    const templateId = assertString(created.body.id, 'templateId');

    const forbiddenOrg = await request(app.getHttpServer())
      .get(`/api/v1/templates/${templateId}`)
      .set('Authorization', `Bearer ${owner2.accessToken}`);
    expect(forbiddenOrg.status).toBe(403);

    const ownerMe = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${owner1.accessToken}`);
    const organizationId = assertString(ownerMe.body.organization.id, 'organizationId');
    const orgSlug = assertString(ownerMe.body.organization.slug, 'organizationSlug');

    const role = await prisma.role.findUnique({
      where: { code: 'org_member' },
      select: { id: true },
    });
    if (!role) throw new Error('org_member role missing');

    const email = `tpl-member-${Math.random().toString(36).slice(2, 10)}@example.com`;
    const pass = 'StrongPassw0rdAA1!';
    const user = await prisma.user.create({
      data: { email, firstName: 'Member', lastName: 'Tpl', passwordHash: await argon2.hash(pass) },
      select: { id: true },
    });
    await prisma.membership.create({
      data: { userId: user.id, organizationId, roleId: role.id },
    });

    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email,
      password: pass,
      organizationSlug: orgSlug,
    });
    expect(login.status).toBe(201);
    const memberToken = assertString(login.body.accessToken, 'memberToken');

    const deniedWrite = await request(app.getHttpServer())
      .post('/api/v1/templates')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'NoWrite', body: 'x' });
    expect(deniedWrite.status).toBe(403);
  });
});
