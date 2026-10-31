import { createFactory } from 'hono/factory';
import { validator } from 'hono/validator';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import {
  memberListQuerySchema,
  platformInstitutionListQuerySchema,
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
} from '@eduos/contracts';
import {
  requireSession,
  requirePlatform,
  type ApiVariables,
  type SessionAuth,
} from '../middleware/auth.js';
import type { PlatformService } from '../services/platform/platform.service.js';

function validated<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new HTTPException(400);
  return result.data;
}
export function createPlatformController(auth: SessionAuth, platform: PlatformService) {
  const factory = createFactory<{ Variables: ApiVariables }>();
  const session = requireSession(auth);
  const query = validator('query', (value) => validated(memberListQuerySchema, value));
  const institutionQuery = validator('query', (value) =>
    validated(platformInstitutionListQuerySchema, value),
  );
  const access = factory.createHandlers(
    session,
    requirePlatform(platform.resolver, 'platform.access.read'),
    async (c) => c.json(platformAccessSchema.parse(await platform.getAccess(c.get('identity').id))),
  );
  const createInstitution = factory.createHandlers(
    session,
    requirePlatform(platform.resolver, 'platform.institutions.create'),
    validator('json', (value) => validated(platformInstitutionCreateSchema, value)),
    async (c) =>
      c.json(
        platformInstitutionSchema.parse(
          await platform.createInstitution(c.get('identity').id, c.req.valid('json')),
        ),
        201,
      ),
  );
  const listInstitutions = factory.createHandlers(
    session,
    requirePlatform(platform.resolver, 'platform.institutions.read'),
    institutionQuery,
    async (c) => {
      const { limit, offset, code } = c.req.valid('query');
      return c.json(
        platformInstitutionsSchema.parse(
          await platform.listInstitutions(c.get('identity').id, limit, offset, code),
        ),
      );
    },
  );
  const institution = factory.createHandlers(
    session,
    requirePlatform(platform.resolver, 'platform.institutions.read'),
    validator('param', (value) => validated(z.object({ institutionId: z.uuid() }), value)),
    async (c) =>
      c.json(
        platformInstitutionSchema.parse(
          await platform.getInstitution(c.get('identity').id, c.req.valid('param').institutionId),
        ),
      ),
  );
  const updateStatus = factory.createHandlers(
    session,
    requirePlatform(platform.resolver, 'platform.institutions.manage'),
    validator('param', (value) => validated(z.object({ institutionId: z.uuid() }), value)),
    validator('json', (value) => validated(platformInstitutionStatusSchema, value)),
    async (c) =>
      c.json(
        platformInstitutionSchema.parse(
          await platform.updateInstitutionStatus(
            c.get('identity').id,
            c.req.valid('param').institutionId,
            c.req.valid('json'),
          ),
        ),
      ),
  );
  const updateModules = factory.createHandlers(
    session,
    requirePlatform(platform.resolver, 'platform.institutions.manage'),
    validator('param', (value) => validated(z.object({ institutionId: z.uuid() }), value)),
    validator('json', (value) => validated(platformInstitutionModulesSchema, value)),
    async (c) =>
      c.json(
        platformInstitutionSchema.parse(
          await platform.updateInstitutionModules(
            c.get('identity').id,
            c.req.valid('param').institutionId,
            c.req.valid('json'),
          ),
        ),
      ),
  );
  const subscription = factory.createHandlers(
    session,
    requirePlatform(platform.resolver, 'platform.subscriptions.manage'),
    validator('param', (value) => validated(z.object({ institutionId: z.uuid() }), value)),
    async (c) =>
      c.json(
        platformInstitutionSubscriptionSchema
          .nullable()
          .parse(
            await platform.getSubscription(
              c.get('identity').id,
              c.req.valid('param').institutionId,
            ),
          ),
      ),
  );
  const updateSubscription = factory.createHandlers(
    session,
    requirePlatform(platform.resolver, 'platform.subscriptions.manage'),
    validator('param', (value) => validated(z.object({ institutionId: z.uuid() }), value)),
    validator('json', (value) => validated(platformInstitutionSubscriptionInputSchema, value)),
    async (c) =>
      c.json(
        platformInstitutionSubscriptionSchema.parse(
          await platform.updateSubscription(
            c.get('identity').id,
            c.req.valid('param').institutionId,
            c.req.valid('json'),
          ),
        ),
      ),
  );
  const listSubscriptions = factory.createHandlers(
    session,
    requirePlatform(platform.resolver, 'platform.subscriptions.manage'),
    query,
    async (c) => {
      const { limit, offset } = c.req.valid('query');
      return c.json(
        platformSubscriptionsSchema.parse(
          await platform.listSubscriptions(c.get('identity').id, limit, offset),
        ),
      );
    },
  );
  const listOperators = factory.createHandlers(
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
  const updateOperator = factory.createHandlers(
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
  return {
    access,
    createInstitution,
    listInstitutions,
    institution,
    updateStatus,
    updateModules,
    subscription,
    updateSubscription,
    listSubscriptions,
    listOperators,
    updateOperator,
  };
}
