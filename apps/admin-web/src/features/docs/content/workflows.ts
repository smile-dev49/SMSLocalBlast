import type { DocDefinition } from '../types';

export const workflowsDoc: DocDefinition = {
  slug: 'workflows',
  title: 'Operator workflows',
  description: 'Step-by-step paths for day-to-day operators and admins.',
  category: 'Guides',
  lastUpdated: '2026-04-02',
  tags: ['runbook'],
  relatedSlugs: ['excel-addin', 'campaigns', 'operations', 'billing'],
  blocks: [
    {
      type: 'h2',
      text: 'Import contacts from Excel',
    },
    {
      type: 'ol',
      items: [
        'Workbook tab → refresh snapshot.',
        'Contacts tab → map phone + optional columns.',
        'Preview → fix validation errors → Confirm.',
      ],
    },
    {
      type: 'h2',
      text: 'Preview template with a worksheet row',
    },
    {
      type: 'p',
      text: 'Templates tab → pick template → use preview with selected row merge fields. Adjust template body or mapping if variables are missing.',
    },
    {
      type: 'h2',
      text: 'Create and launch a campaign',
    },
    {
      type: 'ol',
      items: [
        'Ensure template + audience exist (lists/contacts).',
        'Campaigns tab or admin web → create campaign, attach template and targets.',
        'Preview/schedule as needed → Start when ready.',
        'Watch Messages and Campaign detail for progress.',
      ],
    },
    {
      type: 'h2',
      text: 'Verify device is online',
    },
    {
      type: 'p',
      text: 'Admin → Devices: status ONLINE, recent heartbeat, health not CRITICAL. Mobile app foreground/network affects heartbeats.',
    },
    {
      type: 'h2',
      text: 'Inspect message status',
    },
    {
      type: 'p',
      text: 'Admin → Messages: filter by campaign, open detail for timeline/events. Retry/cancel where permissions allow.',
    },
    {
      type: 'h2',
      text: 'Recover stuck / failed messages',
    },
    {
      type: 'p',
      text: 'Operations → stuck list + recover-stuck (write). Review dead-letter entries and billing/subscription if failures persist.',
    },
    {
      type: 'h2',
      text: 'Billing portal',
    },
    {
      type: 'p',
      text: 'Admin → Billing → Open Billing Portal (billing.write). Update payment method if past_due.',
    },
    {
      type: 'h2',
      text: 'Permissions issues',
    },
    {
      type: 'p',
      text: 'Settings shows effective permission codes. Missing UI sections mean RBAC denies; 403 on API can also mean plan entitlements — see Billing guide.',
    },
  ],
};
