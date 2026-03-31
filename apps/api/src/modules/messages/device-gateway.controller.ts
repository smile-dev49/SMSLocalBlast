import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { DeviceGatewayPrincipal, MessageOperationResponse } from './types/message.types';
import { DeviceGatewayAuthGuard } from './device-gateway-auth.guard';
import { DeviceGatewayAuthService } from './device-gateway-auth.service';
import {
  DeviceGatewayLoginBodySchema,
  DeviceGatewayPullBodySchema,
  GatewayAckDispatchBodySchema,
  GatewayReportDeliveredBodySchema,
  GatewayReportFailedBodySchema,
  GatewayReportSentBodySchema,
  type DeviceGatewayLoginBody,
  type DeviceGatewayPullBody,
  type GatewayAckDispatchBody,
  type GatewayReportDeliveredBody,
  type GatewayReportFailedBody,
  type GatewayReportSentBody,
} from './dto/device-gateway.dto';
import { MessageIdParamSchema } from './dto/message-id.schema';
import { MessageExecutionService } from './message-execution.service';

@ApiTags('Device Gateway')
@Controller({ path: 'device-gateway', version: '1' })
export class DeviceGatewayController {
  constructor(
    private readonly auth: DeviceGatewayAuthService,
    private readonly execution: MessageExecutionService,
  ) {}

  @Public()
  @Post('auth/login')
  @ApiOperation({ summary: 'Authenticate device gateway and issue gateway token' })
  login(@Body(new ZodValidationPipe(DeviceGatewayLoginBodySchema)) body: DeviceGatewayLoginBody) {
    return this.auth.login(body);
  }

  @Public()
  @UseGuards(DeviceGatewayAuthGuard)
  @Post('dispatch/pull')
  @ApiOperation({ summary: 'Pull next dispatch work for authenticated device' })
  pull(
    @Req() req: { deviceGateway: DeviceGatewayPrincipal },
    @Body(new ZodValidationPipe(DeviceGatewayPullBodySchema)) body: DeviceGatewayPullBody,
  ) {
    return this.execution.pullDispatch(req.deviceGateway, body);
  }

  @Public()
  @UseGuards(DeviceGatewayAuthGuard)
  @Post('messages/:messageId/ack-dispatch')
  ackDispatch(
    @Req() req: { deviceGateway: DeviceGatewayPrincipal },
    @Param('messageId', new ZodValidationPipe(MessageIdParamSchema)) messageId: string,
    @Body(new ZodValidationPipe(GatewayAckDispatchBodySchema)) body: GatewayAckDispatchBody,
  ): Promise<MessageOperationResponse> {
    return this.execution.ackDispatch(req.deviceGateway, messageId, body.idempotencyKey);
  }

  @Public()
  @UseGuards(DeviceGatewayAuthGuard)
  @Post('messages/:messageId/report-sent')
  reportSent(
    @Req() req: { deviceGateway: DeviceGatewayPrincipal },
    @Param('messageId', new ZodValidationPipe(MessageIdParamSchema)) messageId: string,
    @Body(new ZodValidationPipe(GatewayReportSentBodySchema)) body: GatewayReportSentBody,
  ): Promise<MessageOperationResponse> {
    return this.execution.reportSent(req.deviceGateway, messageId, body);
  }

  @Public()
  @UseGuards(DeviceGatewayAuthGuard)
  @Post('messages/:messageId/report-delivered')
  reportDelivered(
    @Req() req: { deviceGateway: DeviceGatewayPrincipal },
    @Param('messageId', new ZodValidationPipe(MessageIdParamSchema)) messageId: string,
    @Body(new ZodValidationPipe(GatewayReportDeliveredBodySchema)) body: GatewayReportDeliveredBody,
  ): Promise<MessageOperationResponse> {
    return this.execution.reportDelivered(req.deviceGateway, messageId, body);
  }

  @Public()
  @UseGuards(DeviceGatewayAuthGuard)
  @Post('messages/:messageId/report-failed')
  reportFailed(
    @Req() req: { deviceGateway: DeviceGatewayPrincipal },
    @Param('messageId', new ZodValidationPipe(MessageIdParamSchema)) messageId: string,
    @Body(new ZodValidationPipe(GatewayReportFailedBodySchema)) body: GatewayReportFailedBody,
  ): Promise<MessageOperationResponse> {
    return this.execution.reportFailed(req.deviceGateway, messageId, body);
  }
}
