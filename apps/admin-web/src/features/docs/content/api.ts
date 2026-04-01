import { publicEnv, swaggerUiUrlFromApiBase } from '@/core/config/env';

import type { DocDefinition } from '../types';

const swaggerUiHref = swaggerUiUrlFromApiBase(publicEnv.apiBaseUrl);

export const apiDoc: DocDefinition = {
  slug: 'api',
  title: 'API & integration overview',
  description:
    'Where Swagger lives, auth model, major API areas, and device gateway auth — without duplicating OpenAPI.',
  category: 'Reference',
  lastUpdated: '2026-04-02',
  tags: ['api', 'swagger'],
  relatedSlugs: ['environment', 'mobile-gateway', 'getting-started'],
  blocks: [
    {
      type: 'h2',
      text: 'Interactive API docs (Swagger)',
    },
    {
      type: 'p',
      text: `When SWAGGER_ENABLED=true on the API, OpenAPI UI is served at ${swaggerUiHref} (derived from NEXT_PUBLIC_API_BASE_URL). Use it to browse schemas and try authenticated routes with a Bearer token.`,
    },
    {
      type: 'links',
      items: [{ href: swaggerUiHref, label: `Open Swagger UI (${swaggerUiHref})` }],
    },
    {
      type: 'h2',
      text: 'Auth model (human users)',
    },
    {
      type: 'ul',
      items: [
        'Register/login returns access + refresh JWTs.',
        'Include Authorization: Bearer <access> on requests.',
        'Permissions are resolved per org membership (RBAC); guards enforce route-level codes (e.g. campaigns.read).',
      ],
    },
    {
      type: 'h2',
      text: 'Device gateway',
    },
    {
      type: 'p',
      text: 'Mobile devices use a separate gateway auth flow (device-scoped JWT) to pull work and report outcomes. See gateway module docs in the API repo and Mobile gateway guide here.',
    },
    {
      type: 'h2',
      text: 'Major API groups',
    },
    {
      type: 'ul',
      items: [
        'Auth, sessions, organizations, users, roles',
        'Devices, contacts, templates, campaigns, messages',
        'Schedules, billing, webhooks, audit, admin utilities',
      ],
    },
    {
      type: 'h2',
      text: 'API tokens (future)',
    },
    {
      type: 'p',
      text: 'Org-level API tokens may be added later for automation. Entitlement api_tokens.enabled will gate creation when implemented.',
    },
  ],
};
