import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { loginSchema, type LoginInput } from '@eduos/contracts';
import { authClient } from '../_api/auth';
import { queryClient } from '../../../lib/query-client';

export function useLoginForm() {
  const navigate = useNavigate();
  const [failure, setFailure] = useState<string | null>(null);
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
      await navigate({ to: '/app', replace: true });
    } catch {
      setFailure('Unable to connect. Please try again.');
    }
  });

  return { form, failure, submit, clearFailure: () => setFailure(null) };
}
