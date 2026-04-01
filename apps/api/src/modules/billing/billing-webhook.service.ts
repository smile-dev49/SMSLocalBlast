import { Injectable, Logger } from '@nestjs/common';
import type { AuditAction, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { extractSubscriptionSyncFromStripeEvent } from './stripe-subscription-sync.util';

@Injectable()
export class BillingWebhookService {
  private readonly logger = new Logger(BillingWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processStripeEvent(event: Stripe.Event): Promise<void> {
    const existing = await this.prisma.billingEventLog.findUnique({
      where: { provider_providerEventId: { provider: 'STRIPE', providerEventId: event.id } },
      select: { id: true, processedAt: true },
    });
    if (existing?.processedAt) return;

    await this.prisma.billingEventLog.upsert({
      where: { provider_providerEventId: { provider: 'STRIPE', providerEventId: event.id } },
      update: { payload: event as unknown as Prisma.InputJsonValue },
      create: {
        provider: 'STRIPE',
        eventType: event.type,
        providerEventId: event.id,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    });

    const extract = extractSubscriptionSyncFromStripeEvent(event);
    if (extract) await this.applySubscriptionExtract(event, extract);

    await this.prisma.billingEventLog.update({
      where: { provider_providerEventId: { provider: 'STRIPE', providerEventId: event.id } },
      data: { processedAt: new Date() },
    });
  }

  private async applySubscriptionExtract(
    event: Stripe.Event,
    extract: NonNullable<ReturnType<typeof extractSubscriptionSyncFromStripeEvent>>,
  ): Promise<void> {
    const customer = await this.prisma.billingCustomer.findUnique({
      where: {
        provider_providerCustomerId: { provider: 'STRIPE', providerCustomerId: extract.customerId },
      },
      select: { id: true, organizationId: true },
    });
    if (!customer) return;

    let billingPlanId: string | undefined;
    if (extract.planCodeFromCheckout) {
      const plan = await this.prisma.billingPlan.findUnique({
        where: { code: extract.planCodeFromCheckout },
        select: { id: true },
      });
      if (plan) billingPlanId = plan.id;
    }

    const subscriptionUpdate: Prisma.OrganizationSubscriptionUpdateInput = {
      billingCustomer: { connect: { id: customer.id } },
      providerSubscriptionId: extract.subscriptionId,
      status: extract.status,
      currentPeriodStart: extract.currentPeriodStart,
      currentPeriodEnd: extract.currentPeriodEnd,
      cancelAtPeriodEnd: extract.cancelAtPeriodEnd,
      cancelledAt: extract.cancelledAt,
      trialEndsAt: extract.trialEndsAt,
      lastWebhookAt: new Date(),
      metadata: extract.raw,
      ...(billingPlanId !== undefined ? { billingPlan: { connect: { id: billingPlanId } } } : {}),
    };

    await this.prisma.organizationSubscription.upsert({
      where: {
        organizationId_provider: { organizationId: customer.organizationId, provider: 'STRIPE' },
      },
      update: subscriptionUpdate,
      create: {
        organizationId: customer.organizationId,
        provider: 'STRIPE',
        billingCustomerId: customer.id,
        providerSubscriptionId: extract.subscriptionId,
        status: extract.status,
        currentPeriodStart: extract.currentPeriodStart,
        currentPeriodEnd: extract.currentPeriodEnd,
        cancelAtPeriodEnd: extract.cancelAtPeriodEnd,
        cancelledAt: extract.cancelledAt,
        trialEndsAt: extract.trialEndsAt,
        lastWebhookAt: new Date(),
        metadata: extract.raw,
        ...(billingPlanId !== undefined ? { billingPlanId } : {}),
      },
    });

    const action: AuditAction =
      event.type === 'customer.subscription.deleted'
        ? 'BILLING_SUBSCRIPTION_CANCELLED'
        : event.type === 'invoice.payment_failed'
          ? 'BILLING_PAYMENT_FAILED'
          : event.type === 'checkout.session.completed'
            ? 'BILLING_SUBSCRIPTION_ACTIVATED'
            : 'BILLING_SUBSCRIPTION_UPDATED';

    await this.prisma.auditLog.create({
      data: {
        action,
        entityType: 'organization',
        organizationId: customer.organizationId,
        metadata: {
          eventType: event.type,
          providerSubscriptionId: extract.subscriptionId,
          status: extract.status,
        } as Prisma.InputJsonValue,
      },
    });
    this.logger.log(`Processed Stripe event ${event.type} for org ${customer.organizationId}`);
  }
}
