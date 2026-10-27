import { useState } from 'react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { Menu, RotateCcw, X } from 'lucide-react';
import { Button } from '@eduos/ui';
import { ThemeToggle } from '../../../components/layout/theme-toggle';
import { DemoProvider, useDemo } from './demo-provider';
import { DemoNavigation } from './demo-navigation';
import './demo.css';

export function DemoLayout() {
  return (
    <DemoProvider>
      <DemoShell />
    </DemoProvider>
  );
}
function DemoShell() {
  const { state, dispatch, message, notify } = useDemo();
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
          <p className="demo-help">Institution SCH-042 · Dhaka</p>
        </div>
        <DemoNavigation close={() => setOpen(false)} />
        <div className="demo-account">
          <p className="font-semibold">Nusrat Ahmed</p>
          <p className="demo-help">Institution Admin · Demo</p>
          <div className="mt-4 flex items-center justify-between">
            <ThemeToggle />
            <Button
              variant="ghost"
              aria-label="Reset demo data"
              onClick={() => {
                dispatch({ type: 'reset' });
                notify('Demo data reset. The original synthetic examples are restored.');
              }}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Reset demo
            </Button>
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
          <span>Session {state.settings.session} · Asia/Dhaka</span>
        </div>
        <div className="demo-preview-banner demo-print-hide">
          <strong>Demo data</strong>
          <span>Synthetic school records. Changes stay in this tab and reset on reload.</span>
        </div>
        <output
          aria-live="polite"
          className={message ? 'demo-feedback demo-print-hide' : 'sr-only'}
        >
          {message}
        </output>
        <div className="demo-page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
