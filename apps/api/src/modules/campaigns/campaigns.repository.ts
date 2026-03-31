import { Injectable } from '@nestjs/common';
import type { CampaignRecipientStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export const campaignSelect = {
  id: true,
  organizationId: true,
  createdByUserId: true,
  name: true,
  description: true,
  status: true,
  templateId: true,
  scheduledAt: true,
  startedAt: true,
  completedAt: true,
  cancelledAt: true,
  pausedAt: true,
  failureReason: true,
  timezone: true,
  metadata: true,
  target: true,
  missingVariableStrategy: true,
  recipientCount: true,
  readyCount: true,
  sentCount: true,
  deliveredCount: true,
  failedCount: true,
  skippedCount: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.CampaignSelect;

export type CampaignRow = Prisma.CampaignGetPayload<{ select: typeof campaignSelect }>;

const templateSummarySelect = {
  id: true,
  name: true,
  channelType: true,
} satisfies Prisma.TemplateSelect;

@Injectable()
export class CampaignsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.CampaignUncheckedCreateInput): Promise<CampaignRow> {
    return this.prisma.campaign.create({ data, select: campaignSelect });
  }

  findById(campaignId: string): Promise<CampaignRow | null> {
    return this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: campaignSelect,
    });
  }

  update(campaignId: string, data: Prisma.CampaignUpdateInput): Promise<CampaignRow> {
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data,
      select: campaignSelect,
    });
  }

  count(where: Prisma.CampaignWhereInput): Promise<number> {
    return this.prisma.campaign.count({ where });
  }

  list(args: {
    readonly where: Prisma.CampaignWhereInput;
    readonly skip: number;
    readonly take: number;
    readonly orderBy: Prisma.CampaignOrderByWithRelationInput;
  }): Promise<readonly CampaignRow[]> {
    return this.prisma.campaign.findMany({
      where: args.where,
      skip: args.skip,
      take: args.take,
      orderBy: args.orderBy,
      select: campaignSelect,
    });
  }

  findTemplateSummary(
    templateId: string,
  ): Promise<Prisma.TemplateGetPayload<{ select: typeof templateSummarySelect }> | null> {
    return this.prisma.template.findUnique({
      where: { id: templateId },
      select: templateSummarySelect,
    });
  }

  async refreshRecipientAggregates(campaignId: string): Promise<void> {
    const rows = await this.prisma.campaignRecipient.findMany({
      where: { campaignId },
      select: { status: true },
    });
    const groupedMap = new Map<CampaignRecipientStatus, number>();
    for (const r of rows) {
      groupedMap.set(r.status, (groupedMap.get(r.status) ?? 0) + 1);
    }
    const grouped = [...groupedMap.entries()].map(([status, count]) => ({
      status,
      _count: { _all: count },
    }));
    let recipientCount = 0;
    let readyCount = 0;
    let skippedCount = 0;
    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;
    const countFor = (s: CampaignRecipientStatus): number =>
      grouped.find((g) => g.status === s)?._count._all ?? 0;
    for (const g of grouped) {
      recipientCount += g._count._all;
    }
    readyCount = countFor('READY') + countFor('QUEUED');
    skippedCount = countFor('SKIPPED');
    sentCount = countFor('SENT');
    deliveredCount = countFor('DELIVERED');
    failedCount = countFor('FAILED');

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        recipientCount,
        readyCount,
        skippedCount,
        sentCount,
        deliveredCount,
        failedCount,
      },
    });
  }

  deleteRecipientsForCampaign(campaignId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.campaignRecipient.deleteMany({ where: { campaignId } });
  }

  createRecipients(
    data: readonly Prisma.CampaignRecipientCreateManyInput[],
  ): Promise<{ count: number }> {
    if (data.length === 0) {
      return Promise.resolve({ count: 0 });
    }
    return this.prisma.campaignRecipient.createMany({ data: [...data] });
  }

  cancelOutstandingRecipients(campaignId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.campaignRecipient.updateMany({
      where: {
        campaignId,
        status: { in: ['PENDING', 'READY', 'QUEUED'] },
      },
      data: { status: 'CANCELLED' },
    });
  }

  async countSkipReasons(
    campaignId: string,
  ): Promise<readonly { skipReason: string | null; _count: { _all: number } }[]> {
    const rows = await this.prisma.campaignRecipient.findMany({
      where: { campaignId, status: 'SKIPPED' },
      select: { skipReason: true },
    });
    const map = new Map<string | null, number>();
    for (const r of rows) {
      const k = r.skipReason;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].map(([skipReason, count]) => ({
      skipReason,
      _count: { _all: count },
    }));
  }

  async countRecipientsByStatus(
    campaignId: string,
  ): Promise<readonly { status: CampaignRecipientStatus; _count: { _all: number } }[]> {
    const rows = await this.prisma.campaignRecipient.findMany({
      where: { campaignId },
      select: { status: true },
    });
    const map = new Map<CampaignRecipientStatus, number>();
    for (const r of rows) {
      map.set(r.status, (map.get(r.status) ?? 0) + 1);
    }
    return [...map.entries()].map(([status, count]) => ({
      status,
      _count: { _all: count },
    }));
  }

  getCampaignEvents(campaignId: string): Promise<
    readonly {
      id: string;
      outboundMessageId: string;
      fromStatus: import('@prisma/client').MessageStatus | null;
      toStatus: import('@prisma/client').MessageStatus;
      reason: string | null;
      createdAt: Date;
    }[]
  > {
    return this.prisma.messageStatusEvent.findMany({
      where: { outboundMessage: { campaignId } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        outboundMessageId: true,
        fromStatus: true,
        toStatus: true,
        reason: true,
        createdAt: true,
      },
    });
  }
}
