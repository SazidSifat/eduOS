import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import {
  memberListQuerySchema,
  platformAccessSchema,
  platformInstitutionsSchema,
  platformOperatorsSchema,
  platformOperatorSchema,
  platformOperatorStateSchema,
} from '@eduos/contracts';
import {
  requireSession,
  requirePlatform,
  type ApiVariables,
  type SessionAuth,
} from '../../middleware/auth.js';
import type { PlatformService } from './service.js';

function validated<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new HTTPException(400);
  return result.data;
}
export function createPlatformRoutes(auth: SessionAuth, platform: PlatformService) {
  const app = new Hono<{ Variables: ApiVariables }>();
  const session = requireSession(auth);
  const query = validator('query', (value) => validated(memberListQuerySchema, value));
  app.get(
    '/access',
    session,
    requirePlatform(platform.resolver, 'platform.access.read'),
    async (c) => c.json(platformAccessSchema.parse(await platform.getAccess(c.get('identity').id))),
  );
  app.get(
    '/institutions',
    session,
    requirePlatform(platform.resolver, 'platform.institutions.read'),
    query,
    async (c) => {
      const { limit, offset } = c.req.valid('query');
      return c.json(
        platformInstitutionsSchema.parse(
          await platform.listInstitutions(c.get('identity').id, limit, offset),
        ),
      );
    },
  );
  app.get(
    '/operators',
    session,
    requirePlatform(platform.resolver, 'platform.operators.manage'),
    query,
    async (c) => {
      const { limit, offset } = c.req.valid('query');
      return c.json(
        platformOperatorsSchema.parse(
          await platform.listOperators(c.get('identity').id, limit, offset),
        ),
      );
    },
  );
  app.put(
    '/operators/:userId',
    session,
    requirePlatform(platform.resolver, 'platform.operators.manage'),
    validator('param', (value) => validated(z.object({ userId: z.uuid() }), value)),
    validator('json', (value) => validated(platformOperatorStateSchema, value)),
    async (c) =>
      c.json(
        platformOperatorSchema.parse(
          await platform.updateOperator(
            c.get('identity').id,
            c.req.valid('param').userId,
            c.req.valid('json'),
          ),
        ),
      ),
  );
  return app;
}
