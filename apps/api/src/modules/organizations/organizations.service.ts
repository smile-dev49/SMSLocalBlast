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
    return client.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
      },
    });
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
