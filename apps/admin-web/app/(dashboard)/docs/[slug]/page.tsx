import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';

import { DocArticleView } from '@/features/docs/doc-render';
import { LaunchChecklistView } from '@/features/docs/components/launch-checklist-view';
import {
  DOC_NAV_ITEMS,
  INTERACTIVE_DOC_SLUGS,
  getDocBySlug,
  isKnownDocSlug,
} from '@/features/docs/registry';

export function generateStaticParams(): { slug: string }[] {
  return DOC_NAV_ITEMS.map((item) => ({ slug: item.slug }));
}

export default async function DocsArticlePage(
  props: Readonly<{ params: Promise<{ slug: string }> }>,
): Promise<ReactElement> {
  const { slug } = await props.params;
  if (!isKnownDocSlug(slug)) {
    notFound();
  }
  if (INTERACTIVE_DOC_SLUGS.has(slug)) {
    return <LaunchChecklistView />;
  }
  const doc = getDocBySlug(slug);
  if (!doc) {
    notFound();
  }
  return <DocArticleView doc={doc} />;
}
