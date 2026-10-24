import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import {
  accessSchema,
  identitySchema,
  membershipsSchema,
  workspaceSchema,
  rolesSchema,
  memberListQuerySchema,
  membersSchema,
  memberSchema,
  membershipStateSchema,
} from '@eduos/contracts';
import { roleDefinitions } from '@eduos/permissions';
import {
  requireSession,
  requireTenant,
  type ApiVariables,
  type SessionAuth,
} from '../../middleware/auth.js';
import type { IdentityService } from './service.js';

const institutionParams = z.object({ institutionId: z.uuid() });
const memberParams = institutionParams.extend({ userId: z.uuid() });
function validated<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new HTTPException(400);
  return result.data;
}
export function createIdentityRoutes(auth: SessionAuth, identity: IdentityService) {
  const app = new Hono<{ Variables: ApiVariables }>();
  const session = requireSession(auth);
  const params = validator('param', (value) => validated(institutionParams, value));
  const query = validator('query', (value) => validated(memberListQuerySchema, value));
  app.get('/me', session, (c) => c.json(identitySchema.parse(c.get('identity'))));
  app.get('/memberships', session, async (c) =>
    c.json(membershipsSchema.parse(await identity.listMemberships(c.get('identity').id))),
  );
  app.get(
    '/institutions/:institutionId/workspace',
    session,
    params,
    requireTenant(identity.resolver, 'workspace.read'),
    async (c) =>
      c.json(
        workspaceSchema.parse(
          await identity.getWorkspace(c.get('identity').id, c.req.valid('param').institutionId),
        ),
      ),
  );
  app.get(
    '/institutions/:institutionId/access',
    session,
    params,
    requireTenant(identity.resolver, 'workspace.read'),
    async (c) =>
      c.json(
        accessSchema.parse(
          await identity.getAccess(c.get('identity').id, c.req.valid('param').institutionId),
        ),
      ),
  );
  app.get(
    '/institutions/:institutionId/roles',
    session,
    params,
    requireTenant(identity.resolver, 'workspace.read'),
    async (c) => {
      await identity.getAccess(c.get('identity').id, c.req.valid('param').institutionId);
      return c.json(rolesSchema.parse(roleDefinitions));
    },
  );
  app.get(
    '/institutions/:institutionId/memberships',
    session,
    params,
    requireTenant(identity.resolver, 'memberships.read'),
    query,
    async (c) => {
      const { limit, offset } = c.req.valid('query');
      return c.json(
        membersSchema.parse(
          await identity.listMembers(
            c.get('identity').id,
            c.req.valid('param').institutionId,
            limit,
            offset,
          ),
        ),
      );
    },
  );
  app.put(
    '/institutions/:institutionId/memberships/:userId',
    session,
    validator('param', (value) => validated(memberParams, value)),
    requireTenant(identity.resolver, 'memberships.manage'),
    validator('json', (value) => validated(membershipStateSchema, value)),
    async (c) => {
      const { institutionId, userId } = c.req.valid('param');
      return c.json(
        memberSchema.parse(
          await identity.updateMembership(
            c.get('identity').id,
            institutionId,
            userId,
            c.req.valid('json'),
          ),
        ),
      );
    },
  );
  return app;
}
