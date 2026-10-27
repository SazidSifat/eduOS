import { queryOptions } from '@tanstack/react-query';
import {
  admissionNotificationsSchema,
  admissionSetupSchema,
  candidateDetailSchema,
  candidateListSchema,
  type CandidateListQuery,
} from '@eduos/contracts';
import { apiGet } from '../../../../../lib/api-client';
export const admissionPath = (institutionId: string) =>
  `/api/v1/institutions/${encodeURIComponent(institutionId)}/admissions`;
export const admissionKey = (userId: string, institutionId: string) => [
  'admissions',
  userId,
  institutionId,
];
export { schoolAccessQuery } from '../../_api/queries';
export const admissionSetupQuery = (userId: string, institutionId: string) =>
  queryOptions({
    queryKey: [...admissionKey(userId, institutionId), 'setup'],
    queryFn: ({ signal }) =>
      apiGet(`${admissionPath(institutionId)}/setup`, admissionSetupSchema, signal),
  });
export const candidateListQuery = (
  userId: string,
  institutionId: string,
  query: CandidateListQuery,
) =>
  queryOptions({
    queryKey: [...admissionKey(userId, institutionId), 'list', query],
    queryFn: ({ signal }) =>
      apiGet(
        `${admissionPath(institutionId)}/candidates?${new URLSearchParams(
          Object.entries(query)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)]),
        )}`,
        candidateListSchema,
        signal,
      ),
  });
export const candidateDetailQuery = (userId: string, institutionId: string, candidateId: string) =>
  queryOptions({
    queryKey: [...admissionKey(userId, institutionId), 'detail', candidateId],
    queryFn: ({ signal }) =>
      apiGet(
        `${admissionPath(institutionId)}/candidates/${candidateId}`,
        candidateDetailSchema,
        signal,
      ),
  });
export const notificationsQuery = (userId: string, institutionId: string) =>
  queryOptions({
    queryKey: [...admissionKey(userId, institutionId), 'notifications'],
    queryFn: ({ signal }) =>
      apiGet(`${admissionPath(institutionId)}/notifications`, admissionNotificationsSchema, signal),
    refetchInterval: 30000,
  });
