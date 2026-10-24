export type Permission = `${string}.${string}`;
export interface TenantContext {
  readonly institutionId: string;
  readonly userId: string;
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
// Roles are application policy inputs; Better Auth establishes identity only.
export interface RoleDefinition {
  readonly key: string;
  readonly permissions: readonly Permission[];
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
