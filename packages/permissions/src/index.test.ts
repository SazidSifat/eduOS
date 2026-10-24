import { describe, it, expect } from 'vitest';
import { can, type TenantContext } from './index.js';
const context: TenantContext = {
  userId: 'user-a',
  role: 'teacher',
  institutionId: 'school-a',
  permissions: new Set(['workspace.read']),
};
describe('resource authorization', () => {
  it('denies missing permissions', () => expect(can(context, 'memberships.manage')).toBe(false));
  it('denies another institution even when the permission exists', () =>
    expect(can(context, 'workspace.read', { institutionId: 'school-b' })).toBe(false));
  it('allows an explicit grant for an owned resource', () =>
    expect(can(context, 'workspace.read', { institutionId: 'school-a' })).toBe(true));
});
