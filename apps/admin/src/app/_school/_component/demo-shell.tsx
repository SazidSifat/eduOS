import { useState } from 'react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { Button } from '@eduos/ui';
import { ThemeToggle } from '../../../components/layout/theme-toggle';
import { DemoProvider, useDemo } from './demo-provider';
import { SignOutButton } from '../../../components/layout/sign-out-button';
import { DemoNavigation } from './demo-navigation';
import { canOpenSchoolPath } from './school-access';
import './demo.css';

export function DemoLayout() {
  return (
    <DemoProvider>
      <DemoShell />
    </DemoProvider>
  );
}
function DemoShell() {
  const { state, snapshot, busy, message } = useDemo();
  const [open, setOpen] = useState(false);
  const path = useLocation().pathname;
  const module = path.split('/')[1] ?? 'admissions';
  return (
    <div className="admissions-app demo-app">
      <header className="demo-mobile-header demo-print-hide">
        <Link to="/admissions" className="demo-brand">
          eduOS
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            aria-expanded={open}
            aria-controls="demo-sidebar"
            aria-label={open ? 'Close school navigation' : 'Open school navigation'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      </header>
      <aside
        id="demo-sidebar"
        className={`demo-sidebar demo-print-hide ${open ? 'demo-sidebar-open' : ''}`}
      >
        <div className="demo-school">
          <Link to="/admissions" className="demo-brand">
            eduOS
          </Link>
          <p className="font-semibold">{state.settings.name}</p>
          <p className="demo-help">Institution {state.settings.code}</p>
        </div>
        <DemoNavigation close={() => setOpen(false)} />
        <div className="demo-account">
          <p className="font-semibold">{snapshot.identity.name}</p>
          <p className="demo-help">{snapshot.identity.role}</p>
          <div className="mt-4 flex items-center justify-between">
            <ThemeToggle />
            <SignOutButton />
          </div>
          <Link
            to="/login"
            preload={false}
            className="mt-3 inline-block text-xs text-muted-foreground hover:text-primary"
          >
            Return to sign in
          </Link>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1} className="demo-main">
        <div className="demo-context demo-print-hide">
          <p>
            School workspace /{' '}
            <span className="capitalize">{module === 'fees' ? 'Fee collection' : module}</span>
          </p>
          <span>
            Session {state.settings.session || 'Not configured'} · {state.settings.timezone}
          </span>
        </div>
        <output
          aria-live="polite"
          className={message ? 'demo-feedback demo-print-hide' : 'sr-only'}
        >
          {message}
        </output>
        <fieldset
          disabled={busy}
          aria-busy={busy}
          className="demo-page min-w-0 border-0 p-0 w-full"
        >
          <div className="demo-page">
            {canOpenSchoolPath(snapshot, path) ? (
              <Outlet />
            ) : (
              <section role="alert">
                <h1>School module unavailable</h1>
                <p>Your role or the school module settings do not grant access to this screen.</p>
                <div className="demo-actions">
                  {(['/attendance', '/fees', '/expenses', '/routine/teacher', '/settings'] as const)
                    .filter((to) => canOpenSchoolPath(snapshot, to))
                    .map((to) => (
                      <Link key={to} to={to}>
                        Open {to.slice(1)}
                      </Link>
                    ))}
                </div>
              </section>
            )}
          </div>
        </fieldset>
      </main>
    </div>
  );
}
