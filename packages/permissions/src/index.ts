import type { Permission, Role } from './roles.js';
export * from './roles.js';
export * from './platform.js';
export interface TenantContext {
  readonly institutionId: string;
  readonly userId: string;
  readonly role: Role;
  readonly permissions: ReadonlySet<Permission>;
}
export interface MembershipResolver {
  resolve(userId: string, institutionId: string): Promise<TenantContext | null>;
}
export interface OwnedResource {
  readonly institutionId: string;
}
export interface ResourcePolicy<T extends OwnedResource> {
  allows(context: TenantContext, action: Permission, resource: T): boolean;
}
export function can(
  context: TenantContext,
  permission: Permission,
  resource?: OwnedResource,
): boolean {
  return (
    (!resource || resource.institutionId === context.institutionId) &&
    context.permissions.has(permission)
  );
}
