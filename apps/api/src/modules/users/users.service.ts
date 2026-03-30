import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(
    input: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
    },
    tx?: PrismaClientLike,
  ) {
    const client: PrismaClientLike = tx ?? this.prisma;
    return client.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });
  }

  async findByEmail(email: string, tx?: PrismaClientLike) {
    const client: PrismaClientLike = tx ?? this.prisma;
    return client.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string, tx?: PrismaClientLike) {
    const client: PrismaClientLike = tx ?? this.prisma;
    return client.user.findUnique({
      where: { id },
    });
  }
}
