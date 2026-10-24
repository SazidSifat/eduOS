import { queryOptions } from '@tanstack/react-query';
import { identitySchema, membershipsSchema } from '@eduos/contracts';
import { apiGet } from '../../../lib/api-client';
export const identityQuery = queryOptions({
  queryKey: ['identity'],
  queryFn: ({ signal }) => apiGet('/api/v1/me', identitySchema, signal),
  staleTime: 0,
  retry: false,
});
export const membershipsQuery = (userId: string) =>
  queryOptions({
    queryKey: ['memberships', userId],
    queryFn: ({ signal }) => apiGet('/api/v1/memberships', membershipsSchema, signal),
  });
