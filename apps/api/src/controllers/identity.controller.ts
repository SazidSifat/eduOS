import { createFactory } from 'hono/factory';
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
} from '../middleware/auth.js';
import type { IdentityService } from '../services/identity/identity.service.js';

const institutionParams = z.object({ institutionId: z.uuid() });
const memberParams = institutionParams.extend({ userId: z.uuid() });
function validated<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) throw new HTTPException(400);
  return result.data;
}
export function createIdentityController(auth: SessionAuth, identity: IdentityService) {
  const factory = createFactory<{ Variables: ApiVariables }>();
  const session = requireSession(auth);
  const params = validator('param', (value) => validated(institutionParams, value));
  const query = validator('query', (value) => validated(memberListQuerySchema, value));
  const me = factory.createHandlers(session, (c) =>
    c.json(identitySchema.parse(c.get('identity'))),
  );
  const listMemberships = factory.createHandlers(session, async (c) =>
    c.json(membershipsSchema.parse(await identity.listMemberships(c.get('identity').id))),
  );
  const workspace = factory.createHandlers(
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
  const access = factory.createHandlers(
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
  const roles = factory.createHandlers(
    session,
    params,
    requireTenant(identity.resolver, 'workspace.read'),
    async (c) => {
      await identity.getAccess(c.get('identity').id, c.req.valid('param').institutionId);
      return c.json(rolesSchema.parse(roleDefinitions));
    },
  );
  const listMembers = factory.createHandlers(
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
  const updateMembership = factory.createHandlers(
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
  return { me, listMemberships, workspace, access, roles, listMembers, updateMembership };
}
