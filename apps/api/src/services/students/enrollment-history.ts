import { and, eq, desc, type DatabaseTransaction } from '@eduos/database';
import { enrollmentDateChange, studentEnrollment, user } from '@eduos/database/schema';
import { requireSchool, type SchoolAccess } from '../school/policy.js';
import { forbidden } from '../../lib/errors.js';

export async function readEnrollmentHistory(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  enrollmentId: string,
  page: { limit: number; offset: number },
) {
  requireSchool(access, 'academics.manage', 'academics');
  const [enrollment] = await tx
    .select({ id: studentEnrollment.id })
    .from(studentEnrollment)
    .where(
      and(
        eq(studentEnrollment.institutionId, access.school.id),
        eq(studentEnrollment.id, enrollmentId),
      ),
    );
  if (!enrollment) forbidden();
  const rows = await tx
    .select({
      id: enrollmentDateChange.id,
      actorName: user.name,
      previousStart: enrollmentDateChange.previousStart,
      previousEnd: enrollmentDateChange.previousEnd,
      startsOn: enrollmentDateChange.startsOn,
      endsOn: enrollmentDateChange.endsOn,
      reason: enrollmentDateChange.reason,
      createdAt: enrollmentDateChange.createdAt,
    })
    .from(enrollmentDateChange)
    .innerJoin(user, eq(user.id, enrollmentDateChange.actorId))
    .where(
      and(
        eq(enrollmentDateChange.institutionId, access.school.id),
        eq(enrollmentDateChange.enrollmentId, enrollmentId),
      ),
    )
    .orderBy(desc(enrollmentDateChange.createdAt), desc(enrollmentDateChange.id))
    .limit(page.limit + 1)
    .offset(page.offset);
  return {
    items: rows
      .slice(0, page.limit)
      .map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    hasMore: rows.length > page.limit,
  };
}
