import type { SchoolSnapshot } from '@eduos/contracts';
export function canOpenSchoolPath(
  snapshot: Pick<SchoolSnapshot, 'permissions' | 'modules'>,
  path: string,
) {
  const root = path.split('/')[1];
  const permissions = snapshot.permissions;
  const modules = snapshot.modules;
  if (root === 'settings')
    return path.replace(/\/$/, '') === '/settings' || permissions.includes('school.settings');
  if (root === 'admissions')
    return permissions.includes('admissions.read') && modules.includes('admissions');
  if (root === 'attendance')
    return permissions.includes('attendance.read') && modules.includes('attendance');
  if (root === 'fees') return permissions.includes('fees.read') && modules.includes('fees');
  if (root === 'expenses') return permissions.includes('expenses.read') && modules.includes('fees');
  if (root === 'routine')
    return (
      modules.includes('academics') &&
      permissions.includes(path.startsWith('/routine/teacher') ? 'routine.read' : 'routine.manage')
    );
  return false;
}
