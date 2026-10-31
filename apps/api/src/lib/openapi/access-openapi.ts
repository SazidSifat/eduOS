import type { z } from 'zod';
import {
  accessSchema,
  rolesSchema,
  membersSchema,
  memberSchema,
  membershipStateSchema,
  platformAccessSchema,
  platformInstitutionsSchema,
  platformInstitutionCreateSchema,
  platformInstitutionSchema,
  platformInstitutionStatusSchema,
  platformInstitutionModulesSchema,
  platformInstitutionSubscriptionInputSchema,
  platformInstitutionSubscriptionSchema,
  platformSubscriptionsSchema,
  platformOperatorsSchema,
  platformOperatorSchema,
  platformOperatorStateSchema,
  errorSchema,
} from '@eduos/contracts';
import { json, protectedErrors, response } from './openapi-helpers.js';

const institutionId = {
  in: 'path',
  name: 'institutionId',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const userId = {
  in: 'path',
  name: 'userId',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};
const pagination = [
  {
    in: 'query',
    name: 'limit',
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
  },
  {
    in: 'query',
    name: 'offset',
    schema: { type: 'integer', minimum: 0, maximum: 100000, default: 0 },
  },
];
const invalidInput = { 400: response('Invalid request', errorSchema) };
const mutationErrors = {
  ...invalidInput,
  413: response('Request body too large', errorSchema),
};
const missingInstitution = { 404: response('Institution not found', errorSchema) };
function read(description: string, schema: z.ZodType, missing = false) {
  return {
    security: [{ session: [] }],
    responses: {
      200: response(description, schema),
      ...invalidInput,
      ...protectedErrors,
      ...(missing ? missingInstitution : {}),
    },
  };
}
function write(
  description: string,
  input: z.ZodType,
  output: z.ZodType,
  options: { continuity?: boolean; missing?: boolean } = {},
) {
  return {
    security: [{ session: [] }],
    requestBody: { required: true, content: json(input) },
    responses: {
      200: response(description, output),
      ...mutationErrors,
      ...protectedErrors,
      ...(options.continuity
        ? { 409: response('Cannot remove the last active administrator', errorSchema) }
        : {}),
      ...(options.missing ? missingInstitution : {}),
    },
  };
}
export const accessPaths = {
  '/api/v1/institutions/{institutionId}/access': {
    get: {
      ...read('Current institution role and effective permissions', accessSchema),
      parameters: [institutionId],
    },
  },
  '/api/v1/institutions/{institutionId}/roles': {
    get: { ...read('Institution role catalog', rolesSchema), parameters: [institutionId] },
  },
  '/api/v1/institutions/{institutionId}/memberships': {
    get: {
      ...read('Memberships visible to Admin or Principal', membersSchema),
      parameters: [institutionId, ...pagination],
    },
  },
  '/api/v1/institutions/{institutionId}/memberships/{userId}': {
    put: {
      ...write(
        'Set role and active state of an existing institution membership',
        membershipStateSchema,
        memberSchema,
        { continuity: true },
      ),
      parameters: [institutionId, userId],
    },
  },
  '/api/v1/platform/access': {
    get: read('Current platform role and effective permissions', platformAccessSchema),
  },
  '/api/v1/platform/institutions': {
    get: {
      ...read('Institution metadata visible to platform staff', platformInstitutionsSchema),
      parameters: [
        ...pagination,
        {
          in: 'query',
          name: 'code',
          required: false,
          description: 'Exact six-digit institution code. Lookup is applied before pagination.',
          schema: { type: 'string', pattern: '^[1-9][0-9]{5}$' },
        },
      ],
    },
    post: {
      security: [{ session: [] }],
      requestBody: { required: true, content: json(platformInstitutionCreateSchema) },
      responses: {
        201: response(
          'Institution and first school Admin created atomically',
          platformInstitutionSchema,
        ),
        ...mutationErrors,
        ...protectedErrors,
        409: response('Institution slug or first Admin email already exists', errorSchema),
      },
    },
  },
  '/api/v1/platform/institutions/{institutionId}': {
    get: {
      ...read('Institution metadata visible to platform staff', platformInstitutionSchema, true),
      parameters: [institutionId],
    },
  },
  '/api/v1/platform/institutions/{institutionId}/status': {
    put: {
      ...write(
        'Freeze, deactivate or reactivate an institution',
        platformInstitutionStatusSchema,
        platformInstitutionSchema,
        { missing: true },
      ),
      description:
        'Super Admin only. Frozen and inactive states require a reason of at least five characters and block tenant access.',
      parameters: [institutionId],
    },
  },
  '/api/v1/platform/institutions/{institutionId}/modules': {
    put: {
      ...write(
        'Replace enabled institution modules',
        platformInstitutionModulesSchema,
        platformInstitutionSchema,
        { missing: true },
      ),
      parameters: [institutionId],
    },
  },
  '/api/v1/platform/institutions/{institutionId}/subscription': {
    get: {
      ...read(
        'Institution subscription metadata',
        platformInstitutionSubscriptionSchema.nullable(),
        true,
      ),
      parameters: [institutionId],
    },
    put: {
      ...write(
        'Create or replace institution subscription metadata',
        platformInstitutionSubscriptionInputSchema,
        platformInstitutionSubscriptionSchema,
        { missing: true },
      ),
      description:
        'Super Admin only. Records manual BDT plan terms; no payment, invoice or automatic suspension occurs.',
      parameters: [institutionId],
    },
  },
  '/api/v1/platform/subscriptions': {
    get: {
      ...read('Paged institution subscription metadata', platformSubscriptionsSchema),
      parameters: pagination,
    },
  },
  '/api/v1/platform/operators': {
    get: {
      ...read('Platform operators visible to Super Admin', platformOperatorsSchema),
      parameters: pagination,
    },
  },
  '/api/v1/platform/operators/{userId}': {
    put: {
      ...write(
        'Assign or update platform access for an existing identity',
        platformOperatorStateSchema,
        platformOperatorSchema,
        { continuity: true },
      ),
      parameters: [userId],
    },
  },
};
