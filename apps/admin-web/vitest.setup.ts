import '@testing-library/jest-dom/vitest';
import { createElement, type ReactNode } from 'react';
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: function MockLink(
    props: Readonly<{ href: string; children: ReactNode; className?: string }>,
  ) {
    const { href, children, className } = props;
    return createElement('a', { href, className }, children);
  },
}));
