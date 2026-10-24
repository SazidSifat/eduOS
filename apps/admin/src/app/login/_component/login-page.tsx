import { AppBrand } from '../../../components/layout/app-brand';
import { ThemeToggle } from '../../../components/layout/theme-toggle';
import { LoginForm } from './login-form';

export function LoginPage() {
  return (
    <div className="auth-page grid min-h-dvh grid-rows-[auto_1fr_auto]">
      <header className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
        <AppBrand />
        <ThemeToggle />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex items-center justify-center px-6 py-12 sm:py-16"
      >
        <section aria-labelledby="login-heading" className="w-full max-w-96">
          <header className="mb-9 space-y-3">
            <h1
              id="login-heading"
              className="text-[28px] font-semibold leading-tight tracking-tight"
            >
              Sign in to EduOS
            </h1>
            <p className="text-base leading-6 text-muted-foreground">
              Use your institution account to continue.
            </p>
          </header>
          <LoginForm />
          <p className="mt-8 border-t border-border pt-6 text-xs leading-5 text-muted-foreground">
            Need access or help with your password? Contact your institution administrator.
          </p>
        </section>
      </main>
      <footer className="px-6 py-6 text-xs text-muted-foreground sm:px-10">
        EduOS · School administration
      </footer>
    </div>
  );
}
