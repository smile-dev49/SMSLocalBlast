import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrganization(
    input: {
      name: string;
      slug: string;
    },
    tx?: PrismaClientLike,
  ) {
    const client: PrismaClientLike = tx ?? this.prisma;
    const organization = await client.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
      },
    });
    const freePlan = await client.billingPlan.findUnique({
      where: { code: 'free' },
      select: { id: true },
    });
    if (freePlan) {
      await client.organizationSubscription.upsert({
        where: {
          organizationId_provider: { organizationId: organization.id, provider: 'STRIPE' },
        },
        update: { billingPlanId: freePlan.id, status: 'ACTIVE' },
        create: {
          organizationId: organization.id,
          provider: 'STRIPE',
          billingPlanId: freePlan.id,
          status: 'ACTIVE',
        },
      });
    }
    return organization;
  }

  async findBySlug(slug: string, tx?: PrismaClientLike) {
    const client: PrismaClientLike = tx ?? this.prisma;
    return client.organization.findUnique({
      where: { slug },
    });
  }

  async findById(id: string, tx?: PrismaClientLike) {
    const client: PrismaClientLike = tx ?? this.prisma;
    return client.organization.findUnique({
      where: { id },
    });
  }
}
