import { Injectable } from '@nestjs/common';
import type { BillingEntitlement } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export type EntitlementResolvedValue = boolean | number | string | null;

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveForOrganization(
    organizationId: string,
  ): Promise<Record<string, EntitlementResolvedValue>> {
    const [subscription, freePlan] = await Promise.all([
      this.prisma.organizationSubscription.findUnique({
        where: { organizationId_provider: { organizationId, provider: 'STRIPE' } },
        select: {
          billingPlan: {
            select: {
              entitlements: {
                select: {
                  code: true,
                  valueType: true,
                  booleanValue: true,
                  numberValue: true,
                  stringValue: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.billingPlan.findUnique({
        where: { code: 'free' },
        select: {
          entitlements: {
            select: {
              code: true,
              valueType: true,
              booleanValue: true,
              numberValue: true,
              stringValue: true,
            },
          },
        },
      }),
    ]);

    const base = Object.fromEntries(
      (freePlan?.entitlements ?? []).map((e) => [e.code, this.toValue(e)]),
    );
    const planRows = subscription?.billingPlan?.entitlements ?? [];
    const overlay = Object.fromEntries(planRows.map((e) => [e.code, this.toValue(e)]));
    return { ...base, ...overlay };
  }

  resolveOne(
    entitlements: Record<string, EntitlementResolvedValue>,
    code: string,
  ): EntitlementResolvedValue {
    return entitlements[code] ?? null;
  }

  private toValue(
    entitlement: Pick<
      BillingEntitlement,
      'valueType' | 'booleanValue' | 'numberValue' | 'stringValue'
    >,
  ): EntitlementResolvedValue {
    if (entitlement.valueType === 'BOOLEAN') {
      return entitlement.booleanValue ?? false;
    }
    if (entitlement.valueType === 'NUMBER') {
      return entitlement.numberValue ?? 0;
    }
    return entitlement.stringValue ?? null;
  }
}
