import type { ReactNode } from 'react';

import { DocsLayoutClient } from '@/features/docs/components/docs-layout-client';

export default function DocsLayout(props: Readonly<{ children: ReactNode }>): ReactNode {
  const { children } = props;
  return <DocsLayoutClient>{children}</DocsLayoutClient>;
}
