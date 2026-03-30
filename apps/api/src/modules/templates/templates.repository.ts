import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export const templateSelect = {
  id: true,
  organizationId: true,
  createdByUserId: true,
  name: true,
  description: true,
  body: true,
  channelType: true,
  isArchived: true,
  metadata: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.TemplateSelect;

export type TemplateRow = Prisma.TemplateGetPayload<{ select: typeof templateSelect }>;

@Injectable()
export class TemplatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.TemplateUncheckedCreateInput): Promise<TemplateRow> {
    return this.prisma.template.create({ data, select: templateSelect });
  }

  findById(templateId: string): Promise<TemplateRow | null> {
    return this.prisma.template.findUnique({ where: { id: templateId }, select: templateSelect });
  }

  update(templateId: string, data: Prisma.TemplateUpdateInput): Promise<TemplateRow> {
    return this.prisma.template.update({ where: { id: templateId }, data, select: templateSelect });
  }

  count(where: Prisma.TemplateWhereInput): Promise<number> {
    return this.prisma.template.count({ where });
  }

  list(args: {
    readonly where: Prisma.TemplateWhereInput;
    readonly skip: number;
    readonly take: number;
    readonly orderBy: Prisma.TemplateOrderByWithRelationInput;
  }): Promise<readonly TemplateRow[]> {
    return this.prisma.template.findMany({
      where: args.where,
      skip: args.skip,
      take: args.take,
      orderBy: args.orderBy,
      select: templateSelect,
    });
  }
}
