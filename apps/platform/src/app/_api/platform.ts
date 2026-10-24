import { queryOptions } from '@tanstack/react-query';
import {
  identitySchema,
  platformAccessSchema,
  platformInstitutionsSchema,
  platformOperatorsSchema,
} from '@eduos/contracts';
import { apiGet } from '../../lib/api-client';

export const identityQuery = queryOptions({
  queryKey: ['identity'],
  queryFn: ({ signal }) => apiGet('/api/v1/me', identitySchema, signal),
  staleTime: 0,
  retry: false,
});

export const platformAccessQuery = queryOptions({
  queryKey: ['platform', 'access'],
  queryFn: ({ signal }) => apiGet('/api/v1/platform/access', platformAccessSchema, signal),
  staleTime: 0,
  retry: false,
});

export const institutionsQuery = queryOptions({
  queryKey: ['platform', 'institutions'],
  queryFn: ({ signal }) =>
    apiGet('/api/v1/platform/institutions?limit=100&offset=0', platformInstitutionsSchema, signal),
});

export const operatorsQuery = queryOptions({
  queryKey: ['platform', 'operators'],
  queryFn: ({ signal }) =>
    apiGet('/api/v1/platform/operators?limit=100&offset=0', platformOperatorsSchema, signal),
});
