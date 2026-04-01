import { HttpStatus, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ApiErrorCodes } from '../../common/constants/http.constants';
import { AppHttpException } from '../../common/exceptions/app-http.exception';
import type { AuthPrincipal } from '../../common/types/auth-principal.types';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EntitlementsService } from './entitlements.service';
import { StripeService } from './stripe.service';
import { UsageCountersService } from './usage-counters.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly entitlements: EntitlementsService,
    private readonly usage: UsageCountersService,
  ) {}

  private orgId(principal: AuthPrincipal): string {
    if (!principal.organizationId) {
      throw new AppHttpException(
        ApiErrorCodes.FORBIDDEN,
        'Membership inactive',
        HttpStatus.FORBIDDEN,
      );
    }
    return principal.organizationId;
  }

  async getPlans(): Promise<
    readonly {
      code: string;
      name: string;
      description: string | null;
      interval: string | null;
      providerPriceId: string | null;
      entitlements: Record<string, boolean | number | string | null>;
    }[]
  > {
    const rows = await this.prisma.billingPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { entitlements: true },
    });
    return rows.map((plan) => ({
      code: plan.code,
      name: plan.name,
      description: plan.description,
      interval: plan.interval,
      providerPriceId: plan.providerPriceId,
      entitlements: Object.fromEntries(
        plan.entitlements.map((e) => [
          e.code,
          e.valueType === 'BOOLEAN'
            ? (e.booleanValue ?? false)
            : e.valueType === 'NUMBER'
              ? (e.numberValue ?? 0)
              : (e.stringValue ?? null),
        ]),
      ),
    }));
  }

  async getMyBilling(principal: AuthPrincipal): Promise<Record<string, unknown>> {
    const organizationId = this.orgId(principal);
    const [customer, subscription, resolvedEntitlements, usageCounters] = await Promise.all([
      this.prisma.billingCustomer.findUnique({
        where: { organizationId_provider: { organizationId, provider: 'STRIPE' } },
      }),
      this.prisma.organizationSubscription.findUnique({
        where: { organizationId_provider: { organizationId, provider: 'STRIPE' } },
        include: { billingPlan: true },
      }),
      this.entitlements.resolveForOrganization(organizationId),
      this.usage.getUsageSnapshot(organizationId),
    ]);

    return {
      customer,
      subscription: subscription
        ? {
            status: subscription.status,
            planCode: subscription.billingPlan?.code ?? null,
            planName: subscription.billingPlan?.name ?? null,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            trialEndsAt: subscription.trialEndsAt,
          }
        : null,
      entitlements: resolvedEntitlements,
      usageCounters,
    };
  }

  async createCheckoutSession(
    principal: AuthPrincipal,
    input: { readonly planCode?: string; readonly priceId?: string },
  ): Promise<{ url: string | null; sessionId: string }> {
    const organizationId = this.orgId(principal);
    const user = await this.prisma.user.findUnique({
      where: { id: principal.userId },
      select: { email: true },
    });
    const customer = await this.getOrCreateStripeCustomer({
      organizationId,
      email: user?.email ?? null,
    });

    const selectedPriceId =
      input.priceId ??
      (
        await this.prisma.billingPlan.findUnique({
          where: { code: input.planCode ?? '' },
          select: { providerPriceId: true },
        })
      )?.providerPriceId;

    if (!selectedPriceId) {
      throw new AppHttpException(
        ApiErrorCodes.BAD_REQUEST,
        'Missing Stripe price for selected plan',
        HttpStatus.BAD_REQUEST,
      );
    }

    const session = await this.stripe.client.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.providerCustomerId,
      success_url: this.stripe.successUrl,
      cancel_url: this.stripe.cancelUrl,
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      metadata: {
        organizationId,
        ...(input.planCode ? { planCode: input.planCode } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'BILLING_CHECKOUT_SESSION_CREATED',
        entityType: 'organization',
        organizationId,
        actorUserId: principal.userId,
        metadata: {
          sessionId: session.id,
          planCode: input.planCode ?? null,
        } as Prisma.InputJsonValue,
      },
    });

    return { url: session.url, sessionId: session.id };
  }

  async createPortalSession(
    principal: AuthPrincipal,
  ): Promise<{ url: string; customerId: string }> {
    const organizationId = this.orgId(principal);
    const user = await this.prisma.user.findUnique({
      where: { id: principal.userId },
      select: { email: true },
    });
    const customer = await this.getOrCreateStripeCustomer({
      organizationId,
      email: user?.email ?? null,
    });
    const session = await this.stripe.client.billingPortal.sessions.create({
      customer: customer.providerCustomerId,
      return_url: this.stripe.billingPortalReturnUrl,
    });
    await this.prisma.auditLog.create({
      data: {
        action: 'BILLING_PORTAL_SESSION_CREATED',
        entityType: 'organization',
        organizationId,
        actorUserId: principal.userId,
        metadata: { customerId: customer.providerCustomerId } as Prisma.InputJsonValue,
      },
    });
    return { url: session.url, customerId: customer.providerCustomerId };
  }

  private async getOrCreateStripeCustomer(args: {
    readonly organizationId: string;
    readonly email: string | null;
  }) {
    const existing = await this.prisma.billingCustomer.findUnique({
      where: {
        organizationId_provider: { organizationId: args.organizationId, provider: 'STRIPE' },
      },
    });
    if (existing) return existing;

    const created = await this.stripe.client.customers.create(
      args.email
        ? { email: args.email, metadata: { organizationId: args.organizationId } }
        : { metadata: { organizationId: args.organizationId } },
    );
    return this.prisma.billingCustomer.create({
      data: {
        organizationId: args.organizationId,
        provider: 'STRIPE',
        providerCustomerId: created.id,
        email: args.email,
      },
    });
  }
}
