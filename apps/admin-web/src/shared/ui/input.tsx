import type { InputHTMLAttributes, ReactElement } from 'react';

import { cn } from '@/lib/utils';

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>): ReactElement {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500',
        className,
      )}
      {...props}
    />
  );
}
