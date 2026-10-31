import { and, eq, type DatabaseTransaction } from '@eduos/database';
import {
  enrollmentDateChange,
  studentEnrollment,
  attendanceRegisterMark,
  attendanceRegister,
} from '@eduos/database/schema';
import type { SchoolAction } from '@eduos/contracts';
import { conflict, forbidden, invalidRequest } from '../../lib/errors.js';
import { requireSchool, type SchoolAccess } from '../school/policy.js';

export async function setEnrollmentDates(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  action: Extract<SchoolAction, { type: 'enrollment-dates' }>,
) {
  requireSchool(access, 'academics.manage', 'academics');
  if (action.startsOn && action.endsOn && action.startsOn > action.endsOn) invalidRequest();
  const [enrollment] = await tx
    .select()
    .from(studentEnrollment)
    .where(
      and(
        eq(studentEnrollment.institutionId, access.school.id),
        eq(studentEnrollment.id, action.enrollmentId),
      ),
    );
  if (!enrollment) forbidden();
  if (enrollment.startsOn === action.startsOn && enrollment.endsOn === action.endsOn)
    return enrollment.id;
  // Submitted marks are historical evidence. Date edits cannot silently exclude them.
  const submitted = await tx
    .select({ date: attendanceRegister.date })
    .from(attendanceRegisterMark)
    .innerJoin(
      attendanceRegister,
      and(
        eq(attendanceRegister.institutionId, attendanceRegisterMark.institutionId),
        eq(attendanceRegister.id, attendanceRegisterMark.registerId),
      ),
    )
    .where(
      and(
        eq(attendanceRegisterMark.institutionId, access.school.id),
        eq(attendanceRegisterMark.studentId, enrollment.studentId),
        eq(attendanceRegister.offeringId, enrollment.offeringId),
        eq(attendanceRegister.section, enrollment.section),
        eq(attendanceRegister.submitted, true),
      ),
    );
  if (
    submitted.some(
      ({ date }) =>
        (action.startsOn !== null && date < action.startsOn) ||
        (action.endsOn !== null && date > action.endsOn),
    )
  )
    conflict();
  await tx
    .update(studentEnrollment)
    .set({ startsOn: action.startsOn, endsOn: action.endsOn })
    .where(
      and(
        eq(studentEnrollment.institutionId, access.school.id),
        eq(studentEnrollment.id, enrollment.id),
      ),
    );
  await tx.insert(enrollmentDateChange).values({
    institutionId: access.school.id,
    enrollmentId: enrollment.id,
    actorId: access.actor.userId,
    previousStart: enrollment.startsOn,
    previousEnd: enrollment.endsOn,
    startsOn: action.startsOn,
    endsOn: action.endsOn,
    reason: action.reason,
  });
  return enrollment.id;
}
