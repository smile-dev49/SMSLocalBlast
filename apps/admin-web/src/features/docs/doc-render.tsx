import Link from 'next/link';
import type { ReactElement } from 'react';

import { cn } from '@/lib/utils';

import type { DocBlock, DocDefinition } from './types';
import { getDocBySlug } from './registry';

function BlockView({ block }: Readonly<{ block: DocBlock }>): ReactElement {
  switch (block.type) {
    case 'h2':
      return (
        <h2 className="mt-8 scroll-mt-20 text-xl font-semibold text-slate-900 dark:text-slate-100">
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 className="mt-6 text-lg font-medium text-slate-800 dark:text-slate-200">
          {block.text}
        </h3>
      );
    case 'p':
      return (
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {block.text}
        </p>
      );
    case 'ul':
      return (
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case 'pre':
      return (
        <pre className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-900">
          {block.text}
        </pre>
      );
    case 'callout':
      return (
        <div
          className={cn(
            'mt-4 rounded-lg border px-3 py-2 text-sm',
            block.variant === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100'
              : 'border-sky-200 bg-sky-50 text-sky-950 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100',
          )}
        >
          {block.text}
        </div>
      );
    case 'links':
      return (
        <ul className="mt-3 space-y-1 text-sm">
          {block.items.map((l) => {
            const external = /^https?:\/\//i.test(l.href);
            return (
              <li key={l.href}>
                {external ? (
                  <a
                    className="text-sky-700 underline hover:text-sky-900 dark:text-sky-400"
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    className="text-sky-700 underline hover:text-sky-900 dark:text-sky-400"
                    href={l.href}
                  >
                    {l.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      );
    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

export function DocArticleView({ doc }: Readonly<{ doc: DocDefinition }>): ReactElement {
  return (
    <article className="max-w-3xl">
      <header className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{doc.category}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{doc.title}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{doc.description}</p>
        <p className="mt-2 text-xs text-slate-500">Last updated: {doc.lastUpdated}</p>
        {doc.tags && doc.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {doc.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </header>
      <div className="pb-16 pt-2">
        {doc.blocks.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
      </div>
      {doc.relatedSlugs && doc.relatedSlugs.length > 0 ? (
        <footer className="border-t border-slate-200 pt-6 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Related</p>
          <ul className="mt-2 space-y-1 text-sm">
            {doc.relatedSlugs.map((slug) => {
              const d = getDocBySlug(slug);
              if (!d) return null;
              return (
                <li key={slug}>
                  <Link className="text-sky-700 underline dark:text-sky-400" href={`/docs/${slug}`}>
                    {d.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </footer>
      ) : null}
    </article>
  );
}

export function DocPageBySlug({ slug }: Readonly<{ slug: string }>): ReactElement | null {
  const doc = getDocBySlug(slug);
  if (!doc) return null;
  return <DocArticleView doc={doc} />;
}
