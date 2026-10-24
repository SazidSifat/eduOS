import { describe, expect, it } from 'vitest';
import {
  can,
  canPlatform,
  isRole,
  isPlatformRole,
  permissionsForRole,
  permissionsForPlatformRole,
  roleKeys,
  platformRoleKeys,
  type TenantContext,
} from './index.js';

describe('institution role policy', () => {
  it.each(roleKeys)('%s can read its institution workspace', (role) => {
    const context: TenantContext = {
      userId: 'user',
      institutionId: 'school',
      role,
      permissions: new Set(permissionsForRole(role)),
    };
    expect(can(context, 'workspace.read', { institutionId: 'school' })).toBe(true);
    expect(can(context, 'workspace.read', { institutionId: 'foreign' })).toBe(false);
  });
  it.each(roleKeys)('%s receives only its explicit membership-management grants', (role) => {
    expect(permissionsForRole(role).includes('memberships.manage')).toBe(
      role === 'admin' || role === 'principal',
    );
    expect(permissionsForRole(role).includes('memberships.read')).toBe(
      role === 'admin' || role === 'principal',
    );
  });
  it.each([null, undefined, '', 'super_admin', 'Admin', 'platform_owner', 'toString', '__proto__'])(
    'denies unknown role %s',
    (value) => {
      expect(isRole(value)).toBe(false);
      expect(permissionsForRole(value)).toEqual([]);
    },
  );
});
describe('separate platform role policy', () => {
  it.each(platformRoleKeys)(
    '%s can inspect institutions but only Owner manages operators',
    (role) => {
      const context = {
        userId: 'operator',
        role,
        permissions: new Set(permissionsForPlatformRole(role)),
      };
      expect(canPlatform(context, 'platform.institutions.read')).toBe(true);
      expect(canPlatform(context, 'platform.operators.manage')).toBe(role === 'platform_owner');
      expect(permissionsForRole(role)).toEqual([]);
    },
  );
  it.each(roleKeys)('institution %s has no platform grants', (role) => {
    expect(isPlatformRole(role)).toBe(false);
    expect(permissionsForPlatformRole(role)).toEqual([]);
  });
  it('denies unknown platform roles', () => {
    expect(permissionsForPlatformRole('toString')).toEqual([]);
    expect(permissionsForPlatformRole(null)).toEqual([]);
  });
});
