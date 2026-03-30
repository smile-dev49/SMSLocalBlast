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

describe('Health (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: jest.fn().mockResolvedValue(1),
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
    const config = app.get(ConfigService);
    configureHttpApplication(app, config);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health/live returns alive', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'alive' });
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  it('GET /api/v1/health/ready returns ready when checks pass', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ready',
    });
    expect(Array.isArray(res.body.checks)).toBe(true);
    expect(res.body.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'database', status: 'up' }),
        expect.objectContaining({ name: 'redis', status: 'up' }),
      ]),
    );
  });
});
