import type { ComponentProps, ElementType } from 'react';
import { cn } from '../lib/utils.js';

type CardProps<T extends ElementType> = { as?: T } & Omit<ComponentProps<T>, 'as'>;

export function Card<T extends ElementType = 'div'>({ as, className, ...props }: CardProps<T>) {
  const Component = as ?? 'div';
  return (
    <Component
      data-slot="card"
      className={cn('rounded-lg border border-border bg-card text-card-foreground', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  );
}

export function CardTitle({ className, children, ...props }: ComponentProps<'h2'>) {
  return (
    <h2 data-slot="card-title" className={cn('font-semibold leading-none', className)} {...props}>
      {children}
    </h2>
  );
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('p-6 pt-0', className)} {...props} />;
}
