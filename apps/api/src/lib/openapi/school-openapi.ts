import {
  schoolSnapshotSchema,
  schoolCommandSchema,
  schoolCommandResultSchema,
  schoolEvidenceInputSchema,
  schoolEvidenceSchema,
  errorSchema,
  enrollmentHistorySchema,
} from '@eduos/contracts';
import { json, response, protectedErrors } from './openapi-helpers.js';
const security = [{ session: [] }];
const parameters = [
  { in: 'path', name: 'institutionId', required: true, schema: { type: 'string', format: 'uuid' } },
];
const errors = {
  ...protectedErrors,
  400: response('Invalid input', errorSchema),
  409: response('Stale revision or invalid transition', errorSchema),
};
export const schoolPaths = {
  '/api/v1/institutions/{institutionId}/school/enrollments/{enrollmentId}/history': {
    get: {
      security,
      description:
        'Academics managers read tenant-scoped enrollment date history, newest first. Current membership and Academics entitlement are required.',
      parameters: [
        ...parameters,
        {
          in: 'path',
          name: 'enrollmentId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
        {
          in: 'query',
          name: 'offset',
          schema: { type: 'integer', minimum: 0, maximum: 100000, default: 0 },
        },
      ],
      responses: {
        200: response('Enrollment date history page', enrollmentHistorySchema),
        ...errors,
      },
    },
  },
  '/api/v1/institutions/{institutionId}/school': {
    get: {
      security,
      parameters,
      responses: { 200: response('Authorized school snapshot', schoolSnapshotSchema), ...errors },
    },
  },
  '/api/v1/institutions/{institutionId}/school/commands': {
    post: {
      security,
      parameters,
      description:
        'Commits a validated school action. Enrollment date changes require academics.manage and Academics entitlement, explicit nullable start/end dates and a reason. Known boundaries are inclusive; null means unknown. Date edits cannot exclude submitted attendance.',
      requestBody: { required: true, content: json(schoolCommandSchema) },
      responses: { 200: response('Committed operation', schoolCommandResultSchema), ...errors },
    },
  },
  '/api/v1/institutions/{institutionId}/school/evidence': {
    post: {
      security,
      parameters,
      requestBody: { required: true, content: json(schoolEvidenceInputSchema) },
      responses: {
        201: response('Uploaded supporting document', schoolEvidenceSchema),
        413: response('Document exceeds 5 MB', errorSchema),
        ...errors,
      },
    },
  },
  '/api/v1/institutions/{institutionId}/school/evidence/{evidenceId}': {
    get: {
      security,
      parameters: [
        ...parameters,
        {
          in: 'path',
          name: 'evidenceId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        200: {
          description: 'Authenticated supporting document download',
          content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
        },
        ...errors,
      },
    },
  },
};
