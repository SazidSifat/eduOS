import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq } from '@eduos/database';
import {
  admissionCandidate,
  admissionCharge,
  followUpReminder,
  membership,
  studentEnrollment,
} from '@eduos/database/schema';
import { candidateDetailSchema, candidateListSchema } from '@eduos/contracts';
import { createAdmissionsFixture } from '../admissions-fixture.js';
import { deliverFollowUps } from '../../src/services/communication/follow-ups.js';
const fixture = createAdmissionsFixture();
let school: Awaited<ReturnType<typeof fixture.createSchool>>;
let other: Awaited<ReturnType<typeof fixture.createSchool>>;
let officer: Awaited<ReturnType<typeof fixture.addStaff>>;
beforeAll(async () => {
  await fixture.setup();
  school = await fixture.createSchool();
  other = await fixture.createSchool();
  officer = await fixture.addStaff(school.data.id, 'admission_officer');
});
afterAll(async () => {
  await fixture.cleanup();
});
const action = (
  version: number,
  change: 'admit' | 'willing' | 'call' | 'close' | 'reopen',
  extra: Record<string, unknown> = {},
) => ({
  operationKey: randomUUID(),
  version,
  action: change,
  outcome: null,
  followUpDate: null,
  note: '',
  collectWillingFee: false,
  collectAdmissionFee: false,
  ...extra,
});
async function change(id: string, input: ReturnType<typeof action>, cookie = school.cookie) {
  return fixture.request(`${school.base}/candidates/${id}/actions`, 'POST', input, cookie);
}

describe('school admissions', () => {
  it('creates willing without a fee, charge, receipt or reminder; retries return the same record', async () => {
    const input = fixture.input(school, 'willing');
    const first = await fixture.createCandidate(school, input);
    const again = await fixture.createCandidate(school, input);
    expect(again.candidate.id).toBe(first.candidate.id);
    expect(first.receipts).toEqual([]);
    expect(
      await fixture.db
        .select()
        .from(admissionCharge)
        .where(eq(admissionCharge.candidateId, first.candidate.id)),
    ).toHaveLength(0);
    expect(
      await fixture.db
        .select()
        .from(followUpReminder)
        .where(eq(followUpReminder.candidateId, first.candidate.id)),
    ).toHaveLength(0);
    expect(
      (
        await fixture.request(
          `${school.base}/candidates`,
          'POST',
          { ...input, collectWillingFee: true },
          school.cookie,
        )
      ).status,
    ).toBe(409);
  });
  it('collects an optional willing fee once and credits it toward admission', async () => {
    const input = { ...fixture.input(school, 'willing'), collectWillingFee: true };
    const first = await fixture.createCandidate(school, input);
    await fixture.createCandidate(school, input);
    expect(first.receipts).toHaveLength(1);
    expect(first.receipts[0]?.amountMinor).toBe(10000);
    const request = action(first.candidate.version, 'admit', { collectAdmissionFee: true });
    const response = await change(first.candidate.id, request);
    expect(response.status).toBe(200);
    const admitted = candidateDetailSchema.parse(await response.json());
    expect(admitted.candidate.state).toBe('admitted');
    expect(admitted.candidate.studentId).toBeTruthy();
    expect(admitted.receipts.find((r) => r.kind === 'admission')).toMatchObject({
      amountMinor: 40000,
      creditMinor: 10000,
    });
    expect((await change(first.candidate.id, request)).status).toBe(200);
    expect(
      await fixture.db
        .select()
        .from(studentEnrollment)
        .where(eq(studentEnrollment.studentId, admitted.candidate.studentId ?? randomUUID())),
    ).toHaveLength(1);
  });
  it('rolls back direct admission if collection is missing and rejects incomplete identity details', async () => {
    const input = { ...fixture.input(school, 'admitted'), collectAdmissionFee: false };
    const response = await fixture.request(
      `${school.base}/candidates`,
      'POST',
      input,
      school.cookie,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'FEE_COLLECTION_REQUIRED' } });
    const incomplete = fixture.input(school, 'willing');
    incomplete.profile.birthCertificate = '';
    incomplete.assigneeId = officer.id;
    expect(
      (await fixture.request(`${school.base}/candidates`, 'POST', incomplete, officer.cookie))
        .status,
    ).toBe(400);
    const accepted = await fixture.createCandidate(school, { ...input, collectAdmissionFee: true });
    expect(accepted.receipts).toHaveLength(1);
  });
  it('limits Admission Officers to assigned records and denies foreign schools, teachers and platform operators', async () => {
    const candidate = await fixture.createCandidate(school);
    expect(
      (
        await fixture.request(
          `${school.base}/candidates/${candidate.candidate.id}`,
          'GET',
          undefined,
          officer.cookie,
        )
      ).status,
    ).toBe(403);
    const ownInput = { ...fixture.input(school), assigneeId: officer.id };
    const ownResponse = await fixture.request(
      `${school.base}/candidates`,
      'POST',
      ownInput,
      officer.cookie,
    );
    expect(ownResponse.status).toBe(201);
    const list = await fixture.request(
      `${school.base}/candidates`,
      'GET',
      undefined,
      officer.cookie,
    );
    expect(
      candidateListSchema
        .parse(await list.json())
        .items.every((row) => row.id !== candidate.candidate.id),
    ).toBe(true);
    expect(
      (
        await fixture.request(
          `${school.base}/candidates/${candidate.candidate.id}`,
          'GET',
          undefined,
          other.cookie,
        )
      ).status,
    ).toBe(403);
    expect((await fixture.request(`${school.base}/candidates`, 'GET')).status).toBe(403);
    expect((await fixture.request(`${school.base}/candidates`, 'GET', undefined, '')).status).toBe(
      401,
    );
    const teacher = await fixture.addStaff(school.data.id, 'teacher');
    expect(
      (await fixture.request(`${school.base}/candidates`, 'GET', undefined, teacher.cookie)).status,
    ).toBe(403);
    await fixture.db
      .update(membership)
      .set({ active: false })
      .where(and(eq(membership.institutionId, school.data.id), eq(membership.userId, officer.id)));
    expect(
      (await fixture.request(`${school.base}/candidates`, 'GET', undefined, officer.cookie)).status,
    ).toBe(403);
    await fixture.db
      .update(membership)
      .set({ active: true })
      .where(and(eq(membership.institutionId, school.data.id), eq(membership.userId, officer.id)));
    expect(
      (
        await fixture.request(
          `${school.base}/candidates`,
          'POST',
          { ...fixture.input(school), offeringId: other.offering.id },
          school.cookie,
        )
      ).status,
    ).toBe(400);
  });
  it('reschedules calls, delivers reminders once and cancels them on willingness', async () => {
    const candidate = await fixture.createCandidate(school);
    const jobs = await fixture.db
      .select()
      .from(followUpReminder)
      .where(eq(followUpReminder.candidateId, candidate.candidate.id));
    expect(jobs).toHaveLength(2);
    const before = jobs.find((job) => job.kind === 'before');
    const onDate = jobs.find((job) => job.kind === 'on_date');
    if (!before || !onDate) throw new Error('Both reminder jobs are required');
    expect(onDate.deliverAt.toISOString().slice(11, 16)).toBe('03:00');
    await deliverFollowUps(fixture.db, before.deliverAt);
    await deliverFollowUps(fixture.db, before.deliverAt);
    expect(
      (
        await fixture.db.select().from(followUpReminder).where(eq(followUpReminder.id, before.id))
      )[0]?.deliveredAt,
    ).not.toBeNull();
    const willing = await change(
      candidate.candidate.id,
      action(candidate.candidate.version, 'willing'),
    );
    expect(willing.status).toBe(200);
    await deliverFollowUps(fixture.db, onDate.deliverAt);
    expect(
      (
        await fixture.db.select().from(followUpReminder).where(eq(followUpReminder.id, onDate.id))
      )[0]?.deliveredAt,
    ).toBeNull();
    const activeJobs = await fixture.db
      .select()
      .from(followUpReminder)
      .where(
        and(
          eq(followUpReminder.candidateId, candidate.candidate.id),
          eq(followUpReminder.cancelled, false),
        ),
      );
    expect(activeJobs.filter((job) => !job.deliveredAt)).toHaveLength(0);
  });
  it('serializes concurrent confirmations and rolls back a duplicate enrollment after fee posting', async () => {
    const candidate = await fixture.createCandidate(school);
    const responses = await Promise.all([
      change(candidate.candidate.id, action(1, 'admit', { collectAdmissionFee: true })),
      change(candidate.candidate.id, action(1, 'admit', { collectAdmissionFee: true })),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    const original = await fixture.request(
      `${school.base}/candidates/${candidate.candidate.id}`,
      'GET',
      undefined,
      school.cookie,
    );
    const admitted = candidateDetailSchema.parse(await original.json());
    const duplicate = await fixture.createCandidate(school, {
      ...fixture.input(school),
      profile: admitted.profile,
    });
    expect(
      (await change(duplicate.candidate.id, action(1, 'admit', { collectAdmissionFee: true })))
        .status,
    ).toBe(409);
    expect(
      await fixture.db
        .select()
        .from(admissionCharge)
        .where(eq(admissionCharge.candidateId, duplicate.candidate.id)),
    ).toHaveLength(0);
    expect(
      (
        await fixture.db
          .select()
          .from(admissionCandidate)
          .where(eq(admissionCandidate.id, duplicate.candidate.id))
      )[0]?.state,
    ).toBe('follow_up');
  });
});
