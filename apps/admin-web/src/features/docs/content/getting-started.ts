import type { DocDefinition } from '../types';

export const gettingStartedDoc: DocDefinition = {
  slug: 'getting-started',
  title: 'Getting started',
  description:
    'What SMS LocalBlast is, how the pieces fit together, and how to complete first-time setup.',
  category: 'Start',
  lastUpdated: '2026-04-02',
  tags: ['overview', 'setup'],
  relatedSlugs: ['environment', 'launch-checklist', 'excel-addin'],
  blocks: [
    {
      type: 'p',
      text: 'SMS LocalBlast is an organization-scoped SMS campaign platform: contacts and templates live in the API, operators use the Excel add-in for workbook-driven workflows, and the mobile gateway (Android) sends SMS through a registered device. Admin web is the control plane for monitoring, billing, and operations.',
    },
    {
      type: 'h2',
      text: 'Architecture (high level)',
    },
    {
      type: 'ul',
      items: [
        'NestJS API + Postgres (Prisma) + Redis (queues) — source of truth for orgs, RBAC, campaigns, messages.',
        'Admin web (Next.js) — authenticated dashboard: devices, campaigns, messages, contacts, templates, operations, billing.',
        'Excel add-in — task pane: workbook snapshot, column mapping, import preview/confirm, templates, campaigns.',
        'Mobile gateway app — device registration, heartbeats, dispatch pull, sent/delivery callbacks to the API.',
      ],
    },
    {
      type: 'h2',
      text: 'Required components',
    },
    {
      type: 'ul',
      items: [
        'Running API with DATABASE_URL, Redis, JWT secrets, and migrations applied.',
        'At least one user/org (seed or register) and RBAC permissions for your role.',
        'For sending: at least one ONLINE device with SMS permission on Android.',
        'Optional: Stripe keys for paid plans (see Billing guide).',
      ],
    },
    {
      type: 'h2',
      text: 'First login (admin web)',
    },
    {
      type: 'ol',
      items: [
        'Open the admin URL (e.g. http://localhost:3001).',
        'Sign in with your org user. If you have no account yet, use API registration or your operator onboarding flow.',
        'Confirm you see your organization name in the header and can open Dashboard / Settings.',
        'Visit Devices and verify a device appears once the mobile app is registered.',
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Use the Launch checklist (/docs/launch-checklist) before go-live to validate env, seed, devices, and a test campaign.',
    },
  ],
};
