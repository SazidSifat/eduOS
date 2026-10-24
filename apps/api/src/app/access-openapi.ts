import type { z } from 'zod';
import {
  accessSchema,
  rolesSchema,
  membersSchema,
  memberSchema,
  membershipStateSchema,
  platformAccessSchema,
  platformInstitutionsSchema,
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
  409: response('Cannot remove the last active administrator', errorSchema),
  413: response('Request body too large', errorSchema),
};
function read(description: string, schema: z.ZodType) {
  return {
    security: [{ session: [] }],
    responses: {
      200: response(description, schema),
      ...invalidInput,
      ...protectedErrors,
    },
  };
}
function write(description: string, input: z.ZodType, output: z.ZodType) {
  return {
    security: [{ session: [] }],
    requestBody: { required: true, content: json(input) },
    responses: { 200: response(description, output), ...mutationErrors, ...protectedErrors },
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
      parameters: pagination,
    },
  },
  '/api/v1/platform/operators': {
    get: {
      ...read('Platform operators visible to Platform Owner', platformOperatorsSchema),
      parameters: pagination,
    },
  },
  '/api/v1/platform/operators/{userId}': {
    put: {
      ...write(
        'Assign or update platform access for an existing identity',
        platformOperatorStateSchema,
        platformOperatorSchema,
      ),
      parameters: [userId],
    },
  },
};
