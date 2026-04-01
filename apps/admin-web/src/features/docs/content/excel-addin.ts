import type { DocDefinition } from '../types';

export const excelAddinDoc: DocDefinition = {
  slug: 'excel-addin',
  title: 'Excel add-in guide',
  description: 'Workbook-driven imports, templates, and campaigns from the task pane.',
  category: 'Guides',
  lastUpdated: '2026-04-02',
  tags: ['excel', 'import'],
  relatedSlugs: ['campaigns', 'troubleshooting', 'workflows'],
  blocks: [
    {
      type: 'h2',
      text: 'Login',
    },
    {
      type: 'p',
      text: 'Sign in with the same API-backed credentials as admin web. The add-in stores the session for subsequent requests. If login fails, verify VITE_API_BASE_URL matches your running API and CORS allows the add-in origin.',
    },
    {
      type: 'h2',
      text: 'Workbook refresh',
    },
    {
      type: 'p',
      text: 'Open the Workbook tab and refresh the snapshot so the add-in reads the current sheet selection or used range. Empty or protected ranges produce “no rows” style errors — see Troubleshooting.',
    },
    {
      type: 'h2',
      text: 'Column mapping',
    },
    {
      type: 'p',
      text: 'Map worksheet columns to phone number (required) and optional name/email fields. Use consistent headers; trim spaces in cells. Save mapping before running import preview.',
    },
    {
      type: 'h2',
      text: 'Contacts import (preview / confirm)',
    },
    {
      type: 'ol',
      items: [
        'Preview shows row-level validation and duplicate detection against existing contacts.',
        'Confirm applies rows according to options (dedupe, update existing).',
        'Org quotas and entitlements (imports.enabled, contacts.max) are enforced by the API.',
      ],
    },
    {
      type: 'h2',
      text: 'Template preview',
    },
    {
      type: 'p',
      text: 'Render a template against a selected row’s merge fields. Missing variables depend on template strategy (empty vs strict). Fix placeholders in the template body or worksheet data.',
    },
    {
      type: 'h2',
      text: 'Campaign basics',
    },
    {
      type: 'p',
      text: 'Create a campaign from the Campaigns tab: choose template and targets (lists or IDs as supported). Scheduling and execution rules follow the API; see Campaigns guide for start/pause/cancel and recipient states.',
    },
  ],
};
