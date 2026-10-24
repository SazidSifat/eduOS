import { queryOptions } from '@tanstack/react-query';
import {
  identitySchema,
  platformAccessSchema,
  platformInstitutionCreateSchema,
  platformInstitutionModulesSchema,
  platformInstitutionSchema,
  platformInstitutionStatusSchema,
  platformInstitutionSubscriptionInputSchema,
  platformInstitutionSubscriptionSchema,
  platformInstitutionsSchema,
  platformOperatorsSchema,
  platformSubscriptionsSchema,
} from '@eduos/contracts';
import { apiGet, apiPost, apiPut } from '../../lib/api-client';

export function createInstitution(input: unknown) {
  const values = platformInstitutionCreateSchema.parse(input);
  return apiPost('/api/v1/platform/institutions', platformInstitutionSchema, values);
}

export function updateInstitutionStatus(institutionId: string, input: unknown) {
  const values = platformInstitutionStatusSchema.parse(input);
  return apiPut(
    `/api/v1/platform/institutions/${encodeURIComponent(institutionId)}/status`,
    platformInstitutionSchema,
    values,
  );
}

export function updateInstitutionModules(institutionId: string, input: unknown) {
  const values = platformInstitutionModulesSchema.parse(input);
  return apiPut(
    `/api/v1/platform/institutions/${encodeURIComponent(institutionId)}/modules`,
    platformInstitutionSchema,
    values,
  );
}

export function updateInstitutionSubscription(institutionId: string, input: unknown) {
  const values = platformInstitutionSubscriptionInputSchema.parse(input);
  return apiPut(
    `/api/v1/platform/institutions/${encodeURIComponent(institutionId)}/subscription`,
    platformInstitutionSubscriptionSchema,
    values,
  );
}

export function institutionQuery(institutionId: string) {
  return queryOptions({
    queryKey: ['platform', 'institution', institutionId],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/platform/institutions/${encodeURIComponent(institutionId)}`,
        platformInstitutionSchema,
        signal,
      ),
  });
}

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

export const subscriptionsQuery = queryOptions({
  queryKey: ['platform', 'subscriptions'],
  queryFn: ({ signal }) =>
    apiGet(
      '/api/v1/platform/subscriptions?limit=100&offset=0',
      platformSubscriptionsSchema,
      signal,
    ),
});

export function institutionSubscriptionQuery(institutionId: string) {
  return queryOptions({
    queryKey: ['platform', 'subscription', institutionId],
    queryFn: ({ signal }) =>
      apiGet(
        `/api/v1/platform/institutions/${encodeURIComponent(institutionId)}/subscription`,
        platformInstitutionSubscriptionSchema.nullable(),
        signal,
      ),
  });
}
