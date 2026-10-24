import type { ReactNode } from 'react';
import { Building2 } from 'lucide-react';
import { AppBrand } from '../../../components/layout/app-brand';
import { ThemeToggle } from '../../../components/layout/theme-toggle';

export function LoginShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page min-h-dvh lg:grid lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.65fr)]">
      <aside
        aria-labelledby="institution-access-heading"
        className="auth-sidebar hidden min-h-dvh flex-col justify-between border-r border-border px-12 py-10 lg:flex"
      >
        <AppBrand />
        <div className="max-w-72 space-y-6 py-16">
          <Building2 aria-hidden="true" className="size-7 text-primary" strokeWidth={1.25} />
          <h2
            id="institution-access-heading"
            className="text-[28px] font-medium leading-tight tracking-tight"
          >
            One account.
            <br />
            Your institutions.
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Use your staff account to access the schools you belong to.
          </p>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">EduOS · School administration</p>
      </aside>
      <div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
        <header className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10 lg:justify-end lg:px-12 lg:py-10">
          <span className="lg:hidden">
            <AppBrand />
          </span>
          <ThemeToggle />
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12"
        >
          <section aria-labelledby="login-heading" className="w-full max-w-96">
            {children}
            <div className="mt-8 border-t border-border pt-6">
              <p className="text-xs font-medium">Need help signing in?</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Contact your institution administrator for account access or password assistance.
              </p>
            </div>
          </section>
        </main>
        <footer className="px-6 py-6 text-xs leading-5 text-muted-foreground sm:px-10 lg:px-12">
          Access is managed by your institution.
        </footer>
      </div>
    </div>
  );
}

export function LoginHeading() {
  return (
    <header className="mb-9 space-y-3">
      <h1 id="login-heading" className="text-[28px] font-semibold leading-tight tracking-tight">
        Sign in to EduOS
      </h1>
      <p className="text-base leading-6 text-muted-foreground">
        Enter your institution account details.
      </p>
    </header>
  );
}
