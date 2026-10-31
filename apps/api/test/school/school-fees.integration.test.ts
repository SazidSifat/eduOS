import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { eq } from '@eduos/database';
import { monthlyFeeCharge, schoolFeePayment } from '@eduos/database/schema';
import { schoolCommandResultSchema, type SchoolAction } from '@eduos/contracts';
import { createSchoolFixture } from '../school-fixture.js';
const { f, command, snapshot, enabledSchool } = createSchoolFixture();
describe('live school fee ledger', () => {
  beforeAll(() => f.setup());
  afterAll(() => f.cleanup());
  it('posts partial payments once, refuses excessive allocations and keeps reversals attributable', async () => {
    const s = await enabledSchool();
    const detail = await f.createCandidate(s, {
      ...f.input(s, 'admitted'),
      admissionFees: [
        {
          type: 'monthly',
          label: 'Tuition',
          amountMinor: 10000,
          billingStartDate: (await snapshot(s)).today,
          billingEndDate: null,
        },
      ],
    });
    const schedule = detail.monthlyBilling.schedules[0];
    if (!schedule) throw new Error('Synthetic monthly schedule missing');
    const chargeId = randomUUID();
    await f.db.insert(monthlyFeeCharge).values({
      id: chargeId,
      institutionId: s.data.id,
      scheduleId: schedule.id,
      dueDate: '2026-11-01',
      amountMinor: 10000,
    });
    const state = await snapshot(s);
    const action: Extract<SchoolAction, { type: 'collect' }> = {
      type: 'collect',
      candidateId: detail.candidate.id,
      allocations: [{ chargeId, amount: 3000 }],
      date: state.today,
    };
    const key = randomUUID();
    const r = await command(s, action, s.cookie, state.revision, key);
    expect(r.status).toBe(200);
    const receipt = schoolCommandResultSchema.parse(await r.json());
    expect((await command(s, action, s.cookie, state.revision, key)).status).toBe(200);
    let latest = await snapshot(s);
    expect(latest.state.charges.find((c) => c.id === chargeId)?.paid).toBe(3000);
    expect(
      (await command(s, { ...action, allocations: [{ chargeId, amount: 8000 }] })).status,
    ).toBe(409);
    expect(
      (
        await command(s, {
          ...action,
          allocations: [
            { chargeId, amount: 100 },
            { chargeId, amount: 100 },
          ],
        })
      ).status,
    ).toBe(400);
    expect(
      (await command(s, { ...action, allocations: [{ chargeId: randomUUID(), amount: 100 }] }))
        .status,
    ).toBe(403);
    const payments = await f.db
      .select()
      .from(schoolFeePayment)
      .where(eq(schoolFeePayment.institutionId, s.data.id));
    expect(payments).toHaveLength(1);
    if (!receipt.id) throw new Error('Synthetic receipt missing');
    const completed = await f.admissions.collectMonthlyFee(
      s.adminId,
      s.data.id,
      detail.candidate.id,
      chargeId,
    );
    expect(completed.monthlyBilling.outstandingMinor).toBe(0);
    expect(completed.monthlyBilling.charges.find((c) => c.id === chargeId)).toMatchObject({
      paidMinor: 10000,
    });
    expect(completed.monthlyBilling.charges.find((c) => c.id === chargeId)?.paidAt).toBeTruthy();
    await f.admissions.collectMonthlyFee(s.adminId, s.data.id, detail.candidate.id, chargeId);
    expect(
      await f.db
        .select()
        .from(schoolFeePayment)
        .where(eq(schoolFeePayment.institutionId, s.data.id)),
    ).toHaveLength(2);
    expect(
      (
        await command(s, {
          type: 'reverse',
          paymentId: receipt.id,
          reason: 'Synthetic receipt correction',
        })
      ).status,
    ).toBe(200);
    latest = await snapshot(s);
    expect(latest.state.charges.find((c) => c.id === chargeId)?.paid).toBe(7000);
    expect(latest.state.payments.find((p) => p.id === receipt.id)?.reversed).toBe(
      'Synthetic receipt correction',
    );
    const legacyDetail = await f.admissions.detail(s.adminId, s.data.id, detail.candidate.id);
    expect(legacyDetail.monthlyBilling.outstandingMinor).toBe(3000);
  });
});
