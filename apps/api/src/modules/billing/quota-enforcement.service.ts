import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ApiErrorCodes } from '../../common/constants/http.constants';
import { AppHttpException } from '../../common/exceptions/app-http.exception';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EntitlementsService } from './entitlements.service';
import { UsageCountersService } from './usage-counters.service';

@Injectable()
export class QuotaEnforcementService {
  constructor(
    private readonly entitlements: EntitlementsService,
    private readonly usage: UsageCountersService,
    private readonly prisma: PrismaService,
  ) {}

  async assertFeatureEnabled(organizationId: string, entitlementCode: string): Promise<void> {
    const resolved = await this.entitlements.resolveForOrganization(organizationId);
    if (resolved[entitlementCode] !== true) {
      await this.prisma.auditLog.create({
        data: {
          action: 'BILLING_ENTITLEMENT_DENIED',
          entityType: 'organization',
          organizationId,
          metadata: { entitlementCode } as Prisma.InputJsonValue,
        },
      });
      throw new AppHttpException(
        ApiErrorCodes.FORBIDDEN,
        `Feature is not enabled for current plan: ${entitlementCode}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async assertBelowLimit(args: {
    readonly organizationId: string;
    readonly entitlementCode: string;
    readonly currentValue: number;
  }): Promise<void> {
    const resolved = await this.entitlements.resolveForOrganization(args.organizationId);
    const limit = resolved[args.entitlementCode];
    if (typeof limit !== 'number') return;
    if (args.currentValue >= limit) {
      await this.prisma.auditLog.create({
        data: {
          action: 'BILLING_QUOTA_LIMIT_REACHED',
          entityType: 'organization',
          organizationId: args.organizationId,
          metadata: {
            entitlementCode: args.entitlementCode,
            currentValue: args.currentValue,
            limit,
          } as Prisma.InputJsonValue,
        },
      });
      throw new AppHttpException(
        ApiErrorCodes.FORBIDDEN,
        `Quota exceeded for ${args.entitlementCode}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async incrementUsageCounter(
    organizationId: string,
    code: string,
    periodKey: string | null,
    delta: number,
  ): Promise<number> {
    return this.usage.incrementUsageCounter({ organizationId, code, periodKey, delta });
  }

  async getUsageSnapshot(organizationId: string): Promise<Record<string, number>> {
    return this.usage.getUsageSnapshot(organizationId);
  }
}
