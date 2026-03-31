import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MessagesController } from './messages.controller';
import { MessageDeviceSelectionService } from './message-device-selection.service';
import { MessageEventsService } from './message-events.service';
import { MessageExecutionService } from './message-execution.service';
import { MessageQueueService } from './message-queue.service';
import { MessageStateService } from './message-state.service';
import { MessagesService } from './messages.service';
import { MessagesRepository } from './messages.repository';
import { DeviceGatewayController } from './device-gateway.controller';
import { DeviceGatewayAuthService } from './device-gateway-auth.service';
import { DeviceGatewayAuthGuard } from './device-gateway-auth.guard';
import { OperationsController } from './operations.controller';

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
    MessageExecutionService,
    DeviceGatewayAuthService,
    DeviceGatewayAuthGuard,
  ],
  exports: [MessagesService, MessageExecutionService],
})
export class MessagesModule {}
