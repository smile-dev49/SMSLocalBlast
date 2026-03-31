import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@ApiTags('Operations')
@ApiBearerAuth('access-token')
@Controller({ path: 'operations', version: '1' })
export class OperationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Permissions('operations.read')
  @Get('queues/summary')
  @ApiOperation({ summary: 'Queue-oriented outbound message summary' })
  async queueSummary() {
    const rows = await this.prisma.outboundMessage.findMany({ select: { status: true } });
    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});
    return counts;
  }

  @Permissions('operations.read')
  @Get('messages/stuck')
  async stuckMessages() {
    const staleAt = new Date(Date.now() - 5 * 60 * 1000);
    return this.prisma.outboundMessage.findMany({
      where: { status: 'DISPATCHING', dispatchingAt: { lt: staleAt } },
      select: { id: true, organizationId: true, deviceId: true, dispatchingAt: true },
      take: 200,
      orderBy: { dispatchingAt: 'asc' },
    });
  }

  @Permissions('operations.read')
  @Get('devices/availability')
  async devicesAvailability() {
    const all = await this.prisma.device.count({ where: { deletedAt: null } });
    const eligible = await this.prisma.device.count({
      where: {
        deletedAt: null,
        isActive: true,
        status: 'ONLINE',
        NOT: { healthStatus: 'CRITICAL' },
      },
    });
    return { all, eligible, unavailable: all - eligible };
  }
}
