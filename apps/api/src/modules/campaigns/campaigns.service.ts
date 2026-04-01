import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type AuditAction,
  type CampaignRecipientStatus,
  type CampaignStatus,
} from '@prisma/client';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { createPaginatedResponse } from '../../common/utils/pagination';
import { getRequestContext } from '../../infrastructure/request-context/request-context.storage';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { MembershipInactiveException } from '../auth/exceptions/auth.exceptions';
import { CampaignPreviewService } from './campaign-preview.service';
import { CampaignRecipientsService } from './campaign-recipients.service';
import { CampaignSchedulerService } from './campaign-scheduler.service';
import { CampaignStateService } from './campaign-state.service';
import { MessageExecutionService } from '../messages/message-execution.service';
import type { CampaignPreviewBody } from './dto/campaign-preview.dto';
import type { CampaignScheduleBody } from './dto/campaign-schedule.dto';
import type { CreateCampaignBody } from './dto/create-campaign.dto';
import type { ListCampaignsQuery } from './dto/list-campaigns.query.dto';
import type { UpdateCampaignBody } from './dto/update-campaign.dto';
import {
  CampaignAccessDeniedException,
  CampaignNotFoundException,
  CampaignValidationException,
} from './exceptions/campaigns.exceptions';
import type {
  CampaignResponse,
  CampaignSummaryResponse,
  CampaignTargetPersisted,
} from './types/campaign.types';
import { CampaignsRepository, type CampaignRow } from './campaigns.repository';
import { parsePersistedTarget, toPersistedTargetJson } from './utils/campaign-target.util';
import { BillingAccessService } from '../billing/billing-access.service';
import { QuotaEnforcementService } from '../billing/quota-enforcement.service';

function parseStrategy(s: string): 'strict' | 'empty' {
  return s === 'strict' ? 'strict' : 'empty';
}

@Injectable()
export class CampaignsService {
  constructor(
    private readonly repo: CampaignsRepository,
    private readonly state: CampaignStateService,
    private readonly scheduler: CampaignSchedulerService,
    private readonly recipients: CampaignRecipientsService,
    private readonly previewService: CampaignPreviewService,
    private readonly messageExecution: MessageExecutionService,
    private readonly audit: AuditLogService,
    private readonly quota: QuotaEnforcementService,
    private readonly billingAccess: BillingAccessService,
  ) {}

  private orgId(principal: AuthPrincipal): string {
    if (!principal.organizationId) throw new MembershipInactiveException();
    return principal.organizationId;
  }

  private async emitAudit(args: {
    readonly action: AuditAction;
    readonly principal: AuthPrincipal;
    readonly entityId?: string;
    readonly metadata?: Record<string, unknown>;
  }): Promise<void> {
    const ctx = getRequestContext();
    await this.audit.emit({
      action: args.action,
      entityType: 'campaign',
      ...(args.entityId ? { entityId: args.entityId } : {}),
      ...(args.principal.organizationId ? { organizationId: args.principal.organizationId } : {}),
      actorUserId: args.principal.userId,
      ...(args.metadata ? { metadata: args.metadata } : {}),
      ...(ctx?.requestId ? { requestId: ctx.requestId } : {}),
      ...(ctx?.ip ? { ipAddress: ctx.ip } : {}),
      ...(ctx?.userAgent ? { userAgent: ctx.userAgent } : {}),
    });
  }

  private async getOwnedCampaignRow(
    principal: AuthPrincipal,
    campaignId: string,
  ): Promise<CampaignRow> {
    const organizationId = this.orgId(principal);
    const row = await this.repo.findById(campaignId);
    if (!row) throw new CampaignNotFoundException();
    if (row.deletedAt !== null) throw new CampaignNotFoundException();
    if (row.organizationId !== organizationId) throw new CampaignAccessDeniedException();
    return row;
  }

  private async mapCampaign(row: CampaignRow): Promise<CampaignResponse> {
    const template = row.templateId ? await this.repo.findTemplateSummary(row.templateId) : null;
    const target = parsePersistedTarget(row.target);
    return {
      id: row.id,
      organizationId: row.organizationId,
      createdByUserId: row.createdByUserId,
      name: row.name,
      description: row.description,
      status: row.status,
      templateId: row.templateId,
      template:
        template && row.templateId
          ? {
              id: template.id,
              name: template.name,
              channelType: template.channelType,
            }
          : null,
      scheduledAt: row.scheduledAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      cancelledAt: row.cancelledAt,
      pausedAt: row.pausedAt,
      failureReason: row.failureReason,
      timezone: row.timezone,
      metadata: row.metadata,
      target,
      missingVariableStrategy: parseStrategy(row.missingVariableStrategy),
      recipientCount: row.recipientCount,
      readyCount: row.readyCount,
      sentCount: row.sentCount,
      deliveredCount: row.deliveredCount,
      failedCount: row.failedCount,
      skippedCount: row.skippedCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private canRebuildRecipients(status: CampaignRow['status']): boolean {
    return status === 'DRAFT' || status === 'SCHEDULED' || status === 'PAUSED';
  }

  async createCampaign(
    principal: AuthPrincipal,
    body: CreateCampaignBody,
  ): Promise<CampaignResponse> {
    const organizationId = this.orgId(principal);
    const activeCampaigns = await this.repo.count({
      organizationId,
      deletedAt: null,
      status: { in: ['DRAFT', 'SCHEDULED', 'PROCESSING', 'PAUSED'] },
    });
    await this.quota.assertBelowLimit({
      organizationId,
      entitlementCode: 'campaigns.active.max',
      currentValue: activeCampaigns,
    });
    const strategy = body.snapshotMissingVariableStrategy ?? 'empty';
    const target: CampaignTargetPersisted = {
      contactIds: body.target.contactIds,
      contactListIds: body.target.contactListIds,
    };

    let status: CampaignStatus = 'DRAFT';
    let scheduledAt: Date | null = null;
    if (body.scheduledAt) {
      scheduledAt = new Date(body.scheduledAt);
      this.scheduler.assertScheduledAtInFuture(scheduledAt);
      status = 'SCHEDULED';
    }

    const row = await this.repo.create({
      organizationId,
      createdByUserId: principal.userId,
      name: body.name,
      ...(body.description !== undefined ? { description: body.description } : {}),
      status,
      ...(body.templateId !== undefined ? { templateId: body.templateId } : {}),
      scheduledAt,
      ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
      ...(body.metadata !== undefined
        ? { metadata: body.metadata as unknown as Prisma.InputJsonValue }
        : {}),
      target: toPersistedTargetJson(target),
      missingVariableStrategy: strategy,
    });

    await this.recipients.replaceRecipientsTransaction({
      organizationId,
      campaignId: row.id,
      contactIds: target.contactIds,
      contactListIds: target.contactListIds,
      templateId: row.templateId,
      strategy,
      principal,
    });

    const fresh = await this.repo.findById(row.id);
    if (!fresh) throw new CampaignNotFoundException();

    await this.emitAudit({
      action: 'CAMPAIGN_CREATED',
      principal,
      entityId: row.id,
      metadata: {
        templateId: row.templateId,
        recipientCount: fresh.recipientCount,
        status: fresh.status,
      },
    });
    await this.emitAudit({
      action: 'CAMPAIGN_RECIPIENTS_PREPARED',
      principal,
      entityId: row.id,
      metadata: {
        recipientCount: fresh.recipientCount,
        readyCount: fresh.readyCount,
        skippedCount: fresh.skippedCount,
      },
    });
    await this.messageExecution.prepareOutboundMessagesForCampaign(row.id, row.organizationId);

    return this.mapCampaign(fresh);
  }

  async listCampaigns(principal: AuthPrincipal, query: ListCampaignsQuery) {
    const organizationId = this.orgId(principal);
    const where: Prisma.CampaignWhereInput = {
      organizationId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.templateId ? { templateId: query.templateId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.scheduledFrom || query.scheduledTo
        ? {
            scheduledAt: {
              ...(query.scheduledFrom ? { gte: new Date(query.scheduledFrom) } : {}),
              ...(query.scheduledTo ? { lte: new Date(query.scheduledTo) } : {}),
            },
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const orderBy = { [query.sortBy]: query.sortOrder } as Prisma.CampaignOrderByWithRelationInput;
    const [total, rows] = await Promise.all([
      this.repo.count(where),
      this.repo.list({ where, skip, take: query.limit, orderBy }),
    ]);

    const items = await Promise.all(rows.map((r) => this.mapCampaign(r)));
    return createPaginatedResponse({
      items,
      page: query.page,
      limit: query.limit,
      total,
    });
  }

  async getCampaign(principal: AuthPrincipal, campaignId: string): Promise<CampaignResponse> {
    const row = await this.getOwnedCampaignRow(principal, campaignId);
    return this.mapCampaign(row);
  }

  async getCampaignSummary(
    principal: AuthPrincipal,
    campaignId: string,
  ): Promise<CampaignSummaryResponse> {
    const row = await this.getOwnedCampaignRow(principal, campaignId);
    const [byStatus, skipGroups] = await Promise.all([
      this.repo.countRecipientsByStatus(campaignId),
      this.repo.countSkipReasons(campaignId),
    ]);
    const recipientCountsByStatus: Partial<Record<CampaignRecipientStatus, number>> = {};
    for (const g of byStatus) {
      recipientCountsByStatus[g.status] = g._count._all;
    }
    const skipReasons: Record<string, number> = {};
    for (const g of skipGroups) {
      const key = g.skipReason ?? 'UNKNOWN';
      skipReasons[key] = g._count._all;
    }
    return {
      campaign: await this.mapCampaign(row),
      recipientCountsByStatus,
      skipReasons,
    };
  }

  async getCampaignEvents(principal: AuthPrincipal, campaignId: string) {
    await this.getOwnedCampaignRow(principal, campaignId);
    return this.repo.getCampaignEvents(campaignId);
  }

  async updateCampaign(
    principal: AuthPrincipal,
    campaignId: string,
    body: UpdateCampaignBody,
  ): Promise<CampaignResponse> {
    const existing = await this.getOwnedCampaignRow(principal, campaignId);

    const organizationId = this.orgId(principal);
    const targetPatch = body.target
      ? {
          contactIds: body.target.contactIds,
          contactListIds: body.target.contactListIds,
        }
      : null;

    if (targetPatch) {
      if (targetPatch.contactIds.length === 0 && targetPatch.contactListIds.length === 0) {
        throw new CampaignValidationException(
          'target must include at least one contactId or contactListId',
        );
      }
      if (!this.canRebuildRecipients(existing.status)) {
        throw new CampaignValidationException(
          'Cannot change recipients while campaign is processing',
        );
      }
    }

    let nextStrategy = parseStrategy(existing.missingVariableStrategy);
    if (body.snapshotMissingVariableStrategy) {
      nextStrategy = body.snapshotMissingVariableStrategy;
    }

    const data: Prisma.CampaignUpdateInput = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.templateId !== undefined ? { templateId: body.templateId } : {}),
      ...(body.scheduledAt !== undefined
        ? { scheduledAt: body.scheduledAt === null ? null : new Date(body.scheduledAt) }
        : {}),
      ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
      ...(body.metadata !== undefined
        ? {
            metadata:
              body.metadata === null
                ? Prisma.JsonNull
                : (body.metadata as unknown as Prisma.InputJsonValue),
          }
        : {}),
      ...(body.snapshotMissingVariableStrategy !== undefined
        ? { missingVariableStrategy: body.snapshotMissingVariableStrategy }
        : {}),
      ...(targetPatch ? { target: toPersistedTargetJson(targetPatch) } : {}),
    };

    const row = await this.repo.update(campaignId, data);
    const templateId = row.templateId;
    const target = parsePersistedTarget(row.target);

    const shouldRebuild =
      Boolean(targetPatch) ||
      body.templateId !== undefined ||
      body.snapshotMissingVariableStrategy !== undefined;

    if (shouldRebuild && this.canRebuildRecipients(row.status)) {
      await this.recipients.replaceRecipientsTransaction({
        organizationId,
        campaignId,
        contactIds: target.contactIds,
        contactListIds: target.contactListIds,
        templateId,
        strategy: nextStrategy,
        principal,
      });
    }

    const fresh = await this.repo.findById(campaignId);
    if (!fresh) throw new CampaignNotFoundException();

    await this.emitAudit({
      action: 'CAMPAIGN_UPDATED',
      principal,
      entityId: campaignId,
      metadata: { updatedFields: Object.keys(body) },
    });
    if (shouldRebuild && this.canRebuildRecipients(row.status)) {
      await this.emitAudit({
        action: 'CAMPAIGN_RECIPIENTS_PREPARED',
        principal,
        entityId: campaignId,
        metadata: {
          recipientCount: fresh.recipientCount,
          readyCount: fresh.readyCount,
          skippedCount: fresh.skippedCount,
        },
      });
    }

    return this.mapCampaign(fresh);
  }

  async deleteCampaign(principal: AuthPrincipal, campaignId: string): Promise<void> {
    await this.getOwnedCampaignRow(principal, campaignId);
    await this.repo.update(campaignId, { deletedAt: new Date() });
    await this.emitAudit({
      action: 'CAMPAIGN_DELETED',
      principal,
      entityId: campaignId,
    });
  }

  async preview(principal: AuthPrincipal, body: CampaignPreviewBody) {
    const result = await this.previewService.preview(principal, body);
    await this.emitAudit({
      action: 'CAMPAIGN_PREVIEWED',
      principal,
      metadata: {
        totalUniqueRecipients: result.totalUniqueRecipients,
        sendableRecipients: result.sendableRecipients,
        skippedRecipients: result.skippedRecipients,
        templateId: body.templateId,
      },
    });
    return result;
  }

  async scheduleCampaign(
    principal: AuthPrincipal,
    campaignId: string,
    body: CampaignScheduleBody,
  ): Promise<CampaignResponse> {
    const existing = await this.getOwnedCampaignRow(principal, campaignId);
    this.state.assertScheduleAllowed(existing.status);
    const scheduledAt = new Date(body.scheduledAt);
    this.scheduler.assertScheduledAtInFuture(scheduledAt);

    const next = this.state.nextStatusSchedule();
    const row = await this.repo.update(campaignId, {
      status: next,
      scheduledAt,
      ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
      pausedAt: null,
    });

    await this.emitAudit({
      action: 'CAMPAIGN_SCHEDULED',
      principal,
      entityId: campaignId,
      metadata: { scheduledAt: scheduledAt.toISOString(), timezone: body.timezone },
    });

    return this.mapCampaign(row);
  }

  async startCampaign(principal: AuthPrincipal, campaignId: string): Promise<CampaignResponse> {
    const existing = await this.getOwnedCampaignRow(principal, campaignId);
    this.state.assertStartAllowed(existing.status);

    await this.billingAccess.assertOrganizationMayUseOutboundMessaging(this.orgId(principal));

    const next = this.state.nextStatusStart();
    const row = await this.repo.update(campaignId, {
      status: next,
      startedAt: new Date(),
      pausedAt: null,
    });

    const target = parsePersistedTarget(row.target);
    const strategy = parseStrategy(row.missingVariableStrategy);
    await this.recipients.replaceRecipientsTransaction({
      organizationId: row.organizationId,
      campaignId,
      contactIds: target.contactIds,
      contactListIds: target.contactListIds,
      templateId: row.templateId,
      strategy,
      principal,
    });

    const fresh = await this.repo.findById(campaignId);
    if (!fresh) throw new CampaignNotFoundException();

    await this.emitAudit({
      action: 'CAMPAIGN_STARTED',
      principal,
      entityId: campaignId,
      metadata: { recipientCount: fresh.recipientCount, readyCount: fresh.readyCount },
    });
    await this.emitAudit({
      action: 'CAMPAIGN_RECIPIENTS_PREPARED',
      principal,
      entityId: campaignId,
      metadata: {
        recipientCount: fresh.recipientCount,
        readyCount: fresh.readyCount,
        skippedCount: fresh.skippedCount,
      },
    });

    return this.mapCampaign(fresh);
  }

  async pauseCampaign(principal: AuthPrincipal, campaignId: string): Promise<CampaignResponse> {
    const existing = await this.getOwnedCampaignRow(principal, campaignId);
    this.state.assertPauseAllowed(existing.status);
    const row = await this.repo.update(campaignId, {
      status: this.state.nextStatusPause(),
      pausedAt: new Date(),
    });

    await this.emitAudit({
      action: 'CAMPAIGN_PAUSED',
      principal,
      entityId: campaignId,
    });

    return this.mapCampaign(row);
  }

  async cancelCampaign(principal: AuthPrincipal, campaignId: string): Promise<CampaignResponse> {
    const existing = await this.getOwnedCampaignRow(principal, campaignId);
    this.state.assertCancelAllowed(existing.status);

    await this.repo.update(campaignId, {
      status: this.state.nextStatusCancel(),
      cancelledAt: new Date(),
    });
    await this.repo.cancelOutstandingRecipients(campaignId);
    await this.repo.refreshRecipientAggregates(campaignId);

    const fresh = await this.repo.findById(campaignId);
    if (!fresh) throw new CampaignNotFoundException();

    await this.emitAudit({
      action: 'CAMPAIGN_CANCELLED',
      principal,
      entityId: campaignId,
      metadata: { priorStatus: existing.status },
    });

    return this.mapCampaign(fresh);
  }
}
