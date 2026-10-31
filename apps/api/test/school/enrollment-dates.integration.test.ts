import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq, sql } from '@eduos/database';
import { enrollmentDateChange, studentEnrollment, membership } from '@eduos/database/schema';
import { createSchoolFixture } from '../school-fixture.js';

const { f, snapshot, command, enabledSchool, assignTeacher } = createSchoolFixture();
type School = Awaited<ReturnType<typeof enabledSchool>>;
async function enrolled(school: School) {
  const detail = await f.createCandidate(school, f.input(school, 'admitted'));
  const student = (await snapshot(school)).students.find(
    (s) => s.id === detail.candidate.studentId,
  );
  if (!student) throw new Error('Synthetic enrollment missing');
  return student;
}

describe('dated enrollment and attendance rosters', () => {
  beforeAll(() => f.setup());
  afterAll(() => f.cleanup());

  it('retains unknown dates, audits explicit dates once and enforces inclusive roster boundaries', async () => {
    const school = await enabledSchool();
    const teacher = await assignTeacher(school);
    const student = await enrolled(school);
    expect(student.startsOn).toBeNull();
    expect(student.endsOn).toBeNull();
    const action = {
      type: 'enrollment-dates',
      enrollmentId: student.enrollmentId,
      startsOn: '2026-01-10',
      endsOn: '2026-01-20',
      reason: 'Verified synthetic register',
    } as const;
    const view = await snapshot(school);
    const key = randomUUID();
    expect((await command(school, action, school.cookie, view.revision, key)).status).toBe(200);
    expect((await command(school, action, school.cookie, view.revision, key)).status).toBe(200);
    const changes = await f.db
      .select()
      .from(enrollmentDateChange)
      .where(eq(enrollmentDateChange.enrollmentId, student.enrollmentId));
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      actorId: school.adminId,
      previousStart: null,
      previousEnd: null,
      startsOn: action.startsOn,
      endsOn: action.endsOn,
      reason: action.reason,
    });
    for (const [date, status] of [
      ['2026-01-09', 400],
      ['2026-01-10', 200],
      ['2026-01-20', 200],
      ['2026-01-21', 400],
    ] as const) {
      expect(
        (
          await command(
            school,
            {
              type: 'attendance-save',
              classId: student.classId,
              date,
              marks: { [student.id]: 'Present' },
              submit: true,
            },
            teacher.cookie,
          )
        ).status,
      ).toBe(status);
    }
    // A new date edit cannot invalidate an existing submitted mark.
    expect((await command(school, { ...action, startsOn: '2026-01-11' })).status).toBe(409);
    expect((await command(school, { ...action, startsOn: '2026-01-21' })).status).toBe(400);
    expect(
      (await snapshot(school)).students.find((s) => s.enrollmentId === student.enrollmentId),
    ).toMatchObject({ startsOn: '2026-01-10', endsOn: '2026-01-20' });
  });

  it('rejects unauthorized, foreign, revoked and disabled-module date changes and replays', async () => {
    const school = await enabledSchool();
    const student = await enrolled(school);
    const teacher = await assignTeacher(school);
    const other = await enabledSchool();
    const foreign = await enrolled(other);
    const action = {
      type: 'enrollment-dates',
      enrollmentId: student.enrollmentId,
      startsOn: '2026-01-10',
      endsOn: null,
      reason: 'Verified synthetic start',
    } as const;
    expect((await command(school, action, teacher.cookie)).status).toBe(403);
    expect((await command(school, { ...action, enrollmentId: foreign.enrollmentId })).status).toBe(
      403,
    );
    const key = randomUUID();
    const view = await snapshot(school);
    expect((await command(school, action, school.cookie, view.revision, key)).status).toBe(200);
    await f.request(`/api/v1/platform/institutions/${school.data.id}/modules`, 'PUT', {
      enabledModules: ['attendance'],
    });
    expect((await command(school, action, school.cookie, view.revision, key)).status).toBe(403);
    await f.db
      .update(membership)
      .set({ active: false })
      .where(
        and(eq(membership.institutionId, school.data.id), eq(membership.userId, school.adminId)),
      );
    expect((await command(school, action, school.cookie, view.revision, key)).status).toBe(403);
  });

  it('rolls back dates and school revision when audit persistence fails', async () => {
    const school = await enabledSchool();
    const student = await enrolled(school);
    const before = await snapshot(school);
    const constraint = sql.identifier(`dates_audit_${school.data.id.replaceAll('-', '')}`);
    await f.db.execute(sql`alter table enrollment_date_change add constraint ${constraint}
      check (institution_id <> ${sql.raw(`'${school.data.id}'`)}::uuid)`);
    try {
      expect(
        (
          await command(school, {
            type: 'enrollment-dates',
            enrollmentId: student.enrollmentId,
            startsOn: '2026-01-10',
            endsOn: null,
            reason: 'Synthetic rollback check',
          })
        ).status,
      ).toBe(500);
      const after = await snapshot(school);
      expect(after.revision).toBe(before.revision);
      expect(after.students.find((s) => s.id === student.id)?.startsOn).toBeNull();
    } finally {
      await f.db.execute(sql`alter table enrollment_date_change drop constraint ${constraint}`);
    }
  });

  it('enforces tenant-safe audit references and date order in PostgreSQL', async () => {
    const school = await enabledSchool();
    const student = await enrolled(school);
    const foreignSchool = await enabledSchool();
    const foreign = await enrolled(foreignSchool);
    await expect(
      f.db.insert(enrollmentDateChange).values({
        institutionId: school.data.id,
        enrollmentId: foreign.enrollmentId,
        actorId: school.adminId,
        reason: 'Synthetic foreign enrollment',
      }),
    ).rejects.toThrow();
    await expect(
      f.db.insert(enrollmentDateChange).values({
        institutionId: school.data.id,
        enrollmentId: student.enrollmentId,
        actorId: foreignSchool.adminId,
        reason: 'Synthetic foreign actor',
      }),
    ).rejects.toThrow();
    await expect(
      f.db
        .update(studentEnrollment)
        .set({ startsOn: '2026-01-20', endsOn: '2026-01-10' })
        .where(eq(studentEnrollment.id, student.enrollmentId)),
    ).rejects.toThrow();
  });
});
