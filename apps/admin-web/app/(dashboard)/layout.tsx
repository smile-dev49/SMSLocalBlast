import type { ReactNode } from 'react';

import { DashboardLayoutClient } from '@/shared/layout/dashboard-layout-client';

export default function DashboardLayout(props: Readonly<{ children: ReactNode }>): ReactNode {
  const { children } = props;
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
