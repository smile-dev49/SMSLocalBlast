import type { DocDefinition } from '../types';

export const operationsDoc: DocDefinition = {
  slug: 'operations',
  title: 'Operations & monitoring',
  description:
    'Queue summary, stuck messages, dead-letter, device availability, and recovery actions.',
  category: 'Operations',
  lastUpdated: '2026-04-02',
  tags: ['queues', 'support'],
  relatedSlugs: ['troubleshooting', 'campaigns', 'launch-checklist'],
  blocks: [
    {
      type: 'h2',
      text: 'Who can access Operations',
    },
    {
      type: 'p',
      text: 'RBAC requires operations.read (and operations.write for safe recovery actions). Entitlement operations.read must also be true on your plan — free tier may hide operational APIs.',
    },
    {
      type: 'h2',
      text: 'Queue summary',
    },
    {
      type: 'p',
      text: 'Summarizes outbound message counts by coarse states and complements Bull queue lag when queues are enabled. Use it to see backlog vs database reality.',
    },
    {
      type: 'h2',
      text: 'Stuck messages',
    },
    {
      type: 'p',
      text: 'Lists messages stuck in dispatching beyond configured thresholds. Recovery sweep (write permission) requeues or fails per policy.',
    },
    {
      type: 'h2',
      text: 'Dead-letter',
    },
    {
      type: 'p',
      text: 'Messages that exhausted retries or hit dead-letter policy appear here for inspection. Replay may require manual intervention or product-specific tooling.',
    },
    {
      type: 'h2',
      text: 'Device availability',
    },
    {
      type: 'p',
      text: 'Shows counts of all devices vs eligible (online, active, not critical). Low eligible count explains “no eligible device” dispatch failures.',
    },
  ],
};
