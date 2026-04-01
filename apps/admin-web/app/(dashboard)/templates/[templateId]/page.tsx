import type { ReactElement } from 'react';

import { TemplateDetailPage } from '@/features/templates/components/template-detail-page';

export default async function Page(
  props: Readonly<{ params: Promise<{ templateId: string }> }>,
): Promise<ReactElement> {
  const { templateId } = await props.params;
  return <TemplateDetailPage templateId={templateId} />;
}
