import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginInput } from '@eduos/contracts';
import { Button, Input } from '@eduos/ui';
import { authClient } from '../../_api/auth';
import { queryClient } from '../../../lib/query-client';

export function LoginPage() {
  const navigate = useNavigate();
  const [failure, setFailure] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const submit = form.handleSubmit(async (values) => {
    setFailure(null);
    try {
      const result = await authClient.signIn.email(values);
      if (result.error) {
        setFailure('Sign in failed. Check your credentials or try again later.');
        return;
      }
      await queryClient.cancelQueries();
      queryClient.clear();
      await navigate({ to: '/', replace: true });
    } catch {
      setFailure('Unable to connect. Please try again.');
    }
  });
  const { errors, isSubmitting } = form.formState;

  return (
    <main className="auth-page grid min-h-dvh lg:grid-cols-[minmax(280px,0.8fr)_1.2fr]">
      <aside className="flex flex-col justify-between border-b border-border bg-muted/40 p-8 lg:border-r lg:border-b-0 lg:p-12">
        <a href="/" className="text-base font-semibold tracking-tight">
          EduOS / Platform
        </a>
        <div className="max-w-sm py-12">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
            Control plane
          </p>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">Platform access</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Sign in with an account provisioned as a Super Admin or Platform Manager. Institution
            accounts do not grant platform access.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">EduOS · Bangladesh</p>
      </aside>
      <section className="grid place-items-center p-6 sm:p-10">
        <form
          onSubmit={submit}
          onChange={() => setFailure(null)}
          noValidate
          className="w-full max-w-sm"
        >
          <div className="mb-8 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">Use your platform operator account.</p>
          </div>
          <fieldset disabled={isSubmitting} className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-xs font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...form.register('email')}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive">
                  Enter a valid email address.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium">
                  Password
                </label>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded px-1 text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                  aria-controls="password"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-4" />
                  ) : (
                    <Eye aria-hidden="true" className="size-4" />
                  )}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                minLength={12}
                maxLength={128}
                required
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...form.register('password')}
              />
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive">
                  Use 12–128 characters.
                </p>
              )}
            </div>
          </fieldset>
          {failure && (
            <p role="alert" className="mt-4 text-xs leading-5 text-destructive">
              {failure}
            </p>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-7 h-11 w-full justify-between"
          >
            <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          <p className="mt-6 text-xs leading-5 text-muted-foreground">
            Access is assigned by a Super Admin. Contact your organization administrator if you need
            an account.
          </p>
        </form>
      </section>
    </main>
  );
}
