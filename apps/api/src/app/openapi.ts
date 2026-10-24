import {
  errorSchema,
  healthSchema,
  readySchema,
  identitySchema,
  membershipsSchema,
  workspaceSchema,
} from '@eduos/contracts';
import { response, protectedErrors } from './openapi-helpers.js';
import { accessPaths } from './access-openapi.js';
export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'EduOS API',
    version: '0.1.0',
    description:
      'Institution and platform access endpoints. Better Auth manages /api/auth/* separately.',
  },
  components: {
    securitySchemes: {
      session: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
        description: 'Secure-prefixed in production; managed by Better Auth.',
      },
    },
  },
  paths: {
    ...accessPaths,
    '/api/health': { get: { responses: { 200: response('Process is alive', healthSchema) } } },
    '/api/ready': {
      get: {
        responses: {
          200: response('Database is available', readySchema),
          503: response('Database unavailable', errorSchema),
        },
      },
    },
    '/api/v1/me': {
      get: {
        security: [{ session: [] }],
        responses: { 200: response('Current identity', identitySchema), ...protectedErrors },
      },
    },
    '/api/v1/memberships': {
      get: {
        security: [{ session: [] }],
        responses: {
          200: response('Active memberships for current identity', membershipsSchema),
          ...protectedErrors,
        },
      },
    },
    '/api/v1/institutions/{institutionId}/workspace': {
      get: {
        security: [{ session: [] }],
        parameters: [
          {
            in: 'path',
            name: 'institutionId',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: response('Authorized workspace', workspaceSchema),
          400: response('Invalid institution ID', errorSchema),
          ...protectedErrors,
        },
      },
    },
  },
};
