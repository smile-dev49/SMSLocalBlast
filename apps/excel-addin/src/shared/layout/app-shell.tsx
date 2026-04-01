import {
  Button,
  FluentProvider,
  Tab,
  TabList,
  Text,
  makeStyles,
  webLightTheme,
} from '@fluentui/react-components';
import { useState } from 'react';

import type { AppRoute } from '@/app/router';
import { appRouteLabels, appRoutes } from '@/app/router';
import { useAuthStore } from '@/core/auth/auth-store';
import { CampaignsScreen } from '@/features/campaigns/components/campaigns-screen';
import { ContactsImportScreen } from '@/features/contacts/components/contacts-import-screen';
import { DashboardScreen } from '@/features/dashboard/components/dashboard-screen';
import { HelpScreen } from '@/features/help/components/help-screen';
import { SettingsScreen } from '@/features/settings/components/settings-screen';
import { TemplatesScreen } from '@/features/templates/components/templates-screen';
import { WorkbookScreen } from '@/features/workbook/components/workbook-screen';

const useStyles = makeStyles({
  root: { padding: '12px' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  content: { marginTop: '10px' },
});

function renderRoute(route: AppRoute): JSX.Element {
  switch (route) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'workbook':
      return <WorkbookScreen />;
    case 'contacts':
      return <ContactsImportScreen />;
    case 'templates':
      return <TemplatesScreen />;
    case 'campaigns':
      return <CampaignsScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'help':
      return <HelpScreen />;
  }
}

export function AppShell(): JSX.Element {
  const classes = useStyles();
  const me = useAuthStore((s) => s.me);
  const logout = useAuthStore((s) => s.logout);
  const [route, setRoute] = useState<AppRoute>('dashboard');

  return (
    <FluentProvider theme={webLightTheme}>
      <div className={classes.root}>
        <header className={classes.header}>
          <div>
            <Text weight="bold">SMS LocalBlast</Text>
            <Text size={200}>{me?.organization?.name ?? 'Workspace'}</Text>
          </div>
          <Button onClick={logout}>Logout</Button>
        </header>
        <TabList
          selectedValue={route}
          onTabSelect={(_, d) => {
            setRoute(d.value as AppRoute);
          }}
        >
          {appRoutes.map((r) => (
            <Tab key={r} value={r}>
              {appRouteLabels[r]}
            </Tab>
          ))}
        </TabList>
        <section className={classes.content}>{renderRoute(route)}</section>
      </div>
    </FluentProvider>
  );
}
