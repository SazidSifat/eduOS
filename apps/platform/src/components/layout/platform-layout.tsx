import { useRef } from 'react';
import { Outlet } from '@tanstack/react-router';
import { ChevronRight, LogOut, Menu, Moon, PanelLeft, Sun } from 'lucide-react';
import { Button } from '@eduos/ui';
import { useResolvedTheme, useTheme } from '../../stores/theme-store';
import { Sidebar } from './sidebar';
import { authClient } from '../../app/_api/auth';
import { queryClient } from '../../lib/query-client';
import { useNavigate } from '@tanstack/react-router';

export function PlatformLayout() {
  const navigation = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const dark = useResolvedTheme() === 'dark';
  const setTheme = useTheme((state) => state.setTheme);
  const closeNavigation = () => navigation.current?.close();

  return (
    <div className="platform-shell min-h-dvh bg-[var(--sidebar)] lg:grid lg:grid-cols-[224px_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <aside className="platform-sidebar sticky top-0 hidden h-dvh lg:block">
        <Sidebar />
      </aside>
      <dialog ref={navigation} aria-label="Platform navigation" className="mobile-navigation">
        <Sidebar onNavigate={closeNavigation} onClose={closeNavigation} />
      </dialog>
      <div className="min-w-0 bg-background lg:border-l lg:border-border">
        <header className="flex h-[72px] items-center justify-between gap-3 border-b border-border bg-background px-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3 text-sm">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              className="lg:hidden"
              onClick={() => navigation.current?.showModal()}
            >
              <Menu aria-hidden="true" className="size-5" />
            </Button>
            <PanelLeft
              aria-hidden="true"
              className="hidden size-4 text-muted-foreground lg:block"
              strokeWidth={1.5}
            />
            <span className="hidden text-muted-foreground sm:inline">Workspace</span>
            <ChevronRight
              aria-hidden="true"
              className="hidden size-3 text-muted-foreground sm:block"
            />
            <span className="font-medium">Platform</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Sign out"
              onClick={async () => {
                await authClient.signOut();
                await queryClient.cancelQueries();
                queryClient.clear();
                await navigate({ to: '/login', replace: true });
              }}
            >
              <LogOut aria-hidden="true" className="size-4" strokeWidth={1.5} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={() => setTheme(dark ? 'light' : 'dark')}
            >
              {dark ? (
                <Sun aria-hidden="true" className="size-4" strokeWidth={1.5} />
              ) : (
                <Moon aria-hidden="true" className="size-4" strokeWidth={1.5} />
              )}
            </Button>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto max-w-[1440px] space-y-7 px-5 py-7 sm:px-8 sm:py-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
