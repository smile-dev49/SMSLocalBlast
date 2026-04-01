import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DocPageBySlug } from '@/features/docs/doc-render';

describe('DocPageBySlug', () => {
  it('renders getting-started article', () => {
    render(<DocPageBySlug slug="getting-started" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Getting started' })).toBeInTheDocument();
  });
});
