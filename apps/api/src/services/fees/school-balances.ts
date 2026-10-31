import { and, eq, sql, desc, type DatabaseTransaction } from '@eduos/database';
import { schoolFeeAllocation, schoolFeeReversal, schoolFeePayment } from '@eduos/database/schema';
export async function allocatedToCharge(
  tx: DatabaseTransaction,
  institutionId: string,
  chargeId: string,
) {
  const [sum] = await tx
    .select({ amount: sql<string>`coalesce(sum(${schoolFeeAllocation.amountMinor}), 0)::text` })
    .from(schoolFeeAllocation)
    .leftJoin(
      schoolFeeReversal,
      and(
        eq(schoolFeeReversal.institutionId, schoolFeeAllocation.institutionId),
        eq(schoolFeeReversal.paymentId, schoolFeeAllocation.paymentId),
      ),
    )
    .where(
      and(
        eq(schoolFeeAllocation.institutionId, institutionId),
        eq(schoolFeeAllocation.chargeId, chargeId),
        sql`${schoolFeeReversal.id} is null`,
      ),
    );
  return Number(sum?.amount ?? 0);
}

export async function schoolAllocatedBalances(tx: DatabaseTransaction, institutionId: string) {
  const rows = await tx
    .select({ chargeId: schoolFeeAllocation.chargeId, amount: schoolFeeAllocation.amountMinor })
    .from(schoolFeeAllocation)
    .leftJoin(
      schoolFeeReversal,
      and(
        eq(schoolFeeReversal.institutionId, schoolFeeAllocation.institutionId),
        eq(schoolFeeReversal.paymentId, schoolFeeAllocation.paymentId),
      ),
    )
    .where(
      and(
        eq(schoolFeeAllocation.institutionId, institutionId),
        sql`${schoolFeeReversal.id} is null`,
      ),
    );
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.chargeId, (totals.get(row.chargeId) ?? 0) + row.amount);
  return totals;
}

export async function schoolChargeReceipts(tx: DatabaseTransaction, institutionId: string) {
  const rows = await tx
    .select({
      chargeId: schoolFeeAllocation.chargeId,
      id: schoolFeePayment.id,
      createdAt: schoolFeePayment.createdAt,
    })
    .from(schoolFeeAllocation)
    .innerJoin(
      schoolFeePayment,
      and(
        eq(schoolFeePayment.institutionId, schoolFeeAllocation.institutionId),
        eq(schoolFeePayment.id, schoolFeeAllocation.paymentId),
      ),
    )
    .leftJoin(
      schoolFeeReversal,
      and(
        eq(schoolFeeReversal.institutionId, schoolFeePayment.institutionId),
        eq(schoolFeeReversal.paymentId, schoolFeePayment.id),
      ),
    )
    .where(
      and(
        eq(schoolFeeAllocation.institutionId, institutionId),
        sql`${schoolFeeReversal.id} is null`,
      ),
    )
    .orderBy(desc(schoolFeePayment.createdAt), schoolFeePayment.id);
  const receipts = new Map<string, { id: string; createdAt: Date }>();
  for (const row of rows)
    if (!receipts.has(row.chargeId))
      receipts.set(row.chargeId, { id: row.id, createdAt: row.createdAt });
  return receipts;
}
