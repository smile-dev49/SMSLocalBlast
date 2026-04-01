import { VersioningType } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
// Compression is CommonJS; default ESM interop breaks under ts-jest.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CJS default export
import compression = require('compression');
import { json, raw, urlencoded } from 'express';
import helmet from 'helmet';

/**
 * Applies production HTTP middleware + routing conventions shared by `main` and e2e harnesses.
 */
export function configureHttpApplication(app: NestExpressApplication, config: ConfigService): void {
  const trustProxy = config.getOrThrow<boolean>('app.trustProxy');
  const bodyLimit = config.getOrThrow<string>('app.bodyLimit');

  app
    .getHttpAdapter()
    .getInstance()
    .set('trust proxy', trustProxy ? 1 : false);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use('/api/v1/billing/webhooks/stripe', raw({ type: 'application/json' }));
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit }));

  const corsOrigins = config.getOrThrow<string[]>('cors.origins');
  const allowAll = corsOrigins.includes('*');
  app.enableCors({
    origin: allowAll ? true : corsOrigins,
    credentials: !allowAll,
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const apiPrefix = config.getOrThrow<string>('app.apiPrefix');
  app.setGlobalPrefix(apiPrefix);

  if (config.get<boolean>('swagger.enabled')) {
    const swagger = new DocumentBuilder()
      .setTitle(config.getOrThrow<string>('app.name'))
      .setDescription('SMS LocalBlast HTTP API')
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addTag('Health')
      .addTag('Auth')
      .addTag('Organizations')
      .addTag('Users')
      .addTag('Roles')
      .addTag('Sessions')
      .addTag('Devices')
      .addTag('Contacts')
      .addTag('Templates')
      .addTag('Campaigns')
      .addTag('Messages')
      .addTag('Schedules')
      .addTag('Billing')
      .addTag('Webhooks')
      .addTag('API Tokens')
      .addTag('Audit Logs')
      .addTag('Admin')
      .build();
    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
  }
}
