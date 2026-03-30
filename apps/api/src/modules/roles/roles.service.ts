import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

type PrismaClientLike = PrismaService | Prisma.TransactionClient;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string, tx?: PrismaClientLike) {
    const client: PrismaClientLike = tx ?? this.prisma;
    return client.role.findUnique({
      where: { code },
    });
  }

  async listPermissionCodesForRoleId(roleId: string, tx?: PrismaClientLike) {
    const client: PrismaClientLike = tx ?? this.prisma;
    const rows = await client.rolePermission.findMany({
      where: { roleId },
      select: { permission: { select: { code: true } } },
    });
    return rows.map((r) => r.permission.code);
  }
}
