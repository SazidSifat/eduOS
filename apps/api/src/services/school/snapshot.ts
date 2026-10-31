import { and, eq, type DatabaseTransaction } from '@eduos/database';
import { membership, user } from '@eduos/database/schema';
import { schoolSnapshotSchema } from '@eduos/contracts';
import { roleDefinitions } from '@eduos/permissions';
import { readSchoolConfiguration } from '../../models/school.model.js';
import { allowed, schoolToday, type SchoolAccess } from './policy.js';
import { schoolOfferings, schoolRoster } from '../academics/school-offerings.js';
import { schoolCandidates } from '../admissions/school-candidates.js';
import { readAdmissionSettings } from '../admissions/settings.js';
import { readSchoolFees } from '../fees/school-fees.js';
import { readSchoolAttendance } from '../attendance/attendance.service.js';
import { readSchoolExpenses } from '../expenses/expenses.service.js';
import { readSchoolRoutine } from '../routine/routine.service.js';
export async function readSchoolSnapshot(tx: DatabaseTransaction, access: SchoolAccess) {
  const config = await readSchoolConfiguration(tx, access);
  const offerings = await schoolOfferings(tx, access);
  const candidates = await schoolCandidates(tx, access);
  const students =
    allowed(access, 'attendance.read', 'attendance') ||
    allowed(access, 'academics.manage', 'academics')
      ? await schoolRoster(tx, access)
      : [];
  const members = await tx
    .select({
      id: membership.userId,
      name: user.name,
      role: membership.role,
      active: membership.active,
    })
    .from(membership)
    .innerJoin(user, eq(user.id, membership.userId))
    .where(
      and(
        eq(membership.institutionId, access.school.id),
        allowed(access, 'memberships.read') ? undefined : eq(membership.active, true),
      ),
    );
  const admission = await readAdmissionSettings(tx, access.school.id);
  const routine = await readSchoolRoutine(tx, access);
  const classes = offerings
    .filter(
      (o) => o.active && (access.actor.role !== 'teacher' || o.teacher === access.actor.userId),
    )
    .flatMap((o) =>
      o.sections.split(',').map((section) => {
        const id = `${o.id}|${section.trim()}`;
        return {
          id,
          label: `${o.className} · ${section.trim()} (${o.session})`,
          count: students.filter((s) => s.classId === id).length,
          teacherId: o.teacher,
        };
      }),
    );
  return schoolSnapshotSchema.parse({
    institutionId: access.school.id,
    revision: config.revision,
    identity: {
      id: access.actor.userId,
      name: access.name,
      role: roleDefinitions.find((r) => r.key === access.actor.role)?.name ?? '',
    },
    permissions: access.permissions,
    modules: access.modules,
    today: schoolToday(access.school.timezone),
    classes,
    students,
    routineConflicts: routine.routineConflicts,
    state: {
      categories: config.categories,
      feeDefaults: config.feeDefaults,
      candidates,
      ...(await readSchoolFees(tx, access, new Set(candidates.map((c) => c.id)))),
      ...(await readSchoolAttendance(tx, access)),
      expenses: await readSchoolExpenses(tx, access),
      routine: routine.routine,
      routineHistory: routine.routineHistory,
      selectedRegister: '',
      settings: {
        ...config.settings,
        reminderDays: String(admission.reminderDaysBefore),
        reminderTime: admission.beforeTime,
        willingFee: String(admission.willingFeeMinor / 100),
        creditWilling: admission.creditWillingFee ? 'yes' : 'no',
      },
      members: members.flatMap((m) => {
        const role = roleDefinitions.find((r) => r.key === m.role)?.name;
        return role ? [{ ...m, role }] : [];
      }),
      offerings,
    },
  });
}
