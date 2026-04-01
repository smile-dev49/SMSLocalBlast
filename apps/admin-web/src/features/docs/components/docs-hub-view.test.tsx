import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DocsHubView } from '@/features/docs/components/docs-hub-view';
import { listDocs } from '@/features/docs/registry';

describe('DocsHubView', () => {
  it('renders help center title and article links', () => {
    render(<DocsHubView />);
    expect(screen.getByRole('heading', { level: 1, name: 'Help Center' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Launch checklist/ })).toHaveAttribute(
      'href',
      '/docs/launch-checklist',
    );
    for (const doc of listDocs()) {
      expect(screen.getByRole('link', { name: doc.title })).toHaveAttribute(
        'href',
        `/docs/${doc.slug}`,
      );
    }
  });
});
