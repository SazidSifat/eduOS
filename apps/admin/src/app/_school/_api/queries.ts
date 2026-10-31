import { queryOptions } from '@tanstack/react-query';
import {
  schoolSnapshotSchema,
  schoolCommandResultSchema,
  schoolEvidenceSchema,
  schoolEvidenceInputSchema,
  type SchoolCommand,
} from '@eduos/contracts';
import { apiGet, apiPost } from '../../../lib/api-client';
export const schoolBase = (institutionId: string) =>
  `/api/v1/institutions/${encodeURIComponent(institutionId)}/school`;
export const schoolQuery = (userId: string, institutionId: string) =>
  queryOptions({
    queryKey: ['school', userId, institutionId],
    staleTime: 0,
    queryFn: ({ signal }) => apiGet(schoolBase(institutionId), schoolSnapshotSchema, signal),
  });
export const schoolCommand = (institutionId: string, input: SchoolCommand) =>
  apiPost(`${schoolBase(institutionId)}/commands`, schoolCommandResultSchema, input);
export async function uploadEvidence(institutionId: string, file: File) {
  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result.split(',')[1] ?? '')
        : reject(new Error('Could not read document.'));
    reader.onerror = () => reject(new Error('Could not read document.'));
    reader.readAsDataURL(file);
  });
  const input = schoolEvidenceInputSchema.parse({ name: file.name, mediaType: file.type, content });
  return apiPost(`${schoolBase(institutionId)}/evidence`, schoolEvidenceSchema, input);
}
