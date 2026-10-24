import { createMiddleware } from 'hono/factory';
import type { Auth } from '@eduos/auth/server';
import type { TenantContext, MembershipResolver, Permission } from '@eduos/permissions';
import { can } from '@eduos/permissions';
import { forbidden, unauthorized } from '../lib/errors.js';
export type ApiVariables = {
  requestId: string;
  identity: { id: string; name: string; email: string };
  tenant: TenantContext;
};
export function requireSession(auth: Auth) {
  return createMiddleware<{ Variables: ApiVariables }>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) unauthorized();
    c.set('identity', { id: session.user.id, name: session.user.name, email: session.user.email });
    c.header('Cache-Control', 'no-store');
    await next();
  });
}
export function requireTenant(resolver: MembershipResolver, permission: Permission) {
  return createMiddleware<{ Variables: ApiVariables }>(async (c, next) => {
    const institutionId = c.req.param('institutionId');
    if (!institutionId) forbidden();
    const context = await resolver.resolve(c.get('identity').id, institutionId);
    if (!context || !can(context, permission)) forbidden();
    c.set('tenant', context);
    await next();
  });
}
