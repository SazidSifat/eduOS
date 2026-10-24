import { z } from 'zod';
import {
  errorSchema,
  healthSchema,
  readySchema,
  identitySchema,
  membershipsSchema,
  workspaceSchema,
} from '@eduos/contracts';
const json = (schema: z.ZodType) => ({ 'application/json': { schema: z.toJSONSchema(schema) } });
const response = (description: string, schema: z.ZodType) => ({
  description,
  content: json(schema),
});
const protectedErrors = {
  401: response('Authentication required', errorSchema),
  403: response('Access denied', errorSchema),
  500: response('Internal error', errorSchema),
};
export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'EduOS API',
    version: '0.1.0',
    description: 'Foundation endpoints. Better Auth manages /api/auth/* separately.',
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
