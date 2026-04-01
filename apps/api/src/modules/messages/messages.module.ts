import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesController } from './messages.controller';
import { MessageDeadLetterService } from './message-dead-letter.service';
import { MessageDeviceSelectionService } from './message-device-selection.service';
import { MessageEventsService } from './message-events.service';
import { MessageExecutionService } from './message-execution.service';
import { MessageQueueMetricsService } from './message-queue-metrics.service';
import { MessageQueueService } from './message-queue.service';
import { MessageRecoveryService } from './message-recovery.service';
import { MessageRetryPolicyService } from './message-retry-policy.service';
import { MessageStateService } from './message-state.service';
import { MessageWorkerProcessor } from './message-worker.processor';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { DeviceGatewayController } from './device-gateway.controller';
import { DeviceGatewayAuthService } from './device-gateway-auth.service';
import { DeviceGatewayAuthGuard } from './device-gateway-auth.guard';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

const queueEnabled = process.env['QUEUES_ENABLED'] !== 'false';

@Module({
  imports: [JwtModule],
  controllers: [MessagesController, DeviceGatewayController, OperationsController],
  providers: [
    MessagesService,
    MessagesRepository,
    MessageStateService,
    MessageEventsService,
    MessageDeviceSelectionService,
    MessageQueueService,
    MessageRetryPolicyService,
    MessageRecoveryService,
    OperationsService,
    MessageExecutionService,
    ...(queueEnabled
      ? [MessageDeadLetterService, MessageQueueMetricsService, MessageWorkerProcessor]
      : []),
    DeviceGatewayAuthService,
    DeviceGatewayAuthGuard,
  ],
  exports: [MessagesService, MessageExecutionService],
})
export class MessagesModule {}
