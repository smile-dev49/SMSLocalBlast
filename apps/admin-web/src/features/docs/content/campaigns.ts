import type { DocDefinition } from '../types';

export const campaignsDoc: DocDefinition = {
  slug: 'campaigns',
  title: 'Campaigns guide',
  description: 'Templates, audiences, preview, scheduling, execution, and interpreting progress.',
  category: 'Guides',
  lastUpdated: '2026-04-02',
  tags: ['campaigns', 'sms'],
  relatedSlugs: ['excel-addin', 'messages', 'operations', 'workflows'],
  blocks: [
    {
      type: 'h2',
      text: 'Building blocks',
    },
    {
      type: 'ul',
      items: [
        'Templates — message body with merge fields (e.g. {{FirstName}}).',
        'Contacts & lists — recipients resolved by targeting rules.',
        'Campaign — ties template + target + schedule + lifecycle (draft → scheduled → processing, etc.).',
      ],
    },
    {
      type: 'h2',
      text: 'Preview flow',
    },
    {
      type: 'p',
      text: 'Preview validates merge fields and estimates segments where supported. Fix template or data before scheduling to reduce skipped recipients.',
    },
    {
      type: 'h2',
      text: 'Scheduling',
    },
    {
      type: 'p',
      text: 'Scheduled campaigns store scheduledAt/timezone. The API validates future times where enforced. Changing schedule may rebuild recipients depending on status.',
    },
    {
      type: 'h2',
      text: 'Start / pause / cancel',
    },
    {
      type: 'p',
      text: 'Start moves eligible campaigns into execution: recipients become READY, outbound messages are generated subject to quotas and billing gates. Pause and cancel are honored per API rules; terminal campaigns cannot be restarted without cloning.',
    },
    {
      type: 'h2',
      text: 'Skipped recipients',
    },
    {
      type: 'p',
      text: 'Recipients may be skipped for missing phone, opt-out, template errors, or policy. Campaign summary and recipient breakdowns in admin show counts by status and skip reasons.',
    },
    {
      type: 'h2',
      text: 'Summary interpretation',
    },
    {
      type: 'ul',
      items: [
        'ready vs sent vs delivered vs failed — funnel through message pipeline.',
        'Stuck counts — see Operations for dispatch stuck thresholds and recovery.',
      ],
    },
  ],
};
