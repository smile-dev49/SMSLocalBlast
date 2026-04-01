export type AppRoute =
  | 'dashboard'
  | 'workbook'
  | 'contacts'
  | 'templates'
  | 'campaigns'
  | 'settings'
  | 'help';

export const appRoutes: AppRoute[] = [
  'dashboard',
  'workbook',
  'contacts',
  'templates',
  'campaigns',
  'settings',
  'help',
];

export const appRouteLabels: Record<AppRoute, string> = {
  dashboard: 'Dashboard',
  workbook: 'Workbook',
  contacts: 'Contacts',
  templates: 'Templates',
  campaigns: 'Campaigns',
  settings: 'Settings',
  help: 'Help',
};
