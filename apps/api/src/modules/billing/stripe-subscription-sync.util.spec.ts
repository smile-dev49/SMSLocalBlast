import type Stripe from 'stripe';
import {
  extractSubscriptionSyncFromStripeEvent,
  normalizeStripeSubscriptionStatus,
} from './stripe-subscription-sync.util';

describe('stripe-subscription-sync.util', () => {
  it('normalizes Stripe subscription status strings', () => {
    expect(normalizeStripeSubscriptionStatus('active')).toBe('ACTIVE');
    expect(normalizeStripeSubscriptionStatus('canceled')).toBe('CANCELLED');
    expect(normalizeStripeSubscriptionStatus('')).toBe('INCOMPLETE');
  });

  it('extracts checkout.session.completed payload', () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_1',
          subscription: 'sub_1',
          payment_status: 'paid',
          metadata: { planCode: 'pro' },
        },
      },
    } as unknown as Stripe.Event;
    const v = extractSubscriptionSyncFromStripeEvent(event);
    expect(v).not.toBeNull();
    expect(v?.customerId).toBe('cus_1');
    expect(v?.subscriptionId).toBe('sub_1');
    expect(v?.status).toBe('ACTIVE');
    expect(v?.planCodeFromCheckout).toBe('pro');
  });
});
