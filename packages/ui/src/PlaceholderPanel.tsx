import type { ReactNode } from 'react';

export interface PlaceholderPanelProps {
  readonly title: string;
  readonly children?: ReactNode;
}

/** Presentational shell only — no data fetching or domain logic. */
export function PlaceholderPanel({ title, children }: PlaceholderPanelProps): ReactNode {
  return (
    <section data-testid="placeholder-panel">
      <header>
        <h2>{title}</h2>
      </header>
      <div>{children}</div>
    </section>
  );
}
