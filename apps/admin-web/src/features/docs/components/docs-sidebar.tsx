'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactElement } from 'react';

import { cn } from '@/lib/utils';

import type { DocNavItem } from '../types';
import { DOC_NAV_ITEMS } from '../registry';

export function DocsSidebar(): ReactElement {
  const pathname = usePathname();
  const byCategory: Partial<Record<DocNavItem['category'], DocNavItem[]>> = {};
  for (const item of DOC_NAV_ITEMS) {
    const existing = byCategory[item.category] ?? [];
    byCategory[item.category] = [...existing, item];
  }

  return (
    <nav className="w-full shrink-0 space-y-6 md:w-52" aria-label="Help center">
      {(['Start', 'Launch', 'Guides', 'Operations', 'Reference'] as const).map((cat) => {
        const items = byCategory[cat];
        if (!items?.length) return null;
        return (
          <div key={cat}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {cat}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => {
                const href = `/docs/${item.slug}`;
                const active = pathname === href;
                return (
                  <li key={item.slug}>
                    <Link
                      href={href}
                      className={cn(
                        'block rounded-md px-2 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-slate-900 font-medium text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
