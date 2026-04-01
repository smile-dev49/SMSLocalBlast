import Link from 'next/link';
import type { ReactElement } from 'react';

import { DOC_NAV_ITEMS, listDocs } from '@/features/docs/registry';

export function DocsHubView(): ReactElement {
  const articles = listDocs();
  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Help Center</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Operator guides, environment reference, API overview, and troubleshooting for SMS
          LocalBlast. Use the sidebar to jump between topics, or start with Getting started and the
          launch checklist.
        </p>
      </header>
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Launch</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link
              className="text-sky-700 underline dark:text-sky-400"
              href="/docs/launch-checklist"
            >
              Launch checklist — pre-flight tasks and live signals from your org
            </Link>
          </li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">All articles</h2>
        <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
          {articles.map((doc) => (
            <li key={doc.slug} className="py-3 first:pt-0">
              <Link
                href={`/docs/${doc.slug}`}
                className="font-medium text-sky-800 hover:underline dark:text-sky-300"
              >
                {doc.title}
              </Link>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{doc.description}</p>
              <p className="mt-1 text-xs text-slate-500">Updated {doc.lastUpdated}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/40">
        <p className="font-medium text-slate-800 dark:text-slate-200">Browse by section</p>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          The sidebar mirrors this index: {DOC_NAV_ITEMS.map((i) => i.title).join(' · ')}.
        </p>
      </section>
    </div>
  );
}
