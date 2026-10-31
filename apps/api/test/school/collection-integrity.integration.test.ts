import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from '@eduos/database';
import type { SchoolAction } from '@eduos/contracts';
import { monthlyFeeCharge, schoolFeePayment, schoolOperation } from '@eduos/database/schema';
import { createSchoolFixture } from '../school-fixture.js';

const { f, snapshot, command, enabledSchool } = createSchoolFixture();

describe('collection transaction integrity', () => {
  beforeAll(() => f.setup());
  afterAll(() => f.cleanup());

  async function account() {
    const school = await enabledSchool();
    const view = await snapshot(school);
    const detail = await f.createCandidate(school, {
      ...f.input(school, 'admitted'),
      admissionFees: [
        {
          type: 'monthly',
          label: 'Synthetic tuition',
          amountMinor: 10000,
          billingStartDate: view.today,
          billingEndDate: null,
        },
      ],
    });
    const schedule = detail.monthlyBilling.schedules[0];
    if (!schedule) throw new Error('Synthetic schedule missing');
    const chargeId = randomUUID();
    await f.db.insert(monthlyFeeCharge).values({
      id: chargeId,
      institutionId: school.data.id,
      scheduleId: schedule.id,
      dueDate: view.today,
      amountMinor: 10000,
    });
    return { school, candidateId: detail.candidate.id, chargeId };
  }

  it('allows only one competing cashier to collect the remaining balance', async () => {
    const { school, candidateId, chargeId } = await account();
    const cashier = await f.addStaff(school.data.id, 'teacher');
    expect(
      (
        await command(school, {
          type: 'member-update',
          id: cashier.id,
          role: 'Accountant',
          active: true,
        })
      ).status,
    ).toBe(200);
    const view = await snapshot(school);
    const action: Extract<SchoolAction, { type: 'collect' }> = {
      type: 'collect',
      candidateId,
      date: view.today,
      allocations: [{ chargeId, amount: 10000 }],
    };
    const results = await Promise.all([
      command(school, action, school.cookie, view.revision),
      command(school, action, cashier.cookie, view.revision),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    const latest = await snapshot(school);
    expect(latest.state.charges.find((charge) => charge.id === chargeId)?.paid).toBe(10000);
    expect(latest.revision).toBe(view.revision + 1);
    expect(
      await f.db
        .select()
        .from(schoolFeePayment)
        .where(eq(schoolFeePayment.institutionId, school.data.id)),
    ).toHaveLength(1);
    // Reloading the revision must still reject collecting the already settled charge.
    expect((await command(school, action, cashier.cookie, latest.revision)).status).toBe(409);
  });

  it('leaves no receipt, allocation or operation after an invalid multi-charge collection', async () => {
    const { school, candidateId, chargeId } = await account();
    const view = await snapshot(school);
    const operationKey = randomUUID();
    const action: Extract<SchoolAction, { type: 'collect' }> = {
      type: 'collect',
      candidateId,
      date: view.today,
      allocations: [
        { chargeId, amount: 3000 },
        { chargeId: randomUUID(), amount: 1000 },
      ],
    };
    expect((await command(school, action, school.cookie, view.revision, operationKey)).status).toBe(
      403,
    );
    const latest = await snapshot(school);
    expect(latest.revision).toBe(view.revision);
    expect(latest.state.charges.find((charge) => charge.id === chargeId)?.paid).toBe(0);
    expect(
      await f.db
        .select()
        .from(schoolFeePayment)
        .where(eq(schoolFeePayment.institutionId, school.data.id)),
    ).toHaveLength(0);
    expect(
      await f.db
        .select()
        .from(schoolOperation)
        .where(eq(schoolOperation.operationKey, operationKey)),
    ).toHaveLength(0);
    expect(
      (
        await command(
          school,
          {
            ...action,
            allocations: [{ chargeId, amount: 3000 }],
          },
          school.cookie,
          view.revision,
          operationKey,
        )
      ).status,
    ).toBe(200);
    expect(
      (await snapshot(school)).state.charges.find((charge) => charge.id === chargeId)?.paid,
    ).toBe(3000);
  });
});
