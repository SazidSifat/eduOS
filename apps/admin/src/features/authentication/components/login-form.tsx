import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { loginSchema, type LoginInput } from '@eduos/contracts';
import { Button, Input } from '@eduos/ui';
import { authClient } from '../api/auth-client';
import { queryClient } from '../../../app/providers/query-client';
export function LoginPage() {
  const navigate = useNavigate();
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const submit = handleSubmit(async (values) => {
    setFailure(null);
    try {
      const result = await authClient.signIn.email(values);
      if (result.error) {
        setFailure('Sign in failed. Check your credentials or try again later.');
        return;
      }
      queryClient.clear();
      await navigate({ to: '/workspace' });
    } catch {
      setFailure('Unable to connect. Please try again.');
    }
  });
  return (
    <section className="mx-auto max-w-sm space-y-6">
      <h1 className="text-3xl font-semibold">Sign in to EduOS</h1>
      <p className="text-muted-foreground">Use your institution account.</p>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              Enter a valid email address.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              Use 12–128 characters.
            </p>
          )}
        </div>
        {failure && (
          <p role="alert" className="text-sm text-destructive">
            {failure}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </section>
  );
}
