import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { configureHttpApplication } from '../src/bootstrap/http-application';
import { REDIS_CLIENT } from '../src/infrastructure/redis/redis.tokens';
import { StripeService } from '../src/modules/billing/stripe.service';

function isNestExpressApp(app: INestApplication): app is NestExpressApplication {
  return typeof (app as NestExpressApplication).getHttpAdapter === 'function';
}

describe('Billing (e2e)', () => {
  let app: NestExpressApplication;

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
    configureHttpApplication(app, app.get(ConfigService));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns plans and billing/me for authenticated user', async () => {
    const suffix = Math.random().toString(36).slice(2, 10);
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        organizationName: `Billing Org ${suffix}`,
        organizationSlug: `billing-org-${suffix}`,
        firstName: 'Owner',
        lastName: suffix,
        email: `billing-owner-${suffix}@example.com`,
        password: 'StrongPassw0rdAA1!',
      });
    expect(registered.status).toBe(201);
    const token = registered.body.accessToken as string;

    const plans = await request(app.getHttpServer())
      .get('/api/v1/billing/plans')
      .set('Authorization', `Bearer ${token}`);
    expect(plans.status).toBe(200);
    expect(Array.isArray(plans.body)).toBe(true);

    const me = await request(app.getHttpServer())
      .get('/api/v1/billing/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body).toHaveProperty('entitlements');
  });
});

describe('Billing checkout / portal (e2e, mocked Stripe)', () => {
  let app: NestExpressApplication;
  const checkoutCreate = jest.fn().mockResolvedValue({
    id: 'cs_test_1',
    url: 'https://stripe.test/checkout/cs_test_1',
  });
  const portalCreate = jest.fn().mockResolvedValue({
    url: 'https://stripe.test/portal/sess_1',
  });
  const customerCreate = jest.fn().mockImplementation(() => ({
    id: `cus_test_${Math.random().toString(36).slice(2, 12)}`,
  }));

  beforeAll(async () => {
    const stripeStub = {
      client: {
        checkout: { sessions: { create: checkoutCreate } },
        billingPortal: { sessions: { create: portalCreate } },
        customers: { create: customerCreate },
      },
      webhookSecret: 'whsec_test_secret',
      successUrl: 'http://localhost:3001/billing?checkout=success',
      cancelUrl: 'http://localhost:3001/billing?checkout=cancel',
      billingPortalReturnUrl: 'http://localhost:3001/billing',
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(REDIS_CLIENT)
      .useValue({
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn().mockResolvedValue('OK'),
      })
      .overrideProvider(StripeService)
      .useValue(stripeStub)
      .compile();

    const raw = moduleFixture.createNestApplication({ bodyParser: false });
    if (!isNestExpressApp(raw)) throw new Error('Expected express app');
    app = raw;
    configureHttpApplication(app, app.get(ConfigService));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates checkout and portal sessions without calling real Stripe', async () => {
    const suffix99 = Math.random().toString(36).slice(2, 10);
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        organizationName: `Billing Mock Org ${suffix99}`,
        organizationSlug: `billing-mock-${suffix99}`,
        firstName: 'Owner',
        lastName: suffix99,
        email: `billing-mock-${suffix99}@example.com`,
        password: 'StrongPassw0rdAA1!',
      });
    expect(registered.status).toBe(201);
    const token = registered.body.accessToken as string;

    const checkout = await request(app.getHttpServer())
      .post('/api/v1/billing/checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ priceId: 'price_test_mock' });
    expect(checkout.status).toBe(201);
    expect(checkout.body.sessionId).toBe('cs_test_1');
    expect(checkout.body.url).toContain('stripe.test');

    const portal = await request(app.getHttpServer())
      .post('/api/v1/billing/portal-session')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(portal.status).toBe(201);
    expect(portal.body.url).toContain('stripe.test');

    expect(checkoutCreate).toHaveBeenCalled();
    expect(customerCreate).toHaveBeenCalled();
    expect(portalCreate).toHaveBeenCalled();
  });
});
