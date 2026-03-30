import 'reflect-metadata';
import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureHttpApplication } from './bootstrap/http-application';

function isNestExpressApp(app: INestApplication): app is NestExpressApplication {
  return typeof (app as NestExpressApplication).getHttpAdapter === 'function';
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  app.useLogger(app.get(Logger));

  if (!isNestExpressApp(app)) {
    throw new Error('Expected Express adapter');
  }

  const config = app.get(ConfigService);
  configureHttpApplication(app, config);

  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('port');
  await app.listen(port);
}

void bootstrap();
