import { httpRequest } from '@/core/network/http-client';

export interface BillingPlanItem {
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly interval: string | null;
  readonly providerPriceId: string | null;
  readonly entitlements: Record<string, boolean | number | string | null>;
}

export interface BillingMeResponse {
  readonly customer: { providerCustomerId: string; email: string | null } | null;
  readonly subscription: {
    status: string;
    planCode: string | null;
    planName: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: string | null;
  } | null;
  readonly entitlements: Record<string, boolean | number | string | null>;
  readonly usageCounters: Record<string, number>;
}

export const billingApi = {
  plans: () => httpRequest<readonly BillingPlanItem[]>('/billing/plans'),
  me: () => httpRequest<BillingMeResponse>('/billing/me'),
  checkoutSession: (body: { planCode?: string; priceId?: string }) =>
    httpRequest<{ url: string | null; sessionId: string }>('/billing/checkout-session', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  portalSession: () =>
    httpRequest<{ url: string; customerId: string }>('/billing/portal-session', {
      method: 'POST',
    }),
};
