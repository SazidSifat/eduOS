import { randomUUID } from 'node:crypto';
import { and, eq, type DatabaseTransaction } from '@eduos/database';
import { admissionCharge, admissionPayment, admissionReceipt } from '@eduos/database/schema';
import type { AdmissionFeeItem } from '@eduos/contracts';
import { AdmissionError } from '../admissions/errors.js';

export async function registrationCredit(
  tx: DatabaseTransaction,
  institutionId: string,
  candidateId: string,
) {
  const [row] = await tx
    .select({ amount: admissionPayment.amountMinor })
    .from(admissionPayment)
    .innerJoin(
      admissionCharge,
      and(
        eq(admissionCharge.id, admissionPayment.chargeId),
        eq(admissionCharge.institutionId, admissionPayment.institutionId),
      ),
    )
    .where(
      and(
        eq(admissionCharge.institutionId, institutionId),
        eq(admissionCharge.candidateId, candidateId),
        eq(admissionCharge.kind, 'willing'),
      ),
    );
  return row?.amount ?? 0;
}
export async function collectAdmissionCharge(
  tx: DatabaseTransaction,
  input: {
    institutionId: string;
    candidateId: string;
    collectorId: string;
    kind: 'willing' | 'admission';
    amountMinor: number;
    creditMinor: number;
    collect: boolean;
  },
) {
  const payable = input.amountMinor - input.creditMinor;
  if (payable > 0 && !input.collect)
    throw new AdmissionError(
      'FEE_COLLECTION_REQUIRED',
      'Confirm collection of the required admission fee.',
    );
  const chargeId = randomUUID();
  await tx.insert(admissionCharge).values({
    id: chargeId,
    institutionId: input.institutionId,
    candidateId: input.candidateId,
    kind: input.kind,
    amountMinor: input.amountMinor,
    creditMinor: input.creditMinor,
  });
  if (!payable) return;
  const paymentId = randomUUID();
  await tx.insert(admissionPayment).values({
    id: paymentId,
    institutionId: input.institutionId,
    chargeId,
    collectorId: input.collectorId,
    amountMinor: payable,
    method: 'cash',
  });
  await tx.insert(admissionReceipt).values({
    institutionId: input.institutionId,
    paymentId,
    number: `RC-${randomUUID().toUpperCase()}`,
  });
}
export async function admissionReceipts(
  tx: DatabaseTransaction,
  institutionId: string,
  candidateId: string,
  feeItems: AdmissionFeeItem[],
) {
  const rows = await tx
    .select({
      id: admissionReceipt.id,
      number: admissionReceipt.number,
      kind: admissionCharge.kind,
      amountMinor: admissionPayment.amountMinor,
      creditMinor: admissionCharge.creditMinor,
      createdAt: admissionPayment.createdAt,
    })
    .from(admissionCharge)
    .innerJoin(
      admissionPayment,
      and(
        eq(admissionPayment.chargeId, admissionCharge.id),
        eq(admissionPayment.institutionId, admissionCharge.institutionId),
      ),
    )
    .innerJoin(
      admissionReceipt,
      and(
        eq(admissionReceipt.paymentId, admissionPayment.id),
        eq(admissionReceipt.institutionId, admissionPayment.institutionId),
      ),
    )
    .where(
      and(
        eq(admissionCharge.institutionId, institutionId),
        eq(admissionCharge.candidateId, candidateId),
      ),
    );
  return rows.map((row) => ({
    ...row,
    feeItems:
      row.kind === 'admission'
        ? feeItems
        : [
            {
              type: 'other',
              label: 'Willing fee',
              amountMinor: row.amountMinor,
              billingStartDate: null,
              billingEndDate: null,
            },
          ],
    createdAt: row.createdAt.toISOString(),
  }));
}
