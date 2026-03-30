import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QUEUE_AUDIT, QUEUE_MESSAGES, QUEUE_SCHEDULES, QUEUE_WEBHOOKS } from './queue.constants';
import { QueueProducerService } from './queue-producer.service';
import { queueWorkerBootstrap } from './queue.worker-registry';

queueWorkerBootstrap();

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        prefix: config.getOrThrow<string>('queue.prefix'),
        connection: {
          url: config.getOrThrow<string>('redis.url'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_MESSAGES },
      { name: QUEUE_SCHEDULES },
      { name: QUEUE_WEBHOOKS },
      { name: QUEUE_AUDIT },
    ),
  ],
  providers: [QueueProducerService],
  exports: [BullModule, QueueProducerService],
})
export class QueueInfrastructureModule {}
