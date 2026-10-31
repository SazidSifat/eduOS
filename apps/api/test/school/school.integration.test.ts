import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { and, eq } from '@eduos/database';
import { attendanceRegister, attendanceRegisterMark, membership } from '@eduos/database/schema';
import { schoolEvidenceSchema } from '@eduos/contracts';
import { createSchoolFixture } from '../school-fixture.js';
const { f, base, snapshot, command, enabledSchool, assignTeacher } = createSchoolFixture();
describe('live school routes and services', () => {
  beforeAll(() => f.setup());
  afterAll(() => f.cleanup());
  it('requires a session and rejects foreign, revoked and platform-only access', async () => {
    const s = await enabledSchool();
    const other = await enabledSchool();
    expect((await f.request(base(s), 'GET', undefined, '')).status).toBe(401);
    expect((await f.request(base(s))).status).toBe(403);
    expect((await f.request(base(s), 'GET', undefined, other.cookie)).status).toBe(403);
    expect(
      (await f.request('/api/v1/institutions/invalid/school', 'GET', undefined, s.cookie)).status,
    ).toBe(400);
    const teacher = await assignTeacher(s);
    const view = await snapshot(s, teacher.cookie);
    expect(view.state.candidates).toEqual([]);
    expect(view.state.expenses).toEqual([]);
    expect(view.permissions).not.toContain('memberships.manage');
    await f.db
      .update(membership)
      .set({ active: false })
      .where(and(eq(membership.institutionId, s.data.id), eq(membership.userId, teacher.id)));
    expect((await f.request(base(s), 'GET', undefined, teacher.cookie)).status).toBe(403);
  });
  it('persists settings, rejects stale revisions and replays an operation only once', async () => {
    const s = await enabledSchool();
    const original = await snapshot(s);
    const key = randomUUID();
    const action = {
      type: 'settings-save',
      values: { session: '2027', start: '2027-01-01', end: '2027-12-31' },
    } as const;
    expect((await command(s, action, s.cookie, original.revision, key)).status).toBe(200);
    expect((await command(s, action, s.cookie, original.revision, key)).status).toBe(200);
    const saved = await snapshot(s);
    expect(saved.state.settings.session).toBe('2027');
    expect(saved.revision).toBe(original.revision + 1);
    expect(
      (
        await command(
          s,
          { type: 'category-add', category: 'Utilities' },
          s.cookie,
          original.revision,
        )
      ).status,
    ).toBe(409);
    expect(
      (await command(s, { type: 'settings-save', values: { hiddenPermission: 'admin' } })).status,
    ).toBe(400);
    expect(
      (
        await f.request(
          `${base(s)}/commands`,
          'POST',
          { operationKey: randomUUID(), revision: saved.revision, action: { type: 'reset' } },
          s.cookie,
        )
      ).status,
    ).toBe(400);
  });
  it('uses real enrollments and preserves the original attendance after reviewed corrections', async () => {
    const s = await enabledSchool();
    const teacher = await assignTeacher(s);
    const detail = await f.createCandidate(s, f.input(s, 'admitted'));
    const state = await snapshot(s, teacher.cookie);
    const cls = state.classes.find((c) => c.id.startsWith(s.offering.id));
    const student = state.students.find((student) => student.id === detail.candidate.studentId);
    if (!cls || !student) throw new Error('Synthetic enrollment missing');
    expect(cls.count).toBe(1);
    expect(
      (
        await command(
          s,
          {
            type: 'attendance-save',
            classId: cls.id,
            date: state.today,
            marks: { [student.id]: 'Unmarked' },
            submit: true,
          },
          teacher.cookie,
        )
      ).status,
    ).toBe(400);
    const submit = {
      type: 'attendance-save',
      classId: cls.id,
      date: state.today,
      marks: { [student.id]: 'Present' },
      submit: true,
    } as const;
    expect((await command(s, submit, teacher.cookie)).status).toBe(200);
    expect((await command(s, submit, teacher.cookie)).status).toBe(409);
    const saved = await snapshot(s, teacher.cookie);
    const register = saved.state.registers[0];
    if (!register) throw new Error('Synthetic register missing');
    const correction = {
      id: randomUUID(),
      registerId: register.id,
      studentId: student.id,
      original: 'Present',
      proposed: 'Absent',
      reason: 'Synthetic reviewed correction',
      status: 'pending',
    } as const;
    expect(
      (await command(s, { type: 'correction-request', correction }, teacher.cookie)).status,
    ).toBe(200);
    expect(
      (
        await command(
          s,
          { type: 'correction-review', id: correction.id, approved: true },
          teacher.cookie,
        )
      ).status,
    ).toBe(403);
    expect(
      (await command(s, { type: 'correction-review', id: correction.id, approved: true })).status,
    ).toBe(200);
    const [stored] = await f.db
      .select()
      .from(attendanceRegister)
      .where(eq(attendanceRegister.institutionId, s.data.id));
    expect(stored?.originalMarks).toEqual({ [student.id]: 'Present' });
    expect(stored?.marks).toEqual({ [student.id]: 'Absent' });
    const other = await enabledSchool();
    const foreign = await f.createCandidate(other, f.input(other, 'admitted'));
    if (!stored || !foreign.candidate.studentId)
      throw new Error('Synthetic tenant constraint fixture missing');
    await expect(
      f.db.insert(attendanceRegisterMark).values({
        institutionId: s.data.id,
        registerId: stored.id,
        studentId: foreign.candidate.studentId,
        mark: 'Present',
      }),
    ).rejects.toThrow();
    const foreignClass = `${randomUUID()}|A`;
    expect((await command(s, { ...submit, classId: foreignClass }, teacher.cookie)).status).toBe(
      403,
    );
  });
  it('uploads real evidence and locks approved/paid expenses', async () => {
    const s = await enabledSchool();
    expect((await command(s, { type: 'category-add', category: 'Utilities' })).status).toBe(200);
    const uploaded = await f.request(
      `${base(s)}/evidence`,
      'POST',
      {
        name: 'synthetic-bill.pdf',
        mediaType: 'application/pdf',
        content: Buffer.from('%PDF-1.4\nsynthetic test document').toString('base64'),
      },
      s.cookie,
    );
    expect(uploaded.status).toBe(201);
    const evidence = schoolEvidenceSchema.parse(await uploaded.json());
    const download = await f.request(
      `${base(s)}/evidence/${evidence.id}`,
      'GET',
      undefined,
      s.cookie,
    );
    expect(download.status).toBe(200);
    expect(download.headers.get('content-disposition')).toContain('attachment');
    const e = {
      id: randomUUID(),
      description: 'Synthetic electricity bill',
      category: 'Utilities',
      payee: 'Synthetic utility',
      reference: 'TEST-1',
      amount: 20000,
      date: (await snapshot(s)).today,
      status: 'pending',
      paid: false,
      attachment: evidence.id,
      notes: '',
      reviewNote: '',
      history: [],
      voucher: '',
    } as const;
    expect(
      (await command(s, { type: 'expense-save', expense: { ...e, history: [] } })).status,
    ).toBe(200);
    expect((await command(s, { type: 'expense-pay', id: e.id })).status).toBe(409);
    expect(
      (
        await command(s, {
          type: 'expense-review',
          id: e.id,
          approved: true,
          note: 'Synthetic approval',
        })
      ).status,
    ).toBe(200);
    expect(
      (await command(s, { type: 'expense-save', expense: { ...e, history: [] } })).status,
    ).toBe(409);
    expect((await command(s, { type: 'expense-pay', id: e.id })).status).toBe(200);
    const stored = (await snapshot(s)).state.expenses.find((x) => x.id === e.id);
    expect(stored?.paid).toBe(true);
    expect(stored?.paidBy).toBe('Synthetic school Admin');
  });
  it('requires complete routines and checks actual teacher/room conflicts across classes', async () => {
    const s = await enabledSchool();
    const teacher = await assignTeacher(s);
    const setup = {
      type: 'routine-configure',
      days: ['Sunday'],
      effective: '2027-01-01',
      periods: [{ id: '1', start: '08:00', end: '08:40' }],
      className: 'Class 6 · A',
    } as const;
    expect(
      (await command(s, { ...setup, days: [...setup.days], periods: [...setup.periods] })).status,
    ).toBe(200);
    expect((await command(s, { type: 'routine-publish', note: '' })).status).toBe(409);
    expect(
      (
        await command(s, {
          type: 'lesson-save',
          lesson: {
            id: 'Sunday-1',
            day: 'Sunday',
            period: '1',
            subject: 'Bangla',
            teacher: teacher.id,
            room: 'Room 1',
          },
        })
      ).status,
    ).toBe(200);
    expect(
      (await command(s, { type: 'routine-publish', note: 'Synthetic first version' })).status,
    ).toBe(200);
    expect(
      (
        await command(s, {
          type: 'offering-save',
          offering: {
            id: randomUUID(),
            className: 'Class 7',
            session: '2027',
            sections: 'A',
            capacity: '40',
            teacher: teacher.id,
            active: true,
          },
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await command(s, {
          ...setup,
          days: [...setup.days],
          periods: [...setup.periods],
          className: 'Class 7 · A',
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await command(s, {
          type: 'lesson-save',
          lesson: {
            id: 'Sunday-1',
            day: 'Sunday',
            period: '1',
            subject: 'English',
            teacher: teacher.id,
            room: 'Room 2',
          },
        })
      ).status,
    ).toBe(200);
    expect((await command(s, { type: 'routine-publish', note: 'Synthetic conflict' })).status).toBe(
      409,
    );
    const latest = await snapshot(s);
    expect(latest.state.routine.published).toBe(false);
    expect(latest.routineConflicts).toHaveLength(1);
  });
  it('protects the last administrator and denies unauthorized settings changes', async () => {
    const s = await enabledSchool();
    const t = await assignTeacher(s);
    expect(
      (await command(s, { type: 'member-update', id: s.adminId, role: 'Teacher', active: true }))
        .status,
    ).toBe(409);
    expect(
      (
        await command(
          s,
          { type: 'settings-save', values: { name: 'Escalation attempt' } },
          t.cookie,
        )
      ).status,
    ).toBe(403);
    expect(
      (await command(s, { type: 'member-update', id: t.id, role: 'Admin', active: true })).status,
    ).toBe(200);
    const replayRevision = (await snapshot(s, t.cookie)).revision;
    const replayKey = randomUUID();
    const replayAction = { type: 'settings-save', values: { session: '2027' } } as const;
    expect((await command(s, replayAction, t.cookie, replayRevision, replayKey)).status).toBe(200);
    expect(
      (await command(s, { type: 'member-update', id: t.id, role: 'Teacher', active: true })).status,
    ).toBe(200);
    expect((await command(s, replayAction, t.cookie, replayRevision, replayKey)).status).toBe(403);
    await f.request(`/api/v1/platform/institutions/${s.data.id}/modules`, 'PUT', {
      enabledModules: ['admissions'],
    });
    expect((await command(s, { type: 'routine-publish', note: '' })).status).toBe(403);
    expect((await snapshot(s)).state.expenses).toEqual([]);
  });
});
