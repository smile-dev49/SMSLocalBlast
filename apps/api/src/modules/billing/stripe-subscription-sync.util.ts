import type { Prisma, SubscriptionStatus } from '@prisma/client';
import type Stripe from 'stripe';

export function normalizeStripeSubscriptionStatus(status: string): SubscriptionStatus {
  switch (status) {
    case 'trialing':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'unpaid':
      return 'UNPAID';
    case 'canceled':
      return 'CANCELLED';
    case 'incomplete':
      return 'INCOMPLETE';
    case 'incomplete_expired':
      return 'INCOMPLETE_EXPIRED';
    case 'paused':
      return 'PAUSED';
    default:
      return 'INCOMPLETE';
  }
}

function readString(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readNumber(obj: Record<string, unknown>, key: string): number | null {
  const value = obj[key];
  return typeof value === 'number' ? value : null;
}

function readBoolean(obj: Record<string, unknown>, key: string): boolean | null {
  const value = obj[key];
  return typeof value === 'boolean' ? value : null;
}

function fromUnix(ts: number | null): Date | null {
  return ts !== null && ts > 0 ? new Date(ts * 1000) : null;
}

function readMetadataString(obj: Record<string, unknown>, key: string): string | null {
  const meta = obj['metadata'];
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  const v = (meta as Record<string, unknown>)[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

export interface SubscriptionSyncExtract {
  readonly customerId: string;
  readonly subscriptionId: string;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStart: Date | null;
  readonly currentPeriodEnd: Date | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly cancelledAt: Date | null;
  readonly trialEndsAt: Date | null;
  readonly planCodeFromCheckout: string | null;
  readonly raw: Prisma.InputJsonValue;
}

/** Maps a Stripe webhook `event.data.object` into subscription fields (best-effort by event type). */
export function extractSubscriptionSyncFromStripeEvent(
  event: Stripe.Event,
): SubscriptionSyncExtract | null {
  const obj = event.data.object as unknown as Record<string, unknown>;

  if (event.type === 'checkout.session.completed') {
    const customerId = readString(obj, 'customer');
    const subscriptionId = readString(obj, 'subscription');
    if (!customerId || !subscriptionId) return null;
    const paid = readString(obj, 'payment_status') === 'paid';
    const status: SubscriptionStatus = paid ? 'ACTIVE' : 'INCOMPLETE';
    const planCode = readMetadataString(obj, 'planCode');
    return {
      customerId,
      subscriptionId,
      status,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      trialEndsAt: null,
      planCodeFromCheckout: planCode,
      raw: obj as Prisma.InputJsonValue,
    };
  }

  if (event.type.startsWith('customer.subscription.')) {
    const customerId = readString(obj, 'customer');
    const subscriptionId = readString(obj, 'id');
    if (!customerId || !subscriptionId) return null;
    const statusRaw = readString(obj, 'status') ?? '';
    return {
      customerId,
      subscriptionId,
      status: normalizeStripeSubscriptionStatus(statusRaw),
      currentPeriodStart: fromUnix(readNumber(obj, 'current_period_start')),
      currentPeriodEnd: fromUnix(readNumber(obj, 'current_period_end')),
      cancelAtPeriodEnd: readBoolean(obj, 'cancel_at_period_end') ?? false,
      cancelledAt: fromUnix(readNumber(obj, 'canceled_at')),
      trialEndsAt: fromUnix(readNumber(obj, 'trial_end')),
      planCodeFromCheckout: null,
      raw: obj as Prisma.InputJsonValue,
    };
  }

  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const customerId = readString(obj, 'customer');
    const subscriptionId = readString(obj, 'subscription');
    if (!customerId || !subscriptionId) return null;
    const paid = event.type === 'invoice.paid';
    return {
      customerId,
      subscriptionId,
      status: paid ? 'ACTIVE' : 'PAST_DUE',
      currentPeriodStart: fromUnix(readNumber(obj, 'period_start')),
      currentPeriodEnd: fromUnix(readNumber(obj, 'period_end')),
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      trialEndsAt: null,
      planCodeFromCheckout: null,
      raw: obj as Prisma.InputJsonValue,
    };
  }

  return null;
}
