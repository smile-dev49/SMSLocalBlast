import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlaceholderPanel } from './PlaceholderPanel';

describe('PlaceholderPanel', () => {
  it('renders title', () => {
    render(<PlaceholderPanel title="Hello" />);
    expect(screen.getByText('Hello')).toBeTruthy();
  });
});
