import { randomUUID } from 'node:crypto';
import { and, eq, desc, sql, type DatabaseTransaction } from '@eduos/database';
import { monthlyFeeSchedule, monthlyFeeCharge, monthlyFeePayment } from '@eduos/database/schema';
import { monthlyBillingSchema } from '@eduos/contracts';
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
  return monthlyBillingSchema.parse({
    schedules,
    charges: charges.map((row) => ({ ...row, paidAt: row.paidAt?.toISOString() ?? null })),
    outstandingMinor: Number(balance?.amount ?? 0),
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
  const [payment] = await tx
    .insert(monthlyFeePayment)
    .values({
      institutionId: input.institutionId,
      chargeId: charge.id,
      amountMinor: charge.amountMinor,
      collectorId: input.collectorId,
      receiptNumber: `MR-${randomUUID().toUpperCase()}`,
    })
    .onConflictDoNothing({ target: [monthlyFeePayment.institutionId, monthlyFeePayment.chargeId] })
    .returning();
  return Boolean(payment);
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
