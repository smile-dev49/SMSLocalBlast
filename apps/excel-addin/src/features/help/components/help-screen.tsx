import { Button, Card, Link, Text } from '@fluentui/react-components';
import type { ReactElement } from 'react';

import { runtimeConfig } from '@/core/config/env';

export function HelpScreen(): ReactElement {
  const fullDocsUrl = runtimeConfig.adminHelpUrl;

  return (
    <Card>
      <Text size={500} weight="semibold">
        Help & quick start
      </Text>
      <Text className="block" style={{ marginTop: 8 }}>
        Use the workbook tab to load sheet data, then map phone and name columns under Contacts.
        Preview imports before confirming. Templates need worksheet column headers to match merge
        fields (e.g. firstName); use Preview with a row index to catch missing variables early.
        Campaigns combine templates, lists, and scheduling from the admin web—this add-in is for
        preparation and preview on the sheet.
      </Text>
      <Text weight="semibold" style={{ marginTop: 16 }}>
        Quick checklist
      </Text>
      <ul style={{ marginTop: 8, paddingLeft: 20 }}>
        <li>
          <Text>Sign in from Settings with the same API base your admin uses.</Text>
        </li>
        <li>
          <Text>Refresh worksheet after editing cells so row data is current.</Text>
        </li>
        <li>
          <Text>Map phone (required) and optional name/email columns before preview.</Text>
        </li>
        <li>
          <Text>Template preview: pick a template, set row index, then render preview.</Text>
        </li>
        <li>
          <Text>
            Campaign basics: finalize lists and schedules in admin web if execution is gated there.
          </Text>
        </li>
      </ul>
      <Text className="block" style={{ marginTop: 16 }}>
        Full operator guides (environment, mobile gateway, troubleshooting, launch checklist) live
        in the admin Help Center.
      </Text>
      <Button
        appearance="primary"
        style={{ marginTop: 12 }}
        onClick={() => {
          window.open(fullDocsUrl, '_blank', 'noopener,noreferrer');
        }}
      >
        Open Help Center in browser
      </Button>
      <Text className="block" style={{ marginTop: 8 }} size={200}>
        URL:{' '}
        <Link href={fullDocsUrl} target="_blank" rel="noreferrer">
          {fullDocsUrl}
        </Link>{' '}
        (set <code>VITE_ADMIN_HELP_URL</code> if not using default localhost admin.)
      </Text>
      <Text className="block" style={{ marginTop: 16 }} size={200}>
        Current limitations: iOS cannot replace Android as the default SMS transport; see admin docs
        Mobile gateway for platform expectations.
      </Text>
    </Card>
  );
}
