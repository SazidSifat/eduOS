import { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '@eduos/ui';
import { useLoginForm } from './use-login-form';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { form, failure, submit, clearFailure } = useLoginForm();
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  return (
    <form onSubmit={submit} onChange={clearFailure} noValidate aria-busy={isSubmitting}>
      <fieldset disabled={isSubmitting} className="grid min-w-0 gap-6">
        <legend className="sr-only">Institution account credentials</legend>
        <div className="grid gap-2.5">
          <label htmlFor="email" className="text-xs font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@school.edu.bd"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : failure ? 'login-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-xs leading-5 text-destructive">
              Enter a valid email address.
            </p>
          )}
        </div>
        <div className="grid gap-2.5">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="password" className="text-xs font-medium">
              Password
            </label>
            <button
              type="button"
              className="inline-flex min-h-8 items-center gap-1.5 rounded px-1 text-xs text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              aria-controls="password"
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" strokeWidth={1.5} />
              ) : (
                <Eye aria-hidden="true" className="size-4" strokeWidth={1.5} />
              )}
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            minLength={12}
            maxLength={128}
            required
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'password-error' : failure ? 'login-error' : undefined
            }
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className="text-xs leading-5 text-destructive">
              Use 12–128 characters.
            </p>
          )}
        </div>
      </fieldset>
      {failure && (
        <p id="login-error" role="alert" className="mt-4 text-xs leading-5 text-destructive">
          {failure}
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 h-12 w-full justify-between text-base"
      >
        <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
        <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
      </Button>
    </form>
  );
}
