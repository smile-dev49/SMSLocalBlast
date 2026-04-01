import type { DocDefinition } from '../types';

export const billingDoc: DocDefinition = {
  slug: 'billing',
  title: 'Billing & subscriptions',
  description: 'Plans, Stripe checkout/portal, subscription states, and entitlements.',
  category: 'Reference',
  lastUpdated: '2026-04-02',
  tags: ['stripe', 'quota'],
  relatedSlugs: ['environment', 'troubleshooting', 'launch-checklist'],
  blocks: [
    {
      type: 'h2',
      text: 'Plans',
    },
    {
      type: 'p',
      text: 'Plans (e.g. free, pro, agency) are seeded in the database with entitlements: numeric limits (devices, contacts, campaigns, monthly messages, templates) and boolean features (imports, API tokens, operations visibility, etc.).',
    },
    {
      type: 'h2',
      text: 'Subscription states',
    },
    {
      type: 'ul',
      items: [
        'ACTIVE / TRIALING — normal paid access within plan limits.',
        'PAST_DUE — grace: outbound may still be allowed; fix payment in Stripe.',
        'UNPAID / CANCELLED / INCOMPLETE / INCOMPLETE_EXPIRED / PAUSED — outbound messaging is blocked by policy until subscription is healthy or plan downgrades.',
      ],
    },
    {
      type: 'h2',
      text: 'Checkout & Billing Portal',
    },
    {
      type: 'p',
      text: 'Admin → Billing: start Checkout for a price/plan or open the Customer Portal to manage payment methods and invoices. Requires billing.write and valid Stripe configuration.',
    },
    {
      type: 'h2',
      text: 'Webhooks',
    },
    {
      type: 'p',
      text: 'Configure Stripe webhooks to POST /api/v1/billing/webhooks/stripe with signing secret. Events update OrganizationSubscription and audit logs idempotently.',
    },
  ],
};
