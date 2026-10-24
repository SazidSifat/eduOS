import type { PlatformRole } from '@eduos/permissions';

export const roleName = (role: PlatformRole) =>
  role === 'platform_owner' ? 'Super Admin' : 'Platform Manager';
export const shortId = (id: string) => `${id.slice(0, 8)}…${id.slice(-4)}`;
export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('');
