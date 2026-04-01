import type { DocDefinition } from '../types';

export const messagesDoc: DocDefinition = {
  slug: 'messages',
  title: 'Messages & delivery',
  description: 'Outbound message lifecycle, retries, and what operators should check.',
  category: 'Operations',
  lastUpdated: '2026-04-02',
  tags: ['messages', 'sms'],
  relatedSlugs: ['operations', 'campaigns', 'troubleshooting'],
  blocks: [
    {
      type: 'h2',
      text: 'Lifecycle (simplified)',
    },
    {
      type: 'ul',
      items: [
        'READY → queued for worker',
        'QUEUED / DISPATCHING / DISPATCHED → gateway interaction',
        'SENT / DELIVERED / FAILED / CANCELLED — terminal outcomes',
      ],
    },
    {
      type: 'h2',
      text: 'Inspecting in admin web',
    },
    {
      type: 'p',
      text: 'Open Messages list, filter by campaign or status, then message detail for events and failure codes. Use this to correlate with device logs.',
    },
    {
      type: 'h2',
      text: 'Retries & cancel',
    },
    {
      type: 'p',
      text: 'Retry and cancel require messages.retry / messages.cancel permissions. Policy may cap retries; dead-letter captures exhausted attempts.',
    },
  ],
};
