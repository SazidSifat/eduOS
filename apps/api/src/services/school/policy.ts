import type { SchoolAction } from '@eduos/contracts';
import { and, eq, type DatabaseTransaction } from '@eduos/database';
import { institution, membership, institutionModuleGrant, user } from '@eduos/database/schema';
import { permissionsForRole, type Permission, type InstitutionModule } from '@eduos/permissions';
import { forbidden } from '../../lib/errors.js';
export async function authorizeSchool(
  tx: DatabaseTransaction,
  actorId: string,
  institutionId: string,
  write = false,
) {
  const [school] = await tx
    .select()
    .from(institution)
    .where(eq(institution.id, institutionId))
    .for(write ? 'update' : 'share');
  if (school?.status !== 'active') forbidden();
  const [actor] = await tx
    .select()
    .from(membership)
    .where(and(eq(membership.institutionId, institutionId), eq(membership.userId, actorId)))
    .for('share');
  const permissions = permissionsForRole(actor?.role);
  if (!actor?.active || !permissions.includes('workspace.read')) forbidden();
  const grants = await tx
    .select()
    .from(institutionModuleGrant)
    .where(
      and(
        eq(institutionModuleGrant.institutionId, institutionId),
        eq(institutionModuleGrant.enabled, true),
      ),
    )
    .for('share');
  const [identity] = await tx.select({ name: user.name }).from(user).where(eq(user.id, actorId));
  return {
    school,
    actor,
    permissions,
    modules: grants.map((g) => g.module),
    name: identity?.name ?? '',
  };
}
export type SchoolAccess = Awaited<ReturnType<typeof authorizeSchool>>;
export function allowed(access: SchoolAccess, permission: Permission, module?: InstitutionModule) {
  return access.permissions.includes(permission) && (!module || access.modules.includes(module));
}
export function requireSchool(
  access: SchoolAccess,
  permission: Permission,
  module?: InstitutionModule,
) {
  if (!allowed(access, permission, module)) forbidden();
}
export function schoolToday(timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function authorizeSchoolAction(access: SchoolAccess, action: SchoolAction) {
  switch (action.type) {
    case 'candidate-save':
    case 'candidate-state':
    case 'call':
    case 'admit':
    case 'willing-payment':
      requireSchool(access, 'admissions.write', 'admissions');
      break;
    case 'collect':
    case 'schedule-stop':
      requireSchool(access, 'fees.collect', 'fees');
      break;
    case 'reverse':
      requireSchool(access, 'fees.reverse', 'fees');
      break;
    case 'expense-save':
      requireSchool(access, 'expenses.write', 'fees');
      break;
    case 'expense-review':
      requireSchool(access, 'expenses.review', 'fees');
      break;
    case 'expense-pay':
      requireSchool(access, 'expenses.pay', 'fees');
      break;
    case 'attendance-save':
    case 'correction-request':
      requireSchool(access, 'attendance.write', 'attendance');
      break;
    case 'correction-review':
      requireSchool(access, 'attendance.review', 'attendance');
      break;
    case 'routine-configure':
    case 'lesson-save':
    case 'routine-publish':
      requireSchool(access, 'routine.manage', 'academics');
      break;
    case 'member-save':
    case 'member-update':
      requireSchool(access, 'memberships.manage');
      break;
    case 'offering-save':
    case 'enrollment-dates':
      requireSchool(access, 'academics.manage', 'academics');
      break;
    case 'settings-save':
    case 'category-add':
    case 'fee-defaults':
      requireSchool(access, 'school.settings');
      break;
  }
}
