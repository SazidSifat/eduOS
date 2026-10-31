import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { and, eq } from '@eduos/database';
import { admissionCandidate } from '@eduos/database/schema';
import { createSchoolFixture } from '../school-fixture.js';

const { f, snapshot, command, enabledSchool } = createSchoolFixture();

describe('admission operation replay authorization', () => {
  beforeAll(() => f.setup());
  afterAll(() => f.cleanup());

  it('denies replay when the candidate is reassigned', async () => {
    const school = await enabledSchool();
    const officer = await f.addStaff(school.data.id, 'admission_officer');
    const detail = await f.createCandidate(school, { ...f.input(school), assigneeId: officer.id });
    const view = await snapshot(school, officer.cookie);
    const action = {
      type: 'call',
      candidateId: detail.candidate.id,
      outcome: 'Not interested',
      note: 'Synthetic follow-up',
      nextCall: '',
    } as const;
    const key = randomUUID();
    expect((await command(school, action, officer.cookie, view.revision, key)).status).toBe(200);
    expect((await command(school, action, officer.cookie, view.revision, key)).status).toBe(200);
    await f.db
      .update(admissionCandidate)
      .set({ assigneeId: school.adminId })
      .where(
        and(
          eq(admissionCandidate.institutionId, school.data.id),
          eq(admissionCandidate.id, detail.candidate.id),
        ),
      );
    expect((await command(school, action, officer.cookie, view.revision, key)).status).toBe(403);
  });
});
