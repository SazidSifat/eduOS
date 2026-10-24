import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-3 px-6 py-14 text-center">
      <Search aria-hidden="true" className="size-5 text-muted-foreground" strokeWidth={1.5} />
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="max-w-sm text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}
