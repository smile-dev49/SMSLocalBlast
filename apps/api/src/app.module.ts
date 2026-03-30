import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { validateConfiguration } from './common/config/config.validation';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AccessPlaceholderGuard } from './common/guards/access-placeholder.guard';
import { HealthInfrastructureModule } from './infrastructure/health/health.module';
import { PrismaInfrastructureModule } from './infrastructure/prisma/prisma.module';
import { QueueInfrastructureModule } from './infrastructure/queue/queue.module';
import { RedisInfrastructureModule } from './infrastructure/redis/redis.module';
import { RequestContextModule } from './infrastructure/request-context/request-context.module';
import { AdminModule } from './modules/admin/admin.module';
import { ApiTokensModule } from './modules/api-tokens/api-tokens.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { DevicesModule } from './modules/devices/devices.module';
import { MessagesModule } from './modules/messages/messages.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { RolesModule } from './modules/roles/roles.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { UsersModule } from './modules/users/users.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

const queueInfrastructureEnabled = process.env['QUEUES_ENABLED'] !== 'false';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfiguration,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<string>('nodeEnv') === 'production';
        const logLevel = config.getOrThrow<string>('log.level');
        return {
          pinoHttp: {
            level: logLevel,
            transport: isProd
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: { singleLine: true, colorize: true },
                },
            autoLogging: true,
          },
        };
      },
    }),
    RequestContextModule,
    PrismaInfrastructureModule,
    RedisInfrastructureModule,
    ...(queueInfrastructureEnabled ? [QueueInfrastructureModule] : []),
    AuditLogsModule,
    HealthInfrastructureModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    RolesModule,
    SessionsModule,
    DevicesModule,
    ContactsModule,
    TemplatesModule,
    CampaignsModule,
    MessagesModule,
    SchedulesModule,
    BillingModule,
    WebhooksModule,
    ApiTokensModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AccessPlaceholderGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
