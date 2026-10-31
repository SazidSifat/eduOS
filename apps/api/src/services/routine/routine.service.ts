import { and, eq, type DatabaseTransaction } from '@eduos/database';
import { academicOffering, classRoutine, membership } from '@eduos/database/schema';
import { schoolRoutineSchema, type SchoolAction } from '@eduos/contracts';
import { allowed, requireSchool, type SchoolAccess } from '../school/policy.js';
import { attendanceClass } from '../attendance/attendance.service.js';
import { forbidden, invalidRequest, conflict } from '../../lib/errors.js';
import {
  emptyRoutine,
  validRoutinePeriods,
  missingRoutineSlots,
  conflictsWithRoutine,
} from './policy.js';
async function routineRows(tx: DatabaseTransaction, access: SchoolAccess) {
  const rows = await tx
    .select({ row: classRoutine, session: academicOffering.session })
    .from(classRoutine)
    .innerJoin(
      academicOffering,
      and(
        eq(academicOffering.institutionId, classRoutine.institutionId),
        eq(academicOffering.id, classRoutine.offeringId),
      ),
    )
    .where(eq(classRoutine.institutionId, access.school.id))
    .orderBy(classRoutine.createdAt);
  return rows.map(({ row, session }) => ({
    ...row,
    data: {
      ...schoolRoutineSchema.parse(row.data),
      session,
      classId: `${row.offeringId}|${row.section}`,
    },
  }));
}
export async function readSchoolRoutine(tx: DatabaseTransaction, access: SchoolAccess) {
  if (!allowed(access, 'routine.read', 'academics'))
    return { routine: emptyRoutine(), routineHistory: [], routineConflicts: [] };
  const rows = await routineRows(tx, access);
  const data = rows.map((r) => schoolRoutineSchema.parse(r.data));
  if (access.actor.role === 'teacher') {
    const history = data
      .filter((r) => r.published)
      .map((r) => ({ ...r, lessons: r.lessons.filter((l) => l.teacher === access.actor.userId) }));
    return {
      routine: history.at(-1) ?? emptyRoutine(),
      routineHistory: history,
      routineConflicts: [],
    };
  }
  const routine = data.at(-1) ?? emptyRoutine();
  const history = data.filter((r) => r.published);
  return {
    routine,
    routineHistory: history,
    routineConflicts: conflictsWithRoutine(
      routine,
      history.filter((r) => r.className !== routine.className),
    ),
  };
}
export async function runSchoolRoutine(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  action: SchoolAction,
) {
  requireSchool(access, 'routine.manage', 'academics');
  const rows = await routineRows(tx, access);
  let current = rows.at(-1);
  let routine = current ? schoolRoutineSchema.parse(current.data) : emptyRoutine();
  if (action.type === 'routine-configure') {
    const selected = action.classId ? await attendanceClass(tx, access, action.classId) : null;
    const matching = rows.filter(
      (r) =>
        schoolRoutineSchema.parse(r.data).className === action.className &&
        (!selected || (r.offeringId === selected.offering.id && r.section === selected.section)),
    );
    current = matching.find((r) => r.version === 'draft') ?? matching.at(-1);
    const prior = current ? schoolRoutineSchema.parse(current.data) : emptyRoutine();
    routine = {
      ...prior,
      days: action.days,
      effective: action.effective,
      periods: action.periods,
      className: selected
        ? `${selected.offering.className} · ${selected.section}`
        : action.className,
      ...(action.classId ? { classId: action.classId } : {}),
      published: false,
      lessons: prior.lessons.filter(
        (l) =>
          action.days.some((day) => day === l.day) && action.periods.some((p) => p.id === l.period),
      ),
    };
  } else if (action.type === 'lesson-save') {
    const l = action.lesson;
    if (!routine.days.includes(l.day) || !routine.periods.some((p) => p.id === l.period))
      invalidRequest();
    const [teacher] = await tx
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.institutionId, access.school.id),
          eq(membership.userId, l.teacher),
          eq(membership.active, true),
          eq(membership.role, 'teacher'),
        ),
      );
    if (!teacher) forbidden();
    routine = {
      ...routine,
      published: false,
      lessons: [...routine.lessons.filter((o) => o.day !== l.day || o.period !== l.period), l],
    };
  } else if (action.type === 'routine-publish') {
    if (routine.published || !validRoutinePeriods(routine) || missingRoutineSlots(routine).length)
      conflict();
    const others = rows
      .map((r) => schoolRoutineSchema.parse(r.data))
      .filter((r) => r.published && r.className !== routine.className);
    if (conflictsWithRoutine(routine, others).length) conflict();
    for (const lesson of routine.lessons) {
      const [teacher] = await tx
        .select()
        .from(membership)
        .where(
          and(
            eq(membership.institutionId, access.school.id),
            eq(membership.userId, lesson.teacher),
            eq(membership.active, true),
            eq(membership.role, 'teacher'),
          ),
        );
      if (!teacher) forbidden();
    }
    routine = {
      ...routine,
      published: true,
      version:
        Math.max(
          0,
          ...rows
            .filter((r) =>
              routine.classId
                ? `${r.offeringId}|${r.section}` === routine.classId
                : schoolRoutineSchema.parse(r.data).className === routine.className,
            )
            .map((r) => schoolRoutineSchema.parse(r.data).version),
        ) + 1,
      note: action.note,
    };
  } else invalidRequest();
  if (!validRoutinePeriods(routine)) invalidRequest();
  const [base, section] = routine.className.split(' · ');
  const [offering] = await tx
    .select()
    .from(academicOffering)
    .where(
      and(
        eq(academicOffering.institutionId, access.school.id),
        eq(academicOffering.className, base ?? ''),
        routine.classId
          ? eq(academicOffering.id, routine.classId.split('|')[0] ?? '')
          : current
            ? eq(academicOffering.id, current.offeringId)
            : eq(academicOffering.active, true),
      ),
    )
    .orderBy(academicOffering.session);
  if (
    !offering ||
    !section ||
    !offering.sections
      .split(',')
      .map((s) => s.trim())
      .includes(section)
  )
    invalidRequest();
  const values = {
    institutionId: access.school.id,
    offeringId: offering.id,
    section,
    version: routine.published ? String(routine.version) : 'draft',
    data: { ...routine, classId: `${offering.id}|${section}`, session: offering.session },
    createdAt: new Date(),
  };
  await tx
    .insert(classRoutine)
    .values(values)
    .onConflictDoUpdate({
      target: [
        classRoutine.institutionId,
        classRoutine.offeringId,
        classRoutine.section,
        classRoutine.version,
      ],
      set: { data: values.data, createdAt: values.createdAt },
    });
}
