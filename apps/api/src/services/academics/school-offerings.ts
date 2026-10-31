import { and, eq, type DatabaseTransaction } from '@eduos/database';
import { academicOffering, membership, studentEnrollment, student } from '@eduos/database/schema';
import { schoolOfferingSchema } from '@eduos/contracts';
import type { SchoolAction } from '@eduos/contracts';
import { forbidden, invalidRequest, conflict } from '../../lib/errors.js';
import { requireSchool, type SchoolAccess } from '../school/policy.js';
export async function schoolOfferings(tx: DatabaseTransaction, access: SchoolAccess) {
  const rows = await tx
    .select()
    .from(academicOffering)
    .where(eq(academicOffering.institutionId, access.school.id))
    .orderBy(academicOffering.session, academicOffering.className);
  return rows.map((r) =>
    schoolOfferingSchema.parse({
      id: r.id,
      className: r.className,
      session: r.session,
      sections: r.sections,
      capacity: String(r.capacity),
      teacher: r.teacherId ?? '',
      active: r.active,
    }),
  );
}
export async function schoolRoster(tx: DatabaseTransaction, access: SchoolAccess) {
  const rows = await tx
    .select({
      id: student.id,
      name: student.name,
      offeringId: studentEnrollment.offeringId,
      section: studentEnrollment.section,
      enrollmentId: studentEnrollment.id,
      startsOn: studentEnrollment.startsOn,
      endsOn: studentEnrollment.endsOn,
    })
    .from(studentEnrollment)
    .innerJoin(
      student,
      and(
        eq(student.institutionId, studentEnrollment.institutionId),
        eq(student.id, studentEnrollment.studentId),
      ),
    )
    .innerJoin(
      academicOffering,
      and(
        eq(academicOffering.institutionId, studentEnrollment.institutionId),
        eq(academicOffering.id, studentEnrollment.offeringId),
      ),
    )
    .where(
      and(
        eq(studentEnrollment.institutionId, access.school.id),
        access.actor.role === 'teacher'
          ? eq(academicOffering.teacherId, access.actor.userId)
          : undefined,
      ),
    )
    .orderBy(student.name, student.id);
  const counters = new Map<string, number>();
  return rows.map((r) => {
    const classId = `${r.offeringId}|${r.section}`;
    const n = (counters.get(classId) ?? 0) + 1;
    counters.set(classId, n);
    return {
      id: r.id,
      name: r.name,
      roll: String(n).padStart(2, '0'),
      classId,
      enrollmentId: r.enrollmentId,
      startsOn: r.startsOn,
      endsOn: r.endsOn,
    };
  });
}
export async function saveSchoolOffering(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  action: Extract<SchoolAction, { type: 'offering-save' }>,
) {
  requireSchool(access, 'academics.manage', 'academics');
  const o = action.offering;
  if (!/^Class (?:[1-9]|10)$/.test(o.className)) invalidRequest();
  const sections = o.sections.split(',').map((s) => s.trim());
  if (
    !sections.length ||
    sections.some((s) => !/^[A-Za-z0-9 -]{1,40}$/.test(s)) ||
    new Set(sections).size !== sections.length
  )
    invalidRequest();
  if (o.teacher) {
    const [teacher] = await tx
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.institutionId, access.school.id),
          eq(membership.userId, o.teacher),
          eq(membership.active, true),
        ),
      );
    if (teacher?.role !== 'teacher') forbidden();
  }
  const [existing] = await tx
    .select()
    .from(academicOffering)
    .where(
      and(eq(academicOffering.institutionId, access.school.id), eq(academicOffering.id, o.id)),
    );
  if (existing && (existing.className !== o.className || existing.session !== o.session))
    invalidRequest();
  if (existing) {
    const enrolled = await tx
      .select({ section: studentEnrollment.section })
      .from(studentEnrollment)
      .where(
        and(
          eq(studentEnrollment.institutionId, access.school.id),
          eq(studentEnrollment.offeringId, existing.id),
        ),
      );
    if (enrolled.some((e) => !sections.includes(e.section))) invalidRequest();
    const occupancy = new Map<string, number>();
    for (const enrollment of enrolled)
      occupancy.set(enrollment.section, (occupancy.get(enrollment.section) ?? 0) + 1);
    if ([...occupancy.values()].some((count) => count > Number(o.capacity))) conflict();
  }
  const values = {
    sections: sections.join(', '),
    capacity: Number(o.capacity),
    teacherId: o.teacher || null,
    active: o.active,
  };
  if (existing)
    await tx
      .update(academicOffering)
      .set(values)
      .where(
        and(eq(academicOffering.institutionId, access.school.id), eq(academicOffering.id, o.id)),
      );
  else
    await tx.insert(academicOffering).values({
      id: o.id,
      institutionId: access.school.id,
      session: o.session,
      className: o.className,
      ...values,
    });
  return o.id;
}
