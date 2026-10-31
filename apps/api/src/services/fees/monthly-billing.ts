import { randomUUID } from 'node:crypto';
import { and, eq, desc, sql, type DatabaseTransaction } from '@eduos/database';
import {
  monthlyFeeSchedule,
  monthlyFeeCharge,
  monthlyFeePayment,
  schoolFeePayment,
  schoolFeeAllocation,
  institution,
} from '@eduos/database/schema';
import { monthlyBillingSchema } from '@eduos/contracts';
import {
  allocatedToCharge,
  schoolAllocatedBalances,
  schoolChargeReceipts,
} from './school-balances.js';
import { forbidden } from '../../lib/errors.js';

export async function readMonthlyBilling(
  tx: DatabaseTransaction,
  institutionId: string,
  candidateId: string,
) {
  const schedules = await tx
    .select()
    .from(monthlyFeeSchedule)
    .where(
      and(
        eq(monthlyFeeSchedule.institutionId, institutionId),
        eq(monthlyFeeSchedule.candidateId, candidateId),
      ),
    )
    .orderBy(monthlyFeeSchedule.createdAt, monthlyFeeSchedule.id)
    .limit(20);
  const condition = and(
    eq(monthlyFeeSchedule.institutionId, institutionId),
    eq(monthlyFeeSchedule.candidateId, candidateId),
  );
  const charges = await tx
    .select({
      id: monthlyFeeCharge.id,
      label: monthlyFeeSchedule.label,
      dueDate: monthlyFeeCharge.dueDate,
      amountMinor: monthlyFeeCharge.amountMinor,
      receiptNumber: monthlyFeePayment.receiptNumber,
      paidAt: monthlyFeePayment.createdAt,
    })
    .from(monthlyFeeCharge)
    .innerJoin(
      monthlyFeeSchedule,
      and(
        eq(monthlyFeeSchedule.institutionId, monthlyFeeCharge.institutionId),
        eq(monthlyFeeSchedule.id, monthlyFeeCharge.scheduleId),
      ),
    )
    .leftJoin(
      monthlyFeePayment,
      and(
        eq(monthlyFeePayment.institutionId, monthlyFeeCharge.institutionId),
        eq(monthlyFeePayment.chargeId, monthlyFeeCharge.id),
      ),
    )
    .where(condition)
    .orderBy(desc(monthlyFeeCharge.dueDate), monthlyFeeCharge.id)
    .limit(100);
  const [balance] = await tx
    .select({ amount: sql<string>`coalesce(sum(${monthlyFeeCharge.amountMinor}), 0)::text` })
    .from(monthlyFeeCharge)
    .innerJoin(
      monthlyFeeSchedule,
      and(
        eq(monthlyFeeSchedule.institutionId, monthlyFeeCharge.institutionId),
        eq(monthlyFeeSchedule.id, monthlyFeeCharge.scheduleId),
      ),
    )
    .leftJoin(
      monthlyFeePayment,
      and(
        eq(monthlyFeePayment.institutionId, monthlyFeeCharge.institutionId),
        eq(monthlyFeePayment.chargeId, monthlyFeeCharge.id),
      ),
    )
    .where(and(condition, sql`${monthlyFeePayment.id} is null`));
  const paid = await schoolAllocatedBalances(tx, institutionId);
  const receipts = await schoolChargeReceipts(tx, institutionId);
  const allCharges = await tx
    .select({ id: monthlyFeeCharge.id })
    .from(monthlyFeeCharge)
    .innerJoin(
      monthlyFeeSchedule,
      and(
        eq(monthlyFeeSchedule.institutionId, monthlyFeeCharge.institutionId),
        eq(monthlyFeeSchedule.id, monthlyFeeCharge.scheduleId),
      ),
    )
    .where(condition);
  let allocated = 0;
  for (const charge of allCharges) allocated += paid.get(charge.id) ?? 0;
  return monthlyBillingSchema.parse({
    schedules,
    charges: charges.map((row) => {
      const paidMinor = row.paidAt ? row.amountMinor : (paid.get(row.id) ?? 0);
      const completed = paidMinor >= row.amountMinor ? receipts.get(row.id) : undefined;
      return {
        ...row,
        paidMinor,
        receiptNumber: row.receiptNumber ?? completed?.id ?? null,
        paidAt: (row.paidAt ?? completed?.createdAt)?.toISOString() ?? null,
      };
    }),
    outstandingMinor: Math.max(0, Number(balance?.amount ?? 0) - allocated),
  });
}
export async function collectMonthlyCharge(
  tx: DatabaseTransaction,
  input: { institutionId: string; candidateId: string; chargeId: string; collectorId: string },
) {
  const [charge] = await tx
    .select({ id: monthlyFeeCharge.id, amountMinor: monthlyFeeCharge.amountMinor })
    .from(monthlyFeeCharge)
    .innerJoin(
      monthlyFeeSchedule,
      and(
        eq(monthlyFeeSchedule.institutionId, monthlyFeeCharge.institutionId),
        eq(monthlyFeeSchedule.id, monthlyFeeCharge.scheduleId),
      ),
    )
    .where(
      and(
        eq(monthlyFeeCharge.institutionId, input.institutionId),
        eq(monthlyFeeCharge.id, input.chargeId),
        eq(monthlyFeeSchedule.candidateId, input.candidateId),
      ),
    );
  if (!charge) forbidden();
  const [legacy] = await tx
    .select()
    .from(monthlyFeePayment)
    .where(
      and(
        eq(monthlyFeePayment.institutionId, input.institutionId),
        eq(monthlyFeePayment.chargeId, charge.id),
      ),
    );
  const amountMinor =
    charge.amountMinor -
    (legacy?.amountMinor ?? 0) -
    (await allocatedToCharge(tx, input.institutionId, charge.id));
  if (amountMinor <= 0) return false;
  const id = randomUUID();
  const [school] = await tx
    .select({ timezone: institution.timezone })
    .from(institution)
    .where(eq(institution.id, input.institutionId));
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: school?.timezone ?? 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  await tx.insert(schoolFeePayment).values({
    id,
    institutionId: input.institutionId,
    candidateId: input.candidateId,
    collectorId: input.collectorId,
    amountMinor,
    date,
  });
  await tx.insert(schoolFeeAllocation).values({
    institutionId: input.institutionId,
    paymentId: id,
    chargeId: charge.id,
    amountMinor,
  });
  return true;
}
export async function stopMonthlySchedule(
  tx: DatabaseTransaction,
  institutionId: string,
  candidateId: string,
  scheduleId: string,
) {
  const [schedule] = await tx
    .select()
    .from(monthlyFeeSchedule)
    .where(
      and(
        eq(monthlyFeeSchedule.institutionId, institutionId),
        eq(monthlyFeeSchedule.candidateId, candidateId),
        eq(monthlyFeeSchedule.id, scheduleId),
      ),
    )
    .for('update');
  if (!schedule) forbidden();
  if (!schedule.active) return false;
  await tx
    .update(monthlyFeeSchedule)
    .set({ active: false })
    .where(
      and(
        eq(monthlyFeeSchedule.institutionId, institutionId),
        eq(monthlyFeeSchedule.id, scheduleId),
      ),
    );
  return true;
}
