import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DocsSidebar } from '@/features/docs/components/docs-sidebar';
import { DOC_NAV_ITEMS } from '@/features/docs/registry';

vi.mock('next/navigation', () => ({
  usePathname: () => '/docs/getting-started',
}));

describe('DocsSidebar', () => {
  it('renders nav links for every doc route', () => {
    render(<DocsSidebar />);
    for (const item of DOC_NAV_ITEMS) {
      const link = screen.getByRole('link', { name: item.title });
      expect(link).toHaveAttribute('href', `/docs/${item.slug}`);
    }
  });
});
