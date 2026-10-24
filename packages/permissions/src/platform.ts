export const platformRoleKeys = ['platform_owner', 'platform_manager'] as const;
export type PlatformRole = (typeof platformRoleKeys)[number];
export const platformPermissionKeys = [
  'platform.access.read',
  'platform.operators.manage',
  'platform.institutions.read',
] as const;
export type PlatformPermission = (typeof platformPermissionKeys)[number];
export interface PlatformContext {
  readonly userId: string;
  readonly role: PlatformRole;
  readonly permissions: ReadonlySet<PlatformPermission>;
}
export interface PlatformResolver {
  resolve(userId: string): Promise<PlatformContext | null>;
}
export const platformRoleDefinitions: readonly {
  key: PlatformRole;
  name: string;
  permissions: readonly PlatformPermission[];
}[] = [
  { key: 'platform_owner', name: 'Platform Owner', permissions: platformPermissionKeys },
  {
    key: 'platform_manager',
    name: 'Platform Manager',
    permissions: ['platform.access.read', 'platform.institutions.read'],
  },
];
export function isPlatformRole(value: unknown): value is PlatformRole {
  return platformRoleKeys.some((role) => role === value);
}
export function permissionsForPlatformRole(value: unknown): readonly PlatformPermission[] {
  return platformRoleDefinitions.find((role) => role.key === value)?.permissions ?? [];
}
export function canPlatform(context: PlatformContext, permission: PlatformPermission): boolean {
  return context.permissions.has(permission);
}
