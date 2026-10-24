export const roleKeys = [
  'admin',
  'principal',
  'admission_officer',
  'accountant',
  'teacher',
] as const;
export type Role = (typeof roleKeys)[number];
// Only implemented capabilities receive grants. Future school policies need discovery.
export const permissionKeys = ['workspace.read', 'memberships.read', 'memberships.manage'] as const;
export type Permission = (typeof permissionKeys)[number];
export interface RoleDefinition {
  readonly key: Role;
  readonly name: string;
  readonly permissions: readonly Permission[];
}
export const roleDefinitions: readonly RoleDefinition[] = [
  { key: 'admin', name: 'Admin', permissions: permissionKeys },
  { key: 'principal', name: 'Principal', permissions: permissionKeys },
  { key: 'admission_officer', name: 'Admission Officer', permissions: ['workspace.read'] },
  { key: 'accountant', name: 'Accountant', permissions: ['workspace.read'] },
  { key: 'teacher', name: 'Teacher', permissions: ['workspace.read'] },
];
export function isRole(value: unknown): value is Role {
  return roleKeys.some((role) => role === value);
}
export function permissionsForRole(value: unknown): readonly Permission[] {
  return roleDefinitions.find((role) => role.key === value)?.permissions ?? [];
}
