import Link from 'next/link';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { LAUNCH_CHECKLIST_GROUPS, type LaunchReadinessHints } from '../launch-checklist-model';

function HintLine({ hints }: Readonly<{ hints: LaunchReadinessHints }>): ReactElement {
  if (hints.hintsLoading) {
    return <p className="text-sm text-slate-500">Loading live signals…</p>;
  }
  if (hints.hintsError) {
    return (
      <p className="text-sm text-amber-800 dark:text-amber-200">
        Some signals could not be loaded (permissions or API). Complete the static checklist and
        verify in the app.
      </p>
    );
  }

  const parts: string[] = [];
  if (hints.devicesSampleTotal !== null) {
    parts.push(
      `Devices (sample): ${String(hints.devicesSampleOnline ?? 0)} online of ${String(hints.devicesSampleTotal)} listed`,
    );
  }
  if (hints.eligibleDevices !== null) {
    parts.push(`Eligible senders (ops): ${String(hints.eligibleDevices)}`);
  }
  if (hints.subscriptionStatus !== null) {
    parts.push(`Billing status: ${hints.subscriptionStatus}`);
  }
  if (hints.recentCampaignCount !== null) {
    parts.push(`Campaigns (total, first page scope): ${String(hints.recentCampaignCount)}`);
  }
  if (hints.queueQueuedLike !== null) {
    parts.push(
      `Queued / pending / scheduled messages (queue snapshot): ${String(hints.queueQueuedLike)}`,
    );
  }

  if (parts.length === 0) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Sign in with roles that include devices, billing, campaigns, or operations read to see live
        hints here.
      </p>
    );
  }

  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
      {parts.map((p) => (
        <li key={p}>{p}</li>
      ))}
    </ul>
  );
}

export function LaunchChecklistContent({
  hints,
}: Readonly<{ hints: LaunchReadinessHints }>): ReactElement {
  const [checked, setChecked] = useState<Readonly<Record<string, boolean>>>({});

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-3xl space-y-10 pb-16">
      <header className="border-b border-slate-200 pb-4 dark:border-slate-800">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Launch</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Launch checklist</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Use this before go-live. Checkboxes are stored only in this browser session. Pair with{' '}
          <Link className="text-sky-700 underline dark:text-sky-400" href="/docs/getting-started">
            Getting started
          </Link>{' '}
          and{' '}
          <Link className="text-sky-700 underline dark:text-sky-400" href="/docs/environment">
            Environment reference
          </Link>
          .
        </p>
      </header>

      <section
        className="rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/50 dark:bg-sky-950/30"
        aria-labelledby="live-signals-heading"
      >
        <h2
          id="live-signals-heading"
          className="text-sm font-semibold text-sky-950 dark:text-sky-100"
        >
          Live signals
        </h2>
        <p className="mt-1 text-xs text-sky-900/80 dark:text-sky-200/80">
          Non-authoritative hints from the API. Always confirm in Devices, Billing, Campaigns, and
          Operations.
        </p>
        <div className="mt-3">
          <HintLine hints={hints} />
        </div>
      </section>

      {LAUNCH_CHECKLIST_GROUPS.map((group) => (
        <section key={group.id}>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {group.title}
          </h2>
          <ul className="mt-4 space-y-3">
            {group.items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <input
                  id={`chk-${item.id}`}
                  type="checkbox"
                  checked={Boolean(checked[item.id])}
                  onChange={() => {
                    toggle(item.id);
                  }}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
                />
                <div className="min-w-0">
                  <label
                    htmlFor={`chk-${item.id}`}
                    className="text-sm font-medium text-slate-900 dark:text-slate-100"
                  >
                    {item.label}
                  </label>
                  {item.detail ? (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{item.detail}</p>
                  ) : null}
                  {item.docSlug ? (
                    <p className="mt-2 text-xs">
                      <Link
                        className="text-sky-700 underline dark:text-sky-400"
                        href={`/docs/${item.docSlug}`}
                      >
                        Open guide: {item.docSlug.replace(/-/g, ' ')}
                      </Link>
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer className="border-t border-slate-200 pt-6 text-sm dark:border-slate-800">
        <p className="text-slate-600 dark:text-slate-400">
          After green checks, run a small real-device test and keep{' '}
          <Link className="text-sky-700 underline dark:text-sky-400" href="/docs/troubleshooting">
            Troubleshooting
          </Link>{' '}
          handy for operators.
        </p>
      </footer>
    </div>
  );
}
