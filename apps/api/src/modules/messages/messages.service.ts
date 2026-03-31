import { Injectable } from '@nestjs/common';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { MembershipInactiveException } from '../auth/exceptions/auth.exceptions';
import type { CancelMessageBody } from './dto/cancel-message.dto';
import type { ListMessagesQuery } from './dto/list-messages.query.dto';
import type { RetryMessageBody } from './dto/retry-message.dto';
import type {
  MessageDetailResponse,
  MessageEventsResponse,
  MessageListResponse,
  MessageOperationResponse,
} from './types/message.types';
import { MessageExecutionService } from './message-execution.service';
import { MessagesRepository } from './messages.repository';

@Injectable()
export class MessagesService {
  constructor(
    private readonly repo: MessagesRepository,
    private readonly execution: MessageExecutionService,
  ) {}

  private orgId(principal: AuthPrincipal): string {
    if (!principal.organizationId) throw new MembershipInactiveException();
    return principal.organizationId;
  }

  listMessages(principal: AuthPrincipal, query: ListMessagesQuery): Promise<MessageListResponse> {
    return this.repo.listMessagesForOrg(this.orgId(principal), query);
  }

  getMessage(principal: AuthPrincipal, messageId: string): Promise<MessageDetailResponse> {
    return this.repo.getMessageDetailForOrg(this.orgId(principal), messageId);
  }

  getMessageEvents(principal: AuthPrincipal, messageId: string): Promise<MessageEventsResponse> {
    return this.repo.getMessageEventsForOrg(this.orgId(principal), messageId);
  }

  retryMessage(
    principal: AuthPrincipal,
    messageId: string,
    body: RetryMessageBody,
  ): Promise<MessageOperationResponse> {
    return this.execution.retryMessageManually(this.orgId(principal), messageId, body.reason);
  }

  cancelMessage(
    principal: AuthPrincipal,
    messageId: string,
    body: CancelMessageBody,
  ): Promise<MessageOperationResponse> {
    return this.execution.cancelMessageManually(this.orgId(principal), messageId, body.reason);
  }
}
