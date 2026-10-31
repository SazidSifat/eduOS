import { and, eq, asc, sql, type DatabaseTransaction } from '@eduos/database';
import { admissionFeeItem, monthlyFeeSchedule } from '@eduos/database/schema';
import { admissionFeeItemsSchema, type AdmissionFeeItem } from '@eduos/contracts';
import { AdmissionError } from '../admissions/errors.js';
import { nextMonthlyDate } from './monthly-dates.js';

export function defaultAdmissionFees(amountMinor: number): AdmissionFeeItem[] {
  return [
    {
      type: 'admission',
      label: 'Admission fees',
      amountMinor,
      billingStartDate: null,
      billingEndDate: null,
    },
  ];
}
export async function readAdmissionFees(
  tx: DatabaseTransaction,
  institutionId: string,
  candidateId: string,
  legacyAmount: number,
) {
  const rows = await tx
    .select()
    .from(admissionFeeItem)
    .where(
      and(
        eq(admissionFeeItem.institutionId, institutionId),
        eq(admissionFeeItem.candidateId, candidateId),
      ),
    )
    .orderBy(asc(admissionFeeItem.position));
  return admissionFeeItemsSchema.parse(
    rows.length
      ? rows.map(({ type, label, amountMinor, billingStartDate, billingEndDate }) => ({
          type,
          label,
          amountMinor,
          billingStartDate,
          billingEndDate,
        }))
      : defaultAdmissionFees(legacyAmount),
  );
}
export async function saveAdmissionFees(
  tx: DatabaseTransaction,
  input: {
    institutionId: string;
    candidateId: string;
    timezone: string;
    legacyAmount: number;
    items?: AdmissionFeeItem[];
  },
) {
  const items = admissionFeeItemsSchema.parse(
    input.items ?? defaultAdmissionFees(input.legacyAmount),
  );
  const today = await tx.execute<{ date: string }>(
    sql`select (now() at time zone ${input.timezone})::date::text as date`,
  );
  if (
    items.some(
      (item) =>
        item.type === 'monthly' &&
        item.billingStartDate &&
        item.billingStartDate < (today.rows[0]?.date ?? ''),
    )
  )
    throw new AdmissionError(
      'MONTHLY_START_DATE_PAST',
      'Choose today or a future date for the first monthly installment.',
    );
  const saved = await tx
    .insert(admissionFeeItem)
    .values(
      items.map((item, position) => ({
        ...item,
        position,
        institutionId: input.institutionId,
        candidateId: input.candidateId,
      })),
    )
    .returning();
  for (const item of saved) {
    if (item.type !== 'monthly' || !item.billingStartDate) continue;
    const nextDueDate = nextMonthlyDate(item.billingStartDate, item.billingStartDate);
    await tx.insert(monthlyFeeSchedule).values({
      institutionId: input.institutionId,
      candidateId: input.candidateId,
      feeItemId: item.id,
      label: item.label,
      amountMinor: item.amountMinor,
      startDate: item.billingStartDate,
      endDate: item.billingEndDate,
      nextDueDate,
      active: !item.billingEndDate || nextDueDate <= item.billingEndDate,
    });
  }
  return items.reduce((total, item) => total + item.amountMinor, 0);
}
