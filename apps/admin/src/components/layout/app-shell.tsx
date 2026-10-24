import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { AppBrand } from './app-brand';
import { ThemeToggle } from './theme-toggle';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <Link
            to="/workspace"
            className="rounded focus-visible:outline-2 focus-visible:outline-ring"
          >
            <AppBrand />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-12">
        {children}
      </main>
    </div>
  );
}
