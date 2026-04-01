export interface LaunchChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly detail?: string;
  /** Related help article slug (in-app path /docs/[slug]). */
  readonly docSlug?: string;
}

export interface LaunchChecklistGroup {
  readonly id: string;
  readonly title: string;
  readonly items: readonly LaunchChecklistItem[];
}

export const LAUNCH_CHECKLIST_GROUPS: readonly LaunchChecklistGroup[] = [
  {
    id: 'backend',
    title: 'Backend & data',
    items: [
      {
        id: 'env-api',
        label: 'API environment variables set (DB URL, JWT secrets, CORS, Stripe keys as needed)',
        docSlug: 'environment',
      },
      {
        id: 'migrate',
        label: 'Database migrated to current schema',
        docSlug: 'getting-started',
      },
      {
        id: 'seed',
        label: 'Seed or bootstrap run (roles, demo org) if your deployment relies on it',
        docSlug: 'getting-started',
      },
      {
        id: 'swagger',
        label: 'Swagger enabled in target environment when you want interactive API docs',
        docSlug: 'api',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing',
    items: [
      {
        id: 'stripe',
        label: 'Stripe products/prices and webhook signing secret configured on API',
        docSlug: 'environment',
      },
      {
        id: 'billing-test',
        label: 'Test checkout or portal once; subscription state visible in admin Billing',
        docSlug: 'billing',
      },
    ],
  },
  {
    id: 'mobile',
    title: 'Mobile gateway',
    items: [
      {
        id: 'device-register',
        label: 'At least one device registered and showing ONLINE when the app is active',
        docSlug: 'mobile-gateway',
      },
      {
        id: 'android-sms',
        label: 'Android: default SMS role and runtime permissions granted for transport',
        docSlug: 'mobile-gateway',
      },
      {
        id: 'ios-limit',
        label:
          'iOS: understand automation limits — use admin docs “Current limitations” for honesty',
        docSlug: 'mobile-gateway',
      },
    ],
  },
  {
    id: 'excel',
    title: 'Excel add-in',
    items: [
      {
        id: 'excel-url',
        label: 'VITE_API_BASE_URL points at the same API the admin web uses (/api/v1)',
        docSlug: 'excel-addin',
      },
      {
        id: 'excel-flow',
        label:
          'Sign in, refresh workbook, map columns, import preview, template preview, campaign smoke test',
        docSlug: 'excel-addin',
      },
    ],
  },
  {
    id: 'admin',
    title: 'Admin web',
    items: [
      {
        id: 'admin-url',
        label: 'NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_APP_URL correct for this deployment',
        docSlug: 'environment',
      },
      {
        id: 'admin-login',
        label: 'First-login flow completed; org and role visible under Settings',
        docSlug: 'getting-started',
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    items: [
      {
        id: 'ops-dashboard',
        label: 'Operations screens load (queue summary, stuck messages, device availability)',
        docSlug: 'operations',
      },
      {
        id: 'test-campaign',
        label: 'End-to-end test campaign completed with delivery or clear failure reason',
        docSlug: 'campaigns',
      },
      {
        id: 'messages',
        label: 'Message list inspected for expected statuses; retries/cancel understood',
        docSlug: 'messages',
      },
    ],
  },
];

export interface LaunchReadinessHints {
  readonly devicesSampleOnline: number | null;
  readonly devicesSampleTotal: number | null;
  readonly subscriptionStatus: string | null;
  readonly recentCampaignCount: number | null;
  readonly queueQueuedLike: number | null;
  readonly eligibleDevices: number | null;
  readonly hintsLoading: boolean;
  readonly hintsError: boolean;
}
