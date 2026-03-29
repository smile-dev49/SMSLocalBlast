import { createOrganizationId } from '@sms-localblast/types';
import { PlaceholderPanel } from '@sms-localblast/ui';
import { DashboardShell } from '@/components/dashboard-shell';

const DEMO_TENANT_ID = createOrganizationId('org_placeholder');

export default function AdminDashboardPage() {
  return (
    <DashboardShell>
      <PlaceholderPanel title="Dashboard (placeholder)">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Multi-tenant admin modules will mount here. Data fetching and permissions stay outside UI
          primitives. Example tenant id shape:{' '}
          <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-800">
            {DEMO_TENANT_ID}
          </code>
        </p>
      </PlaceholderPanel>
    </DashboardShell>
  );
}
