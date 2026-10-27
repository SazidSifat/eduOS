import { queryOptions } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { identitySchema } from '@eduos/contracts';
import { ApiError, apiGet } from '../../../lib/api-client';
import { queryClient } from '../../../lib/query-client';

export const identityQuery = queryOptions({
  queryKey: ['identity'],
  queryFn: ({ signal }) => apiGet('/api/v1/me', identitySchema, signal),
  staleTime: 0,
  retry: false,
});

export async function requireIdentity() {
  try {
    return await queryClient.fetchQuery(identityQuery);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401)
      throw redirect({ to: '/login', replace: true });
    throw error;
  }
}

export async function redirectAuthenticatedUser() {
  try {
    await queryClient.fetchQuery(identityQuery);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return;
    throw error;
  }
  throw redirect({ to: '/app', replace: true });
}
