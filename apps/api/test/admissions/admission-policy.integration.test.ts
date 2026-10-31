import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq } from '@eduos/database';
import { admissionCandidate, followUpReminder, membership } from '@eduos/database/schema';
import { candidateDetailSchema } from '@eduos/contracts';
import { createAdmissionsFixture } from '../admissions-fixture.js';
import { deliverFollowUps } from '../../src/services/communication/follow-ups.js';
const fixture = createAdmissionsFixture();
let school: Awaited<ReturnType<typeof fixture.createSchool>>;
beforeAll(async () => {
  await fixture.setup();
  school = await fixture.createSchool();
});
afterAll(() => fixture.cleanup());
const baseAction = () => ({
  operationKey: randomUUID(),
  version: 1,
  action: 'call',
  outcome: 'needs_time',
  followUpDate: null,
  note: '',
  collectWillingFee: false,
  collectAdmissionFee: false,
});
const call = (id: string, input: unknown) =>
  fixture.request(`${school.base}/candidates/${id}/actions`, 'POST', input, school.cookie);
describe('admission policy boundaries', () => {
  it('keeps registration separate when configured and preserves the fee snapshot after settings change', async () => {
    await fixture.admissions.updateSettings(school.adminId, school.data.id, {
      ...school.settings,
      creditWillingFee: false,
    });
    const candidate = await fixture.createCandidate(school, {
      ...fixture.input(school, 'willing'),
      collectWillingFee: true,
    });
    await fixture.admissions.updateSettings(school.adminId, school.data.id, {
      ...school.settings,
      version: 2,
      admissionFeeMinor: 90000,
      creditWillingFee: true,
    });
    const response = await call(candidate.candidate.id, {
      ...baseAction(),
      action: 'admit',
      outcome: null,
      collectAdmissionFee: true,
    });
    expect(response.status).toBe(200);
    expect(
      candidateDetailSchema
        .parse(await response.json())
        .receipts.find((r) => r.kind === 'admission'),
    ).toMatchObject({ amountMinor: 50000, creditMinor: 0 });
  });
  it('allows a fee-free willing record with Fees disabled and denies collections and frozen-school access', async () => {
    const path = `/api/v1/platform/institutions/${school.data.id}`;
    await fixture.request(`${path}/modules`, 'PUT', { enabledModules: ['admissions'] });
    expect(
      (
        await fixture.request(
          `${school.base}/candidates`,
          'POST',
          fixture.input(school, 'willing'),
          school.cookie,
        )
      ).status,
    ).toBe(201);
    expect(
      (
        await fixture.request(
          `${school.base}/candidates`,
          'POST',
          { ...fixture.input(school, 'willing'), collectWillingFee: true },
          school.cookie,
        )
      ).status,
    ).toBe(403);
    await fixture.request(`${path}/status`, 'PUT', {
      status: 'frozen',
      reason: 'Synthetic access test',
    });
    expect(
      (await fixture.request(`${school.base}/setup`, 'GET', undefined, school.cookie)).status,
    ).toBe(403);
    await fixture.request(`${path}/status`, 'PUT', { status: 'active' });
    await fixture.request(`${path}/modules`, 'PUT', { enabledModules: ['admissions', 'fees'] });
  });
  it('requires new follow-up dates and cancels old jobs on reschedule and refusal', async () => {
    const candidate = await fixture.createCandidate(school);
    expect((await call(candidate.candidate.id, baseAction())).status).toBe(400);
    const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const response = await call(candidate.candidate.id, {
      ...baseAction(),
      followUpDate: date,
      outcome: 'no_answer',
      note: 'Synthetic unanswered call',
    });
    expect(response.status).toBe(200);
    const jobs = await fixture.db
      .select()
      .from(followUpReminder)
      .where(eq(followUpReminder.candidateId, candidate.candidate.id));
    expect(
      jobs
        .filter((job) => !job.cancelled)
        .every((job) => job.dueDate === date && job.candidateVersion === 2),
    ).toBe(true);
    expect(
      (
        await call(candidate.candidate.id, {
          ...baseAction(),
          version: 2,
          outcome: 'not_interested',
        })
      ).status,
    ).toBe(200);
    expect(
      await fixture.db
        .select()
        .from(followUpReminder)
        .where(
          and(
            eq(followUpReminder.candidateId, candidate.candidate.id),
            eq(followUpReminder.cancelled, false),
          ),
        ),
    ).toHaveLength(0);
  });
  it('recalculates pending reminder times and delivers one catch-up notice after downtime', async () => {
    const candidate = await fixture.createCandidate(school);
    const setup = await fixture.admissions.setup(school.adminId, school.data.id);
    const { timezone: _timezone, ...settings } = setup.settings;
    await fixture.admissions.updateSettings(school.adminId, school.data.id, {
      ...settings,
      reminderDaysBefore: 2,
      onDateTime: '10:30',
    });
    const [updated] = await fixture.db
      .select()
      .from(admissionCandidate)
      .where(eq(admissionCandidate.id, candidate.candidate.id));
    const active = await fixture.db
      .select()
      .from(followUpReminder)
      .where(
        and(
          eq(followUpReminder.candidateId, candidate.candidate.id),
          eq(followUpReminder.cancelled, false),
        ),
      );
    expect(active.every((job) => job.candidateVersion === updated?.version)).toBe(true);
    const onDate = active.find((job) => job.kind === 'on_date');
    if (!onDate) throw new Error('On-date reminder is missing');
    expect(onDate.deliverAt.toISOString().slice(11, 16)).toBe('04:30');
    await deliverFollowUps(fixture.db, new Date(onDate.deliverAt.getTime() + 86400000));
    await deliverFollowUps(fixture.db, new Date(onDate.deliverAt.getTime() + 86400000));
    const inbox = await fixture.admissions.notifications(school.adminId, school.data.id);
    expect(inbox.filter((n) => n.candidateId === candidate.candidate.id)).toHaveLength(1);
    const notification = inbox.find((n) => n.candidateId === candidate.candidate.id);
    if (!notification) throw new Error('Catch-up notice is missing');
    await fixture.admissions.readNotification(school.adminId, school.data.id, notification.id);
    expect(
      (await fixture.admissions.notifications(school.adminId, school.data.id)).find(
        (n) => n.id === notification.id,
      )?.read,
    ).toBe(true);
  });
  it('rechecks the recipient role before reminder delivery and enforces composite ownership constraints', async () => {
    const officer = await fixture.addStaff(school.data.id, 'admission_officer');
    const candidate = await fixture.createCandidate(school, {
      ...fixture.input(school),
      assigneeId: officer.id,
    });
    await fixture.db
      .update(membership)
      .set({ role: 'teacher' })
      .where(and(eq(membership.institutionId, school.data.id), eq(membership.userId, officer.id)));
    await deliverFollowUps(fixture.db, new Date(Date.now() + 20 * 86400000));
    const jobs = await fixture.db
      .select()
      .from(followUpReminder)
      .where(eq(followUpReminder.candidateId, candidate.candidate.id));
    expect(jobs.every((job) => !job.deliveredAt)).toBe(true);
    await expect(
      fixture.db.insert(followUpReminder).values({
        institutionId: school.data.id,
        candidateId: randomUUID(),
        recipientId: officer.id,
        candidateVersion: 1,
        dueDate: '2027-01-01',
        kind: 'before',
        deliverAt: new Date(),
      }),
    ).rejects.toThrow();
  });
  it('reassigns through Admin authority and prevents collecting a willing fee twice after reopening', async () => {
    const officer = await fixture.addStaff(school.data.id, 'admission_officer');
    const candidate = await fixture.createCandidate(school, {
      ...fixture.input(school, 'willing'),
      collectWillingFee: true,
    });
    const reassigned = await call(candidate.candidate.id, {
      ...baseAction(),
      action: 'edit',
      outcome: null,
      assigneeId: officer.id,
    });
    expect(reassigned.status).toBe(200);
    expect(
      (
        await fixture.request(
          `${school.base}/candidates/${candidate.candidate.id}`,
          'GET',
          undefined,
          officer.cookie,
        )
      ).status,
    ).toBe(200);
    const date = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    expect(
      (
        await call(candidate.candidate.id, {
          ...baseAction(),
          version: 2,
          action: 'reopen',
          outcome: null,
          followUpDate: date,
        })
      ).status,
    ).toBe(200);
    const duplicate = await call(candidate.candidate.id, {
      ...baseAction(),
      version: 3,
      action: 'willing',
      outcome: null,
      collectWillingFee: true,
    });
    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toMatchObject({
      error: { code: 'WILLING_FEE_ALREADY_COLLECTED' },
    });
    const jobs = await fixture.db
      .select()
      .from(followUpReminder)
      .where(
        and(
          eq(followUpReminder.candidateId, candidate.candidate.id),
          eq(followUpReminder.cancelled, false),
        ),
      );
    expect(jobs.every((job) => job.recipientId === officer.id)).toBe(true);
    expect(
      (
        await call(candidate.candidate.id, {
          ...baseAction(),
          version: 3,
          action: 'willing',
          outcome: null,
        })
      ).status,
    ).toBe(200);
  });
});
