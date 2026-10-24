import { queryOptions } from '@tanstack/react-query';
import { membershipsSchema, workspaceSchema } from '@eduos/contracts';
import { apiGet } from '../../../lib/api-client';

export const membershipsQuery = (userId: string) =>
  queryOptions({
    queryKey: ['memberships', userId],
    queryFn: ({ signal }) => apiGet('/api/v1/memberships', membershipsSchema, signal),
  });

export const workspaceQuery = (userId: string, institutionId: string) =>
  queryOptions({
    queryKey: ['workspace', userId, institutionId],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/institutions/${encodeURIComponent(institutionId)}/workspace`,
        workspaceSchema,
        signal,
      ),
    enabled: Boolean(institutionId),
  });
