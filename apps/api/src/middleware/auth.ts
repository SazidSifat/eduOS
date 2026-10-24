import { createMiddleware } from 'hono/factory';
import type {
  TenantContext,
  MembershipResolver,
  Permission,
  PlatformContext,
  PlatformPermission,
  PlatformResolver,
} from '@eduos/permissions';
import { can, canPlatform } from '@eduos/permissions';
import { forbidden, unauthorized } from '../lib/errors.js';
export type ApiVariables = {
  requestId: string;
  identity: { id: string; name: string; email: string };
  tenant: TenantContext;
  platform: PlatformContext;
};
export interface SessionAuth {
  api: {
    getSession(input: { headers: Headers }): Promise<{
      user: { id: string; name: string; email: string };
    } | null>;
  };
}
export interface HttpAuth extends SessionAuth {
  handler(request: Request): Promise<Response>;
}
export function requireSession(auth: SessionAuth) {
  return createMiddleware<{ Variables: ApiVariables }>(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) unauthorized();
    c.set('identity', { id: session.user.id, name: session.user.name, email: session.user.email });
    c.header('Cache-Control', 'no-store');
    await next();
  });
}
export function requirePlatform(resolver: PlatformResolver, permission: PlatformPermission) {
  return createMiddleware<{ Variables: ApiVariables }>(async (c, next) => {
    const context = await resolver.resolve(c.get('identity').id);
    if (!context || !canPlatform(context, permission)) forbidden();
    c.set('platform', context);
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
