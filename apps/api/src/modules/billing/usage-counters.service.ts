import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class UsageCountersService {
  constructor(private readonly prisma: PrismaService) {}

  async incrementUsageCounter(args: {
    readonly organizationId: string;
    readonly code: string;
    readonly periodKey?: string | null;
    readonly delta: number;
  }): Promise<number> {
    const periodKey = args.periodKey ?? '';
    const row = await this.prisma.usageCounter.upsert({
      where: {
        organizationId_code_periodKey: {
          organizationId: args.organizationId,
          code: args.code,
          periodKey,
        },
      },
      update: { value: { increment: args.delta } },
      create: {
        organizationId: args.organizationId,
        code: args.code,
        periodKey,
        value: Math.max(0, args.delta),
      },
      select: { value: true },
    });
    return row.value;
  }

  async getUsageSnapshot(organizationId: string): Promise<Record<string, number>> {
    const rows = await this.prisma.usageCounter.findMany({
      where: { organizationId },
      select: { code: true, periodKey: true, value: true },
      orderBy: { code: 'asc' },
    });
    return Object.fromEntries(
      rows.map((row) => [
        row.periodKey && row.periodKey.length > 0 ? `${row.code}:${row.periodKey}` : row.code,
        row.value,
      ]),
    );
  }

  monthKey(date = new Date()): string {
    const monthNumber = date.getUTCMonth() + 1;
    const month = String(monthNumber).padStart(2, '0');
    return `${String(date.getUTCFullYear())}-${month}`;
  }
}
