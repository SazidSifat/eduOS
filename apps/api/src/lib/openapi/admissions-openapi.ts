import { z } from 'zod';
import {
  admissionNotificationsSchema,
  admissionSettingsInputSchema,
  admissionSettingsSchema,
  admissionSetupSchema,
  candidateActionSchema,
  candidateCreateSchema,
  candidateDetailSchema,
  candidateListSchema,
  errorSchema,
  offeringInputSchema,
  offeringSchema,
  monthlyCollectionSchema,
  stopMonthlyBillingSchema,
} from '@eduos/contracts';
import { json, protectedErrors, response } from './openapi-helpers.js';
const base = '/api/v1/institutions/{institutionId}/admissions';
const institution = {
  in: 'path',
  name: 'institutionId',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
function operation(
  summary: string,
  output: z.ZodType,
  input?: z.ZodType,
  id?: 'candidateId' | 'notificationId',
  created = false,
) {
  return {
    summary,
    security: [{ session: [] }],
    parameters: [
      institution,
      ...(id
        ? [{ in: 'path', name: id, required: true, schema: { type: 'string', format: 'uuid' } }]
        : []),
    ],
    ...(input ? { requestBody: { required: true, content: json(input) } } : {}),
    responses: {
      [created ? 201 : 200]: response('Authorized result', output),
      400: response('Invalid request or incomplete admission', errorSchema),
      409: response('Stale version, duplicate enrollment or operation-key conflict', errorSchema),
      ...protectedErrors,
    },
  };
}
export const admissionsPaths = {
  [`${base}/setup`]: {
    get: operation(
      'Admission settings, permitted assignees and real class/session offerings',
      admissionSetupSchema,
    ),
  },
  [`${base}/settings`]: {
    put: operation(
      'Admin/Principal updates versioned fee and reminder settings',
      admissionSettingsSchema,
      admissionSettingsInputSchema,
    ),
  },
  [`${base}/offerings`]: {
    post: operation(
      'Admin/Principal adds a school class/session offering',
      offeringSchema,
      offeringInputSchema,
      undefined,
      true,
    ),
  },
  [`${base}/candidates`]: {
    get: {
      ...operation(
        'Assigned candidate list; Admin/Principal can inspect the institution',
        candidateListSchema,
      ),
      parameters: [
        institution,
        {
          in: 'query',
          name: 'state',
          schema: {
            type: 'string',
            enum: ['follow_up', 'willing', 'admitted', 'closed'],
            default: 'follow_up',
          },
        },
        {
          in: 'query',
          name: 'due',
          schema: { type: 'string', enum: ['all', 'today', 'upcoming', 'overdue'], default: 'all' },
        },
        { in: 'query', name: 'search', schema: { type: 'string', maxLength: 100 } },
        { in: 'query', name: 'offeringId', schema: { type: 'string', format: 'uuid' } },
        { in: 'query', name: 'assigneeId', schema: { type: 'string', format: 'uuid' } },
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 25 },
        },
        {
          in: 'query',
          name: 'offset',
          schema: { type: 'integer', minimum: 0, maximum: 100000, default: 0 },
        },
      ],
    },
    post: operation(
      'Create candidate; collect itemized admission fees and schedule monthly billing atomically',
      candidateDetailSchema,
      candidateCreateSchema,
      undefined,
      true,
    ),
  },
  [`${base}/candidates/{candidateId}`]: {
    get: operation(
      'Candidate details, identity information, receipts and history',
      candidateDetailSchema,
      undefined,
      'candidateId',
    ),
  },
  [`${base}/candidates/{candidateId}/actions`]: {
    post: operation(
      'Version-checked call, transition, edit or itemized admission confirmation with monthly schedules',
      candidateDetailSchema,
      candidateActionSchema,
      'candidateId',
    ),
  },
  [`${base}/candidates/{candidateId}/monthly-charges/{chargeId}/collect`]: {
    post: {
      ...operation(
        'Collect an assigned candidate monthly charge in cash; retries return the existing receipt',
        candidateDetailSchema,
        monthlyCollectionSchema,
        'candidateId',
      ),
      parameters: [
        institution,
        ...['candidateId', 'chargeId'].map((name) => ({
          in: 'path',
          name,
          required: true,
          schema: { type: 'string', format: 'uuid' },
        })),
      ],
    },
  },
  [`${base}/candidates/{candidateId}/monthly-schedules/{scheduleId}/stop`]: {
    post: {
      ...operation(
        'Admin/Principal stops future monthly charges while preserving posted balances and receipts',
        candidateDetailSchema,
        stopMonthlyBillingSchema,
        'candidateId',
      ),
      parameters: [
        institution,
        ...['candidateId', 'scheduleId'].map((name) => ({
          in: 'path',
          name,
          required: true,
          schema: { type: 'string', format: 'uuid' },
        })),
      ],
    },
  },
  [`${base}/notifications`]: {
    get: operation(
      'Current recipient follow-up notifications; maximum 100',
      admissionNotificationsSchema,
    ),
  },
  [`${base}/notifications/{notificationId}/read`]: {
    put: operation(
      'Mark an owned notification read',
      z.object({ ok: z.literal(true) }),
      undefined,
      'notificationId',
    ),
  },
};
