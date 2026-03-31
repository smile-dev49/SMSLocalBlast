import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { CancelMessageBodySchema, type CancelMessageBody } from './dto/cancel-message.dto';
import { ListMessagesQuerySchema, type ListMessagesQuery } from './dto/list-messages.query.dto';
import { MessageIdParamSchema } from './dto/message-id.schema';
import { RetryMessageBodySchema, type RetryMessageBody } from './dto/retry-message.dto';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@Controller({ path: 'messages', version: '1' })
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Permissions('messages.read')
  @Get()
  @ApiOperation({ summary: 'List outbound messages (organization scoped)' })
  listMessages(
    @CurrentUser() user: AuthPrincipal,
    @Query(new ZodValidationPipe(ListMessagesQuerySchema)) query: ListMessagesQuery,
  ) {
    return this.messagesService.listMessages(user, query);
  }

  @Permissions('messages.read')
  @Get(':messageId')
  getMessage(
    @CurrentUser() user: AuthPrincipal,
    @Param('messageId', new ZodValidationPipe(MessageIdParamSchema)) messageId: string,
  ) {
    return this.messagesService.getMessage(user, messageId);
  }

  @Permissions('messages.read')
  @Get(':messageId/events')
  getMessageEvents(
    @CurrentUser() user: AuthPrincipal,
    @Param('messageId', new ZodValidationPipe(MessageIdParamSchema)) messageId: string,
  ) {
    return this.messagesService.getMessageEvents(user, messageId);
  }

  @Permissions('messages.retry')
  @Post(':messageId/retry')
  retryMessage(
    @CurrentUser() user: AuthPrincipal,
    @Param('messageId', new ZodValidationPipe(MessageIdParamSchema)) messageId: string,
    @Body(new ZodValidationPipe(RetryMessageBodySchema)) body: RetryMessageBody,
  ) {
    return this.messagesService.retryMessage(user, messageId, body);
  }

  @Permissions('messages.cancel')
  @Post(':messageId/cancel')
  cancelMessage(
    @CurrentUser() user: AuthPrincipal,
    @Param('messageId', new ZodValidationPipe(MessageIdParamSchema)) messageId: string,
    @Body(new ZodValidationPipe(CancelMessageBodySchema)) body: CancelMessageBody,
  ) {
    return this.messagesService.cancelMessage(user, messageId, body);
  }
}
