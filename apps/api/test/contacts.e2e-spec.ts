import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as argon2 from 'argon2';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { configureHttpApplication } from '../src/bootstrap/http-application';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { REDIS_CLIENT } from '../src/infrastructure/redis/redis.tokens';

function isNestExpressApp(app: INestApplication): app is NestExpressApplication {
  return typeof (app as NestExpressApplication).getHttpAdapter === 'function';
}

describe('Contacts (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const assertString = (value: unknown, label: string): string => {
    if (typeof value !== 'string') throw new Error(`Expected ${label} to be string`);
    return value;
  };

  const registerOwner = async () => {
    const suffix = Math.random().toString(36).slice(2, 10);
    const orgSlug = `contacts-org-${suffix}`;
    const email = `owner-${suffix}@example.com`;

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        organizationName: `Contacts Org ${suffix}`,
        organizationSlug: orgSlug,
        firstName: 'Owner',
        lastName: suffix,
        email,
        password: 'StrongPassw0rdAA1!',
      });
    expect(res.status).toBe(201);
    return {
      accessToken: assertString(res.body.accessToken, 'accessToken'),
      orgSlug,
      email,
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

    const config = app.get(ConfigService);
    configureHttpApplication(app, config);
    await app.init();

    await prisma.contactListMembership.deleteMany();
    await prisma.contactCustomFieldValue.deleteMany();
    await prisma.contact.deleteMany();
    await prisma.contactList.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('create/list/get/update/delete contact', async () => {
    const owner = await registerOwner();

    const created = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: '+1 (555) 200-3000',
        email: 'JANE@EXAMPLE.COM',
      });
    expect(created.status).toBe(201);
    const contactId = assertString(created.body.id, 'contactId');
    expect(created.body.normalizedPhoneNumber).toBe('+15552003000');
    expect(created.body.email).toBe('jane@example.com');

    const list = await request(app.getHttpServer())
      .get('/api/v1/contacts')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(list.status).toBe(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);

    const got = await request(app.getHttpServer())
      .get(`/api/v1/contacts/${contactId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(got.status).toBe(200);
    expect(got.body.id).toBe(contactId);

    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/contacts/${contactId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ notes: 'VIP contact' });
    expect(updated.status).toBe(200);
    expect(updated.body.notes).toBe('VIP contact');

    const del = await request(app.getHttpServer())
      .delete(`/api/v1/contacts/${contactId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(del.status).toBe(204);
  });

  it('create/list list + add/remove contact member', async () => {
    const owner = await registerOwner();
    const contact = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        firstName: 'List',
        lastName: 'Member',
        phoneNumber: '+15552004000',
      });
    const contactId = assertString(contact.body.id, 'contactId');

    const createdList = await request(app.getHttpServer())
      .post('/api/v1/contact-lists')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'VIP List' });
    expect(createdList.status).toBe(201);
    const listId = assertString(createdList.body.id, 'listId');

    const lists = await request(app.getHttpServer())
      .get('/api/v1/contact-lists')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(lists.status).toBe(200);
    expect(lists.body.total).toBeGreaterThanOrEqual(1);

    const add = await request(app.getHttpServer())
      .post(`/api/v1/contact-lists/${listId}/contacts`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ contactIds: [contactId] });
    expect(add.status).toBe(201);
    expect(add.body.added).toBe(1);

    const remove = await request(app.getHttpServer())
      .delete(`/api/v1/contact-lists/${listId}/contacts/${contactId}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(remove.status).toBe(204);
  });

  it('upserts custom fields and supports opt-out/block/unblock', async () => {
    const owner = await registerOwner();
    const created = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        firstName: 'Custom',
        phoneNumber: '+15552005000',
      });
    const contactId = assertString(created.body.id, 'contactId');

    const fields = await request(app.getHttpServer())
      .put(`/api/v1/contacts/${contactId}/custom-fields`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        fields: [
          { fieldKey: 'Balance', fieldValue: '100.50', valueType: 'NUMBER' },
          { fieldKey: 'PreferredDate', fieldValue: '2026-06-01', valueType: 'DATE' },
        ],
      });
    expect(fields.status).toBe(200);
    expect(fields.body.customFields.length).toBeGreaterThanOrEqual(2);
    expect(fields.body.mergeFields.Balance).toBe('100.50');

    const optedOut = await request(app.getHttpServer())
      .post(`/api/v1/contacts/${contactId}/opt-out`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(optedOut.status).toBe(201);
    expect(optedOut.body.status).toBe('OPTED_OUT');

    const blocked = await request(app.getHttpServer())
      .post(`/api/v1/contacts/${contactId}/block`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(blocked.status).toBe(201);
    expect(blocked.body.status).toBe('BLOCKED');

    const unblocked = await request(app.getHttpServer())
      .post(`/api/v1/contacts/${contactId}/unblock`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(unblocked.status).toBe(201);
    expect(unblocked.body.status).toBe('ACTIVE');
  });

  it('import preview + confirm', async () => {
    const owner = await registerOwner();

    const payload = {
      sourceType: 'CSV_IMPORT',
      rows: [
        { First: 'Ann', Last: 'A', Phone: '+15552006000', Balance: '10' },
        { First: 'Bob', Last: 'B', Phone: '+15552006000', Balance: '20' },
        { First: 'Bad', Last: 'Row', Phone: 'invalid' },
      ],
      mapping: {
        firstName: 'First',
        lastName: 'Last',
        phoneNumber: 'Phone',
        customFields: {
          Balance: 'Balance',
        },
      },
      options: {
        deduplicateByPhone: true,
        skipInvalidRows: true,
        updateExisting: false,
        createListName: 'Imported June',
      },
    };

    const preview = await request(app.getHttpServer())
      .post('/api/v1/contacts/import/preview')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(payload);
    expect(preview.status).toBe(201);
    expect(preview.body.totalRows).toBe(3);
    expect(preview.body.invalidRows).toBe(1);

    const confirm = await request(app.getHttpServer())
      .post('/api/v1/contacts/import/confirm')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send(payload);
    expect(confirm.status).toBe(201);
    expect(confirm.body.createdContacts).toBeGreaterThanOrEqual(1);
  });

  it('denies cross-org access and enforces permissions', async () => {
    const owner1 = await registerOwner();
    const owner2 = await registerOwner();

    const contact = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${owner1.accessToken}`)
      .send({
        firstName: 'Cross',
        phoneNumber: '+15552007000',
      });
    const contactId = assertString(contact.body.id, 'contactId');

    const forbiddenOrg = await request(app.getHttpServer())
      .get(`/api/v1/contacts/${contactId}`)
      .set('Authorization', `Bearer ${owner2.accessToken}`);
    expect(forbiddenOrg.status).toBe(403);

    // Create org_member and verify write endpoint is forbidden.
    const ownerMe = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${owner1.accessToken}`);
    const organizationId = assertString(ownerMe.body.organization.id, 'organizationId');

    const memberRole = await prisma.role.findUnique({
      where: { code: 'org_member' },
      select: { id: true },
    });
    if (!memberRole) throw new Error('org_member role not found');

    const memberEmail = `member-${Math.random().toString(36).slice(2, 10)}@example.com`;
    const memberPassword = 'StrongPassw0rdAA1!';
    const memberHash = await argon2.hash(memberPassword);

    const member = await prisma.user.create({
      data: {
        email: memberEmail,
        firstName: 'Member',
        lastName: 'Only',
        passwordHash: memberHash,
      },
      select: { id: true },
    });
    await prisma.membership.create({
      data: {
        userId: member.id,
        organizationId,
        roleId: memberRole.id,
      },
    });

    const memberLogin = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
      email: memberEmail,
      password: memberPassword,
      organizationSlug: ownerMe.body.organization.slug,
    });
    expect(memberLogin.status).toBe(201);
    const memberToken = assertString(memberLogin.body.accessToken, 'memberToken');

    const deniedWrite = await request(app.getHttpServer())
      .post('/api/v1/contacts')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        firstName: 'Nope',
        phoneNumber: '+15552008000',
      });
    expect(deniedWrite.status).toBe(403);
  });
});
