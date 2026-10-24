import type { ComponentProps } from 'react';
import { cn } from '../lib/utils.js';
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'h-11 w-full rounded-md border border-border bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}
