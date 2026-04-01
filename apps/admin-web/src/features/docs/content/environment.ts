import type { DocDefinition } from '../types';

export const environmentDoc: DocDefinition = {
  slug: 'environment',
  title: 'Environment & configuration',
  description:
    'Reference for environment variables across API, admin web, Excel add-in, and Stripe — placeholders only, no secrets.',
  category: 'Reference',
  lastUpdated: '2026-04-02',
  tags: ['env', 'config'],
  relatedSlugs: ['api', 'billing', 'launch-checklist'],
  blocks: [
    {
      type: 'h2',
      text: 'API (NestJS)',
    },
    {
      type: 'p',
      text: 'See apps/api/.env.example for the full list. Critical groups:',
    },
    {
      type: 'ul',
      items: [
        'DATABASE_URL — Postgres connection string.',
        'REDIS_URL — BullMQ / cache.',
        'JWT_ACCESS_SECRET / JWT_REFRESH_SECRET — session tokens (min length enforced).',
        'QUEUES_ENABLED — set false only for isolated tests.',
        'DEVICE_GATEWAY_JWT_SECRET — gateway device auth (when using mobile gateway).',
        'STRIPE_* — billing (secret key, webhook secret, success/cancel/portal URLs).',
      ],
    },
    {
      type: 'h2',
      text: 'Admin web',
    },
    {
      type: 'ul',
      items: [
        'NEXT_PUBLIC_API_BASE_URL — must include /api/v1 (e.g. http://localhost:3000/api/v1).',
        'NEXT_PUBLIC_APP_NAME — product label in UI.',
        'NEXT_PUBLIC_APP_URL — base URL of admin app (used for links and diagnostics).',
      ],
    },
    {
      type: 'h2',
      text: 'Excel add-in',
    },
    {
      type: 'ul',
      items: [
        'VITE_API_BASE_URL — same logical base as admin: include /api/v1.',
        'VITE_ADMIN_HELP_URL — optional full URL to this Help Center (default http://localhost:3001/docs).',
        'VITE_APP_NAME / VITE_APP_ENV — labeling and environment tag.',
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Never commit real API keys, Stripe secrets, or database passwords. Use placeholders in docs and CI samples.',
    },
  ],
};
