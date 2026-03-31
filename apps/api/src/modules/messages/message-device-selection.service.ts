import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface DeviceSelectionResult {
  readonly deviceId: string | null;
  readonly reason: string | null;
}

@Injectable()
export class MessageDeviceSelectionService {
  constructor(private readonly prisma: PrismaService) {}

  async selectEligibleDevice(organizationId: string): Promise<DeviceSelectionResult> {
    const devices = await this.prisma.device.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
        status: 'ONLINE',
        NOT: { healthStatus: 'CRITICAL' },
      },
      select: {
        id: true,
        isPrimary: true,
        healthStatus: true,
        lastSeenAt: true,
        dailySendLimit: true,
        hourlySendLimit: true,
        dailySentCount: true,
        hourlySentCount: true,
      },
    });
    const quotaEligible = devices.filter(
      (d) => d.dailySentCount < d.dailySendLimit && d.hourlySentCount < d.hourlySendLimit,
    );
    if (quotaEligible.length === 0) {
      return { deviceId: null, reason: 'NO_ELIGIBLE_DEVICE' };
    }
    quotaEligible.sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      const healthRank = (h: string): number =>
        h === 'HEALTHY' ? 0 : h === 'WARNING' ? 1 : h === 'UNKNOWN' ? 2 : 3;
      const hr = healthRank(a.healthStatus) - healthRank(b.healthStatus);
      if (hr !== 0) return hr;
      return (b.lastSeenAt?.getTime() ?? 0) - (a.lastSeenAt?.getTime() ?? 0);
    });
    return { deviceId: quotaEligible[0]?.id ?? null, reason: null };
  }
}
