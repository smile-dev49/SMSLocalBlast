import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { parseNodeEnv } from '@sms-localblast/validation';

async function bootstrap(): Promise<void> {
  const nodeEnv = parseNodeEnv(process.env['NODE_ENV']);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const port = Number(process.env['PORT'] ?? 3000);
  await app.listen(port);
  const url = await app.getUrl();
  Logger.log(`Listening on ${url} (${nodeEnv})`, 'Bootstrap');
}

void bootstrap();
