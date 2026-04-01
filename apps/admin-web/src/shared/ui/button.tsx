import type { ButtonHTMLAttributes, ReactElement } from 'react';

import { cn } from '@/lib/utils';

export function Button({
  className,
  variant = 'default',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: 'default' | 'outline' | 'ghost' | 'destructive';
}): ReactElement {
  const variants: Record<typeof variant, string> = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50',
    ghost: 'hover:bg-slate-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
  };
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
