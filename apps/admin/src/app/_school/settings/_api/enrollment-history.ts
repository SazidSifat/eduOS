import { queryOptions } from '@tanstack/react-query';
import { enrollmentHistorySchema } from '@eduos/contracts';
import { apiGet } from '../../../../lib/api-client';
import { schoolBase } from '../../_api/queries';

export const enrollmentHistoryKey = (userId: string, institutionId: string, enrollmentId: string) =>
  ['enrollment-history', userId, institutionId, enrollmentId] as const;
export const enrollmentHistoryQuery = (
  userId: string,
  institutionId: string,
  enrollmentId: string,
  offset: number,
) =>
  queryOptions({
    queryKey: [...enrollmentHistoryKey(userId, institutionId, enrollmentId), offset],
    queryFn: ({ signal }) =>
      apiGet(
        `${schoolBase(institutionId)}/enrollments/${encodeURIComponent(enrollmentId)}/history?limit=20&offset=${offset}`,
        enrollmentHistorySchema,
        signal,
      ),
  });
