import { Link, Outlet } from '@tanstack/react-router';
import { GraduationCap, Moon, Sun } from 'lucide-react';
import { Button } from '@eduos/ui';
import { useTheme } from './providers/theme-provider';
export function RootLayout() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
            <GraduationCap aria-hidden="true" className="size-6 text-primary" />
            EduOS
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-3">
            <Link to="/workspace" className="text-sm underline-offset-4 hover:underline">
              Workspace
            </Link>
            <Button
              variant="outline"
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun aria-hidden="true" className="size-4" />
              ) : (
                <Moon aria-hidden="true" className="size-4" />
              )}
            </Button>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto min-h-[70vh] max-w-5xl px-6 py-12">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-5xl px-6 py-6 text-sm text-muted-foreground">
        EduOS · School administration, thoughtfully connected.
      </footer>
    </>
  );
}
