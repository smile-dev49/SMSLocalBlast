import type { DocDefinition } from '../types';

export const mobileGatewayDoc: DocDefinition = {
  slug: 'mobile-gateway',
  title: 'Mobile gateway guide',
  description: 'Device app: login, permissions, Android SMS transport, dispatch, and reporting.',
  category: 'Guides',
  lastUpdated: '2026-04-02',
  tags: ['android', 'device', 'gateway'],
  relatedSlugs: ['operations', 'troubleshooting', 'campaigns'],
  blocks: [
    {
      type: 'h2',
      text: 'Device login',
    },
    {
      type: 'p',
      text: 'Register the device against your organization using the mobile app flow. The API records device metadata, platform, and identifiers. Admin web shows heartbeat and ONLINE/OFFLINE derived state.',
    },
    {
      type: 'h2',
      text: 'Permissions (Android)',
    },
    {
      type: 'p',
      text: 'SMS sending requires runtime SMS permission from the user. Denied permission prevents dispatch; the API may surface failures or “no eligible device” if no device can send.',
    },
    {
      type: 'h2',
      text: 'Dispatch flow',
    },
    {
      type: 'ol',
      items: [
        'API queues outbound messages and selects an eligible device.',
        'Gateway authenticates with device-scoped JWT, pulls work, marks dispatching/dispatched.',
        'Native transport sends SMS; callbacks report sent/delivered/failed where supported.',
      ],
    },
    {
      type: 'h2',
      text: 'iOS limitations',
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'iOS does not allow third-party apps to automate carrier SMS the same way as Android. Treat iOS gateway features as limited or future-facing unless your build explicitly supports a supported transport. Plan capacity around Android devices for production SMS.',
    },
    {
      type: 'h2',
      text: 'Capability checks',
    },
    {
      type: 'p',
      text: 'Use Devices in admin web to confirm status ONLINE, health not CRITICAL, and quotas not exceeded. Operations → device availability summarizes eligible senders.',
    },
  ],
};
