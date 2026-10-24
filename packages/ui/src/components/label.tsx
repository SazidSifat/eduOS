import type { ComponentProps } from 'react';
import { cn } from '../lib/utils.js';

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return (
    // The composed field label wraps its control in the consuming form.
    // oxlint-disable-next-line jsx-a11y/label-has-associated-control
    <label
      data-slot="label"
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}
