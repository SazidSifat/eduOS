import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  boolean,
  timestamp,
  unique,
  foreignKey,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { admissionCandidate } from './admissions.js';
import { membership } from './identity.js';

// Ownership: institution + candidate -> admitted student and its session enrollment.
export const admissionFeeItem = pgTable(
  'admission_fee_item',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    candidateId: uuid('candidate_id').notNull(),
    position: integer('position').notNull(),
    type: text('type').notNull(),
    label: text('label').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    billingStartDate: date('billing_start_date'),
    billingEndDate: date('billing_end_date'),
  },
  (t) => [
    unique('fee_item_tenant_candidate_id').on(t.institutionId, t.candidateId, t.id),
    unique('fee_item_position').on(t.institutionId, t.candidateId, t.position),
    foreignKey({
      columns: [t.institutionId, t.candidateId],
      foreignColumns: [admissionCandidate.institutionId, admissionCandidate.id],
    }).onDelete('restrict'),
    check(
      'fee_item_values',
      sql`${t.position} between 0 and 19 and length(trim(${t.label})) between 1 and 80 and ${t.amountMinor} between 0 and 100000000`,
    ),
    check('fee_item_type', sql`${t.type} in ('admission', 'session', 'monthly', 'other')`),
    check(
      'fee_item_billing_dates',
      sql`(${t.type} = 'monthly' and ${t.amountMinor} > 0 and ${t.billingStartDate} is not null and (${t.billingEndDate} is null or ${t.billingEndDate} >= ${t.billingStartDate})) or (${t.type} <> 'monthly' and ${t.billingStartDate} is null and ${t.billingEndDate} is null)`,
    ),
  ],
);

export const monthlyFeeSchedule = pgTable(
  'monthly_fee_schedule',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    candidateId: uuid('candidate_id').notNull(),
    feeItemId: uuid('fee_item_id').notNull(),
    label: text('label').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    nextDueDate: date('next_due_date').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('monthly_schedule_tenant_id').on(t.institutionId, t.id),
    unique('monthly_schedule_fee_item').on(t.institutionId, t.feeItemId),
    foreignKey({
      columns: [t.institutionId, t.candidateId, t.feeItemId],
      foreignColumns: [
        admissionFeeItem.institutionId,
        admissionFeeItem.candidateId,
        admissionFeeItem.id,
      ],
    }).onDelete('restrict'),
    check(
      'monthly_schedule_values',
      sql`${t.amountMinor} between 1 and 100000000 and ${t.nextDueDate} > ${t.startDate} and (${t.endDate} is null or ${t.endDate} >= ${t.startDate})`,
    ),
    index('monthly_schedule_due').on(t.active, t.nextDueDate, t.institutionId),
    index('monthly_schedule_candidate').on(t.institutionId, t.candidateId),
  ],
);

export const monthlyFeeCharge = pgTable(
  'monthly_fee_charge',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    scheduleId: uuid('schedule_id').notNull(),
    dueDate: date('due_date').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('monthly_charge_tenant_id').on(t.institutionId, t.id),
    unique('monthly_charge_period').on(t.institutionId, t.scheduleId, t.dueDate),
    foreignKey({
      columns: [t.institutionId, t.scheduleId],
      foreignColumns: [monthlyFeeSchedule.institutionId, monthlyFeeSchedule.id],
    }).onDelete('restrict'),
    check('monthly_charge_amount', sql`${t.amountMinor} between 1 and 100000000`),
  ],
);

export const monthlyFeePayment = pgTable(
  'monthly_fee_payment',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    chargeId: uuid('charge_id').notNull(),
    collectorId: text('collector_id').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    receiptNumber: text('receipt_number').notNull(),
    method: text('method').notNull().default('cash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('monthly_payment_charge').on(t.institutionId, t.chargeId),
    unique('monthly_payment_receipt').on(t.institutionId, t.receiptNumber),
    foreignKey({
      columns: [t.institutionId, t.chargeId],
      foreignColumns: [monthlyFeeCharge.institutionId, monthlyFeeCharge.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.collectorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    check(
      'monthly_payment_values',
      sql`${t.amountMinor} between 1 and 100000000 and ${t.method} = 'cash'`,
    ),
  ],
);
