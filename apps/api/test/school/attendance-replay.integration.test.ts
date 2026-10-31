import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createSchoolFixture } from '../school-fixture.js';

const { f, snapshot, command, enabledSchool, assignTeacher } = createSchoolFixture();

describe('attendance operation replay authorization', () => {
  beforeAll(() => f.setup());
  afterAll(() => f.cleanup());

  it('denies replay of a saved register and correction after the teacher loses the class', async () => {
    const school = await enabledSchool();
    const teacher = await assignTeacher(school);
    const detail = await f.createCandidate(school, f.input(school, 'admitted'));
    const view = await snapshot(school, teacher.cookie);
    const cls = view.classes.find((item) => item.id.startsWith(school.offering.id));
    const studentId = detail.candidate.studentId;
    if (!cls || !studentId) throw new Error('Synthetic enrollment missing');
    const save = {
      type: 'attendance-save',
      classId: cls.id,
      date: view.today,
      marks: { [studentId]: 'Present' },
      submit: true,
    } as const;
    const saveKey = randomUUID();
    expect((await command(school, save, teacher.cookie, view.revision, saveKey)).status).toBe(200);
    const saved = await snapshot(school, teacher.cookie);
    const register = saved.state.registers[0];
    if (!register) throw new Error('Synthetic register missing');
    const correction = {
      type: 'correction-request',
      correction: {
        id: randomUUID(),
        registerId: register.id,
        studentId,
        original: 'Present',
        proposed: 'Absent',
        reason: 'Synthetic correction',
        status: 'pending',
      },
    } as const;
    const correctionKey = randomUUID();
    expect(
      (await command(school, correction, teacher.cookie, saved.revision, correctionKey)).status,
    ).toBe(200);
    expect(
      (await command(school, correction, teacher.cookie, saved.revision, correctionKey)).status,
    ).toBe(200);
    const adminView = await snapshot(school);
    const offering = adminView.state.offerings.find((item) => item.id === school.offering.id);
    if (!offering) throw new Error('Synthetic offering missing');
    expect(
      (await command(school, { type: 'offering-save', offering: { ...offering, teacher: '' } }))
        .status,
    ).toBe(200);
    expect((await command(school, save, teacher.cookie, view.revision, saveKey)).status).toBe(403);
    expect(
      (await command(school, correction, teacher.cookie, saved.revision, correctionKey)).status,
    ).toBe(403);
  });
});
