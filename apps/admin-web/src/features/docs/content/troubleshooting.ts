import type { DocDefinition } from '../types';

export const troubleshootingDoc: DocDefinition = {
  slug: 'troubleshooting',
  title: 'Troubleshooting & FAQ',
  description: 'Common failures across Excel, gateway, campaigns, billing, and sessions.',
  category: 'Reference',
  lastUpdated: '2026-04-02',
  tags: ['faq', 'errors'],
  relatedSlugs: ['excel-addin', 'mobile-gateway', 'operations', 'billing'],
  blocks: [
    {
      type: 'h2',
      text: 'Excel add-in not loading',
    },
    {
      type: 'ul',
      items: [
        'Confirm sideload/manifest URL and HTTPS requirements for production.',
        'Clear Office cache; reload task pane.',
        'Verify VITE_API_BASE_URL reaches the API (CORS + correct /api/v1 suffix).',
      ],
    },
    {
      type: 'h2',
      text: 'No worksheet rows found',
    },
    {
      type: 'p',
      text: 'Refresh workbook snapshot; ensure the active sheet has data in the used range. Protected sheets or empty selection can yield no rows.',
    },
    {
      type: 'h2',
      text: 'Template variable missing',
    },
    {
      type: 'p',
      text: 'Preview shows missing merge fields. Add columns to the worksheet mapping or change template placeholders to match available fields.',
    },
    {
      type: 'h2',
      text: 'No eligible device',
    },
    {
      type: 'p',
      text: 'No active ONLINE device passed health/eligibility checks. Register a device, grant SMS permission on Android, confirm quotas and billing state allow sending.',
    },
    {
      type: 'h2',
      text: 'Device not receiving dispatch',
    },
    {
      type: 'ul',
      items: [
        'Check gateway JWT secret and device auth in API env.',
        'Confirm queues enabled (QUEUES_ENABLED) in non-test deployments.',
        'Inspect Operations → stuck / queue lag.',
      ],
    },
    {
      type: 'h2',
      text: 'SMS permission denied (Android)',
    },
    {
      type: 'p',
      text: 'User must grant SMS permission in system settings. Without it, dispatch cannot complete.',
    },
    {
      type: 'h2',
      text: 'Billing / feature unavailable',
    },
    {
      type: 'p',
      text: '403 on entitlement means plan limits or flags (e.g. operations.read, imports). Upgrade plan or adjust entitlements. Subscription UNPAID/CANCELLED may block outbound.',
    },
    {
      type: 'h2',
      text: 'Session expired',
    },
    {
      type: 'p',
      text: 'Re-login in admin or add-in. Refresh token flow applies where implemented; clearing storage forces a clean login.',
    },
  ],
};
