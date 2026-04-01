import { Injectable } from '@nestjs/common';
import type { AuditAction, MessageStatus, Prisma } from '@prisma/client';
import { getRequestContext } from '../../infrastructure/request-context/request-context.storage';
import { AppHttpException } from '../../common/exceptions/app-http.exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { MessageEventsService } from './message-events.service';
import {
  MessageAccessDeniedException,
  MessageInvalidStateException,
  MessageNotFoundException,
} from './exceptions/messages.exceptions';
import { MessageDeviceSelectionService } from './message-device-selection.service';
import { MessageQueueService } from './message-queue.service';
import { MessageRetryPolicyService } from './message-retry-policy.service';
import { MessageStateService } from './message-state.service';
import { MessagesRepository } from './messages.repository';
import type { DeviceGatewayPrincipal, MessageOperationResponse } from './types/message.types';
import type {
  DeviceGatewayPullBody,
  GatewayReportDeliveredBody,
  GatewayReportFailedBody,
  GatewayReportSentBody,
} from './dto/device-gateway.dto';
import { BillingAccessService } from '../billing/billing-access.service';
import { QuotaEnforcementService } from '../billing/quota-enforcement.service';
import { UsageCountersService } from '../billing/usage-counters.service';

@Injectable()
export class MessageExecutionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: MessagesRepository,
    private readonly state: MessageStateService,
    private readonly events: MessageEventsService,
    private readonly queue: MessageQueueService,
    private readonly retryPolicy: MessageRetryPolicyService,
    private readonly selectDevice: MessageDeviceSelectionService,
    private readonly audit: AuditLogService,
    private readonly quota: QuotaEnforcementService,
    private readonly usage: UsageCountersService,
    private readonly billingAccess: BillingAccessService,
  ) {}

  private async emitAudit(action: AuditAction, metadata: Record<string, unknown>): Promise<void> {
    const ctx = getRequestContext();
    await this.audit.emit({
      action,
      entityType: 'message',
      metadata,
      ...(ctx?.requestId ? { requestId: ctx.requestId } : {}),
      ...(ctx?.ip ? { ipAddress: ctx.ip } : {}),
      ...(ctx?.userAgent ? { userAgent: ctx.userAgent } : {}),
    });
  }

  async prepareOutboundMessagesForCampaign(
    campaignId: string,
    organizationId: string,
  ): Promise<{
    readonly created: number;
    readonly queued: number;
  }> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, organizationId: true, scheduledAt: true },
    });
    if (!campaign) throw new MessageNotFoundException();
    if (campaign.organizationId !== organizationId) throw new MessageAccessDeniedException();

    const recipients = await this.prisma.campaignRecipient.findMany({
      where: { campaignId, organizationId, status: 'READY' },
      select: {
        id: true,
        contactId: true,
        normalizedPhoneNumber: true,
        renderedBody: true,
        mergeFields: true,
        status: true,
      },
    });

    const existing = await this.prisma.outboundMessage.findMany({
      where: { campaignId, organizationId },
      select: { campaignRecipientId: true },
    });
    const existingRecipientIds = new Set(
      existing.map((e) => e.campaignRecipientId).filter(Boolean),
    );

    let created = 0;
    let queued = 0;
    const monthKey = this.usage.monthKey();
    const sentCounter = await this.prisma.usageCounter.findUnique({
      where: {
        organizationId_code_periodKey: {
          organizationId,
          code: 'messages.sent.month',
          periodKey: monthKey,
        },
      },
      select: { value: true },
    });
    let projectedSent = sentCounter?.value ?? 0;
    for (const recipient of recipients) {
      if (existingRecipientIds.has(recipient.id)) continue;
      await this.quota.assertBelowLimit({
        organizationId,
        entitlementCode: 'messages.monthly.max',
        currentValue: projectedSent,
      });
      const renderedBody =
        recipient.renderedBody ?? (typeof recipient.mergeFields === 'object' ? '' : '');
      if (!renderedBody) continue;
      const row = await this.prisma.outboundMessage.create({
        data: {
          organizationId,
          campaignId,
          campaignRecipientId: recipient.id,
          contactId: recipient.contactId,
          channelType: 'SMS',
          direction: 'OUTBOUND',
          normalizedPhoneNumber: recipient.normalizedPhoneNumber,
          renderedBody,
          status: 'READY',
          scheduledAt: campaign.scheduledAt,
          lastStatusAt: new Date(),
        },
        select: { id: true, campaignId: true, campaignRecipientId: true, deviceId: true },
      });
      created += 1;
      projectedSent += 1;
      await this.queue.enqueueDispatch({
        messageId: row.id,
        organizationId,
        campaignId: row.campaignId,
        campaignRecipientId: row.campaignRecipientId,
        deviceId: row.deviceId,
      });
      queued += 1;
    }
    await this.emitAudit('MESSAGES_GENERATED_FOR_CAMPAIGN', {
      campaignId,
      organizationId,
      created,
      queued,
    });
    await this.repo.refreshCampaignProgressFromMessages(campaignId);
    if (created > 0) {
      await this.quota.incrementUsageCounter(
        organizationId,
        'messages.sent.month',
        monthKey,
        created,
      );
    }
    return { created, queued };
  }

  async transitionMessageStatus(args: {
    readonly messageId: string;
    readonly organizationId: string;
    readonly toStatus: MessageStatus;
    readonly reason?: string;
    readonly metadata?: Record<string, unknown>;
  }): Promise<void> {
    const msg = await this.repo.getMessageById(args.messageId);
    if (!msg) throw new MessageNotFoundException();
    if (msg.organizationId !== args.organizationId) throw new MessageAccessDeniedException();
    this.state.assertTransition(msg.status, args.toStatus);
    await this.repo.updateMessage(args.messageId, {
      status: args.toStatus,
      lastStatusAt: new Date(),
      ...(args.toStatus === 'DISPATCHING' ? { dispatchingAt: new Date() } : {}),
      ...(args.toStatus === 'DISPATCHED' ? { dispatchedAt: new Date() } : {}),
      ...(args.toStatus === 'SENT' ? { sentAt: new Date() } : {}),
      ...(args.toStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      ...(args.toStatus === 'FAILED' ? { failedAt: new Date() } : {}),
      ...(args.toStatus === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
    });
    await this.events.createStatusEvent({
      organizationId: args.organizationId,
      outboundMessageId: args.messageId,
      fromStatus: msg.status,
      toStatus: args.toStatus,
      ...(args.reason !== undefined ? { reason: args.reason } : {}),
      ...(args.metadata !== undefined ? { metadata: args.metadata } : {}),
    });
    if (msg.campaignId) {
      await this.repo.refreshCampaignProgressFromMessages(msg.campaignId);
    }
  }

  async retryMessageManually(
    organizationId: string,
    messageId: string,
    reason?: string,
  ): Promise<{ messageId: string; status: MessageStatus }> {
    const msg = await this.repo.getMessageById(messageId);
    if (!msg) throw new MessageNotFoundException();
    if (msg.organizationId !== organizationId) throw new MessageAccessDeniedException();
    if (!['FAILED', 'CANCELLED'].includes(msg.status)) {
      throw new MessageInvalidStateException('Only failed/cancelled messages are retryable');
    }
    const nextRetry = this.retryPolicy.nextRetryAt(msg.retryCount + 1);
    await this.repo.updateMessage(messageId, {
      status: 'READY',
      retryCount: msg.retryCount + 1,
      nextRetryAt: nextRetry,
      failureReason: null,
      failureCode: null,
      failedAt: null,
      cancelledAt: null,
      lastStatusAt: new Date(),
    });
    await this.events.createStatusEvent({
      organizationId,
      outboundMessageId: messageId,
      fromStatus: msg.status,
      toStatus: 'READY',
      reason: reason ?? 'manual.retry',
      metadata: { retryCount: msg.retryCount + 1, nextRetryAt: nextRetry.toISOString() },
    });
    await this.queue.enqueueDispatch({
      messageId,
      organizationId,
      campaignId: msg.campaignId,
      campaignRecipientId: msg.campaignRecipientId,
      deviceId: msg.deviceId,
    });
    await this.emitAudit('MESSAGE_RETRY_SCHEDULED', { messageId, organizationId });
    return { messageId, status: 'READY' };
  }

  async cancelMessageManually(
    organizationId: string,
    messageId: string,
    reason?: string,
  ): Promise<{ messageId: string; status: MessageStatus }> {
    const msg = await this.repo.getMessageById(messageId);
    if (!msg) throw new MessageNotFoundException();
    if (msg.organizationId !== organizationId) throw new MessageAccessDeniedException();
    if (this.state.isTerminal(msg.status)) {
      throw new MessageInvalidStateException('Message is already terminal');
    }
    await this.transitionMessageStatus({
      messageId,
      organizationId,
      toStatus: 'CANCELLED',
      reason: reason ?? 'manual.cancel',
    });
    await this.emitAudit('MESSAGE_CANCELLED', { messageId, organizationId });
    return { messageId, status: 'CANCELLED' };
  }

  async processQueuedMessage(messageId: string): Promise<void> {
    const msg = await this.repo.getMessageById(messageId);
    if (!msg) return;
    if (msg.status !== 'QUEUED') return;
    try {
      await this.billingAccess.assertOrganizationMayUseOutboundMessaging(msg.organizationId);
    } catch (e: unknown) {
      if (e instanceof AppHttpException) {
        await this.transitionMessageStatus({
          messageId,
          organizationId: msg.organizationId,
          toStatus: 'FAILED',
          reason: 'billing.subscription_inactive',
        });
        await this.repo.updateMessage(messageId, {
          failureCode: 'BILLING_INACTIVE',
          failureReason: 'Subscription cannot send outbound messages',
        });
        return;
      }
      throw e;
    }
    const selection = await this.selectDevice.selectEligibleDevice(msg.organizationId);
    if (!selection.deviceId) {
      const retryCount = msg.retryCount + 1;
      if (
        !this.retryPolicy.shouldRetry({
          category: 'NO_ELIGIBLE_DEVICE',
          retryCount: msg.retryCount,
          maxRetries: msg.maxRetries,
        })
      ) {
        await this.transitionMessageStatus({
          messageId,
          organizationId: msg.organizationId,
          toStatus: 'FAILED',
          reason: selection.reason ?? 'NO_ELIGIBLE_DEVICE',
        });
        await this.repo.updateMessage(messageId, {
          failureCode: 'NO_ELIGIBLE_DEVICE',
          failureReason: selection.reason ?? 'No eligible device',
        });
      } else {
        await this.queue.scheduleRetryWithPolicy({
          messageId,
          organizationId: msg.organizationId,
          reason: selection.reason ?? 'NO_ELIGIBLE_DEVICE',
          retryCount,
        });
      }
      return;
    }

    await this.transitionMessageStatus({
      messageId,
      organizationId: msg.organizationId,
      toStatus: 'DISPATCHING',
      reason: 'worker.claim',
      metadata: { deviceId: selection.deviceId },
    });
    await this.repo.updateMessage(messageId, {
      deviceId: selection.deviceId,
      claimedAt: new Date(),
      claimIdempotencyKey: `claim:${messageId}:${String(Date.now())}`,
    });
    await this.transitionMessageStatus({
      messageId,
      organizationId: msg.organizationId,
      toStatus: 'DISPATCHED',
      reason: 'no-transport.placeholder',
    });
    await this.emitAudit('MESSAGE_DISPATCHED', {
      messageId,
      organizationId: msg.organizationId,
      deviceId: selection.deviceId,
    });
  }

  private async ensureGatewayMessageOwnership(
    principal: DeviceGatewayPrincipal,
    messageId: string,
  ) {
    const msg = await this.repo.getMessageById(messageId);
    if (!msg) throw new MessageNotFoundException();
    if (msg.organizationId !== principal.organizationId) throw new MessageAccessDeniedException();
    if (msg.deviceId && msg.deviceId !== principal.deviceId) {
      throw new MessageAccessDeniedException();
    }
    return msg;
  }

  private async markGatewayReceipt(args: {
    readonly outboundMessageId: string;
    readonly organizationId: string;
    readonly eventType: string;
    readonly idempotencyKey: string;
  }): Promise<boolean> {
    const exists = await this.repo.hasGatewayReceipt({
      outboundMessageId: args.outboundMessageId,
      eventType: args.eventType,
      idempotencyKey: args.idempotencyKey,
    });
    if (exists) return false;
    await this.repo.createGatewayReceipt({
      organizationId: args.organizationId,
      outboundMessageId: args.outboundMessageId,
      eventType: args.eventType,
      idempotencyKey: args.idempotencyKey,
    });
    return true;
  }

  async pullDispatch(principal: DeviceGatewayPrincipal, body: DeviceGatewayPullBody) {
    await this.prisma.device.update({
      where: { id: principal.deviceId },
      data: {
        lastSeenAt: new Date(),
        ...(body.networkType !== undefined ? { lastKnownIp: body.networkType } : {}),
        ...(body.appVersion !== undefined ? { appVersion: body.appVersion } : {}),
        ...(body.capabilities !== undefined
          ? { capabilities: body.capabilities as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });

    const message = await this.prisma.outboundMessage.findFirst({
      where: {
        organizationId: principal.organizationId,
        status: { in: ['QUEUED', 'READY'] },
        OR: [{ deviceId: null }, { deviceId: principal.deviceId }],
      },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        organizationId: true,
        campaignId: true,
        campaignRecipientId: true,
        contactId: true,
        channelType: true,
        normalizedPhoneNumber: true,
        renderedBody: true,
        mediaUrl: true,
        retryCount: true,
      },
    });
    if (!message) {
      return { items: [] as unknown[] };
    }
    await this.prisma.outboundMessage.update({
      where: { id: message.id },
      data: {
        deviceId: principal.deviceId,
        status: 'DISPATCHING',
        claimedAt: new Date(),
        claimIdempotencyKey: `claim:${message.id}:${String(Date.now())}`,
        dispatchingAt: new Date(),
        lastStatusAt: new Date(),
      },
    });
    await this.events.createStatusEvent({
      organizationId: principal.organizationId,
      outboundMessageId: message.id,
      fromStatus: 'QUEUED',
      toStatus: 'DISPATCHING',
      reason: 'gateway.pull.claim',
      metadata: { deviceId: principal.deviceId },
    });
    await this.emitAudit('MESSAGE_CLAIMED_BY_DEVICE', {
      messageId: message.id,
      campaignId: message.campaignId,
      deviceId: principal.deviceId,
    });
    return {
      items: [
        {
          messageId: message.id,
          normalizedPhoneNumber: message.normalizedPhoneNumber,
          renderedBody: message.renderedBody,
          mediaUrl: message.mediaUrl,
          channelType: message.channelType,
          idempotencyKey: `dispatch:${message.id}:${String(message.retryCount + 1)}`,
          attemptNumber: message.retryCount + 1,
          campaignId: message.campaignId,
          contactId: message.contactId,
          metadata: { campaignRecipientId: message.campaignRecipientId },
        },
      ],
    };
  }

  async ackDispatch(
    principal: DeviceGatewayPrincipal,
    messageId: string,
    idempotencyKey: string,
  ): Promise<MessageOperationResponse> {
    const msg = await this.ensureGatewayMessageOwnership(principal, messageId);
    const isNew = await this.markGatewayReceipt({
      outboundMessageId: messageId,
      organizationId: principal.organizationId,
      eventType: 'ack-dispatch',
      idempotencyKey,
    });
    if (isNew && msg.status === 'DISPATCHING') {
      await this.transitionMessageStatus({
        messageId,
        organizationId: principal.organizationId,
        toStatus: 'DISPATCHED',
        reason: 'gateway.ack-dispatch',
      });
    }
    return { messageId, status: 'DISPATCHED' };
  }

  async reportSent(
    principal: DeviceGatewayPrincipal,
    messageId: string,
    body: GatewayReportSentBody,
  ): Promise<MessageOperationResponse> {
    const msg = await this.ensureGatewayMessageOwnership(principal, messageId);
    const isNew = await this.markGatewayReceipt({
      outboundMessageId: messageId,
      organizationId: principal.organizationId,
      eventType: 'report-sent',
      idempotencyKey: body.idempotencyKey,
    });
    if (isNew && msg.status !== 'SENT' && msg.status !== 'DELIVERED') {
      await this.transitionMessageStatus({
        messageId,
        organizationId: principal.organizationId,
        toStatus: 'SENT',
        reason: 'gateway.report-sent',
      });
      await this.repo.updateMessage(messageId, {
        providerReference: body.providerReference ?? null,
      });
      await this.emitAudit('MESSAGE_SENT_REPORTED', {
        messageId,
        deviceId: principal.deviceId,
      });
    }
    return { messageId, status: 'SENT' };
  }

  async reportDelivered(
    principal: DeviceGatewayPrincipal,
    messageId: string,
    body: GatewayReportDeliveredBody,
  ): Promise<MessageOperationResponse> {
    const msg = await this.ensureGatewayMessageOwnership(principal, messageId);
    const isNew = await this.markGatewayReceipt({
      outboundMessageId: messageId,
      organizationId: principal.organizationId,
      eventType: 'report-delivered',
      idempotencyKey: body.idempotencyKey,
    });
    if (isNew && msg.status !== 'DELIVERED') {
      const from = msg.status === 'SENT' ? msg.status : 'SENT';
      if (from !== msg.status) {
        await this.repo.updateMessage(messageId, { status: 'SENT', sentAt: new Date() });
      }
      await this.transitionMessageStatus({
        messageId,
        organizationId: principal.organizationId,
        toStatus: 'DELIVERED',
        reason: 'gateway.report-delivered',
      });
      await this.emitAudit('MESSAGE_DELIVERED_REPORTED', {
        messageId,
        deviceId: principal.deviceId,
      });
    }
    return { messageId, status: 'DELIVERED' };
  }

  async reportFailed(
    principal: DeviceGatewayPrincipal,
    messageId: string,
    body: GatewayReportFailedBody,
  ): Promise<MessageOperationResponse> {
    const msg = await this.ensureGatewayMessageOwnership(principal, messageId);
    const isNew = await this.markGatewayReceipt({
      outboundMessageId: messageId,
      organizationId: principal.organizationId,
      eventType: 'report-failed',
      idempotencyKey: body.idempotencyKey,
    });
    if (!isNew) return { messageId, status: msg.status };
    const retryable =
      body.retryable ??
      !['INVALID_RECIPIENT', 'BLOCKED_CONTACT', 'OPTED_OUT_CONTACT'].includes(body.failureCode);
    if (
      retryable &&
      this.retryPolicy.shouldRetry({
        category: 'TRANSPORT_TEMPORARY',
        retryCount: msg.retryCount,
        maxRetries: msg.maxRetries,
      })
    ) {
      const retryCount = msg.retryCount + 1;
      const nextRetryAt = this.retryPolicy.nextRetryAt(retryCount);
      await this.repo.updateMessage(messageId, {
        status: 'FAILED',
        failureCode: body.failureCode,
        failureReason: body.failureReason ?? null,
        retryCount,
        nextRetryAt,
        failedAt: new Date(),
      });
      await this.events.createStatusEvent({
        organizationId: principal.organizationId,
        outboundMessageId: messageId,
        fromStatus: msg.status,
        toStatus: 'FAILED',
        reason: body.failureCode,
        metadata: { retryCount, nextRetryAt: nextRetryAt.toISOString() },
      });
      await this.emitAudit('MESSAGE_FAILED_REPORTED', {
        messageId,
        failureCode: body.failureCode,
        retryCount,
      });
      return { messageId, status: 'FAILED' };
    }
    await this.transitionMessageStatus({
      messageId,
      organizationId: principal.organizationId,
      toStatus: 'FAILED',
      reason: body.failureCode,
    });
    await this.repo.updateMessage(messageId, {
      failureCode: body.failureCode,
      failureReason: body.failureReason ?? null,
    });
    await this.emitAudit('MESSAGE_FAILED', {
      messageId,
      failureCode: body.failureCode,
      retryCount: msg.retryCount,
    });
    return { messageId, status: 'FAILED' };
  }
}
