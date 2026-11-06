import { useLanguage } from '@eduos/ui';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { ThemeToggle } from '../../../components/layout/theme-toggle';
import { DemoProvider, useDemo } from './demo-provider';
import { SignOutButton } from '../../../components/layout/sign-out-button';
import { DemoNavigation } from './demo-navigation';
import { SchoolBottomNav } from './school-bottom-nav';
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
  const { t } = useLanguage();
  const { state, snapshot, busy, message } = useDemo();
  const path = useLocation().pathname;
  const module = path.split('/')[1] ?? 'admissions';

  return (
    <div className="admissions-app demo-app">
      {/* Desktop sticky sidebar — hidden on mobile via responsive.css */}
      <aside id="demo-sidebar" className="demo-sidebar demo-print-hide">
        <div className="demo-school">
          <Link to="/admissions" className="demo-brand">
            eduOS
          </Link>
          <p className="font-semibold">{state.settings.name}</p>
          <p className="demo-help">
            {t('Institution')} {state.settings.code}
          </p>
        </div>
        <DemoNavigation close={() => {}} />
        <div className="demo-account">
          <p className="font-semibold">{snapshot.identity.name}</p>
          <p className="demo-help">{t(snapshot.identity.role)}</p>
          <div className="mt-4 flex items-center justify-between">
            <ThemeToggle />
            <SignOutButton />
          </div>
          <Link
            to="/login"
            preload={false}
            className="mt-3 inline-block text-xs text-muted-foreground hover:text-primary"
          >
            {t('Return to sign in')}{' '}
          </Link>
        </div>
      </aside>

      <main id="main-content" tabIndex={-1} className="demo-main">
        <div className="demo-context demo-print-hide">
          <p>
            {t('School workspace /')}{' '}
            <span className="capitalize">
              {module === 'fees' ? t('Fee collection') : t(module)}
            </span>
          </p>
          <span>
            {t('Session')} {state.settings.session || t('Not configured')} ·{' '}
            {state.settings.timezone}
          </span>
        </div>
        <output
          aria-live="polite"
          className={message ? 'demo-feedback demo-print-hide' : 'sr-only'}
        >
          {t(message)}
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
                <h1>{t('School module unavailable')}</h1>
                <p>
                  {t('Your role or the school module settings do not grant access to this screen.')}
                </p>
                <div className="demo-actions">
                  {(['/attendance', '/fees', '/expenses', '/routine/teacher', '/settings'] as const)
                    .filter((to) => canOpenSchoolPath(snapshot, to))
                    .map((to) => (
                      <Link key={to} to={to}>
                        {t('Open')} {to.slice(1)}
                      </Link>
                    ))}
                </div>
              </section>
            )}
          </div>
        </fieldset>
      </main>

      {/* Mobile bottom navigation — rendered via portal, shown via CSS at < 900px */}
      <SchoolBottomNav />
    </div>
  );
}
