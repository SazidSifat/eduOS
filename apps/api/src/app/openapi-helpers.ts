import { z } from 'zod';
import { errorSchema } from '@eduos/contracts';
export const json = (schema: z.ZodType) => ({
  'application/json': { schema: z.toJSONSchema(schema) },
});
export const response = (description: string, schema: z.ZodType) => ({
  description,
  content: json(schema),
});
export const protectedErrors = {
  401: response('Authentication required', errorSchema),
  403: response('Access denied', errorSchema),
  500: response('Internal error', errorSchema),
};
