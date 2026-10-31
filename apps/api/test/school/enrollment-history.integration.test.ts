import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { enrollmentHistorySchema } from '@eduos/contracts';
import { and, eq } from '@eduos/database';
import { membership } from '@eduos/database/schema';
import { createSchoolFixture } from '../school-fixture.js';

const { f, base, snapshot, command, enabledSchool } = createSchoolFixture();
describe('enrollment history reads', () => {
  beforeAll(() => f.setup());
  afterAll(() => f.cleanup());

  it('returns bounded newest-first history and supports academic managers without Attendance', async () => {
    const school = await enabledSchool();
    await f.createCandidate(school, f.input(school, 'admitted'));
    await f.request(`/api/v1/platform/institutions/${school.data.id}/modules`, 'PUT', {
      enabledModules: ['academics'],
    });
    const student = (await snapshot(school)).students[0];
    if (!student) throw new Error('Academic manager enrollment missing');
    const path = `${base(school)}/enrollments/${student.enrollmentId}/history`;
    expect(
      enrollmentHistorySchema.parse(
        await (await f.request(path, 'GET', undefined, school.cookie)).json(),
      ).items,
    ).toEqual([]);
    for (const [start, reason] of [
      ['2026-01-10', 'Synthetic first verification'],
      ['2026-01-11', 'Synthetic correction'],
    ] as const)
      expect(
        (
          await command(school, {
            type: 'enrollment-dates',
            enrollmentId: student.enrollmentId,
            startsOn: start,
            endsOn: null,
            reason,
          })
        ).status,
      ).toBe(200);
    const firstResponse = await f.request(
      `${path}?limit=1&offset=0`,
      'GET',
      undefined,
      school.cookie,
    );
    expect(firstResponse.status).toBe(200);
    expect(firstResponse.headers.get('cache-control')).toBe('no-store');
    const first = enrollmentHistorySchema.parse(await firstResponse.json());
    expect(first.hasMore).toBe(true);
    expect(first.items[0]).toMatchObject({
      previousStart: '2026-01-10',
      startsOn: '2026-01-11',
      reason: 'Synthetic correction',
      actorName: 'Synthetic school Admin',
    });
    const second = enrollmentHistorySchema.parse(
      await (await f.request(`${path}?limit=1&offset=1`, 'GET', undefined, school.cookie)).json(),
    );
    expect(second.hasMore).toBe(false);
    expect(second.items[0]).toMatchObject({ previousStart: null, startsOn: '2026-01-10' });
    for (const query of ['limit=101', 'offset=-1', 'limit=bad', 'extra=private'])
      expect((await f.request(`${path}?${query}`, 'GET', undefined, school.cookie)).status).toBe(
        400,
      );
    expect(
      (
        await f.request(
          `${base(school)}/enrollments/invalid/history`,
          'GET',
          undefined,
          school.cookie,
        )
      ).status,
    ).toBe(400);
  });

  it('denies anonymous, teacher, foreign, revoked and disabled-module reads', async () => {
    const school = await enabledSchool();
    await f.createCandidate(school, f.input(school, 'admitted'));
    const student = (await snapshot(school)).students[0];
    if (!student) throw new Error('Synthetic enrollment missing');
    const path = `${base(school)}/enrollments/${student.enrollmentId}/history`;
    const teacher = await f.addStaff(school.data.id, 'teacher');
    const other = await enabledSchool();
    expect((await f.request(path, 'GET', undefined, '')).status).toBe(401);
    expect((await f.request(path, 'GET', undefined, teacher.cookie)).status).toBe(403);
    expect((await f.request(path, 'GET', undefined, other.cookie)).status).toBe(403);
    expect(
      (
        await f.request(
          `${base(other)}/enrollments/${student.enrollmentId}/history`,
          'GET',
          undefined,
          other.cookie,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await command(school, {
          type: 'member-update',
          id: teacher.id,
          role: 'Principal',
          active: true,
        })
      ).status,
    ).toBe(200);
    expect((await f.request(path, 'GET', undefined, teacher.cookie)).status).toBe(200);
    await f.db
      .update(membership)
      .set({ active: false })
      .where(and(eq(membership.institutionId, school.data.id), eq(membership.userId, teacher.id)));
    expect((await f.request(path, 'GET', undefined, teacher.cookie)).status).toBe(403);
    await f.request(`/api/v1/platform/institutions/${school.data.id}/modules`, 'PUT', {
      enabledModules: ['attendance'],
    });
    expect((await f.request(path, 'GET', undefined, school.cookie)).status).toBe(403);
  });
});
