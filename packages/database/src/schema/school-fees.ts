import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  timestamp,
  foreignKey,
  unique,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { membership } from './identity.js';
import { admissionCandidate } from './admissions.js';
import { monthlyFeeCharge } from './admission-fees.js';
export const schoolFeePayment = pgTable(
  'school_fee_payment',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    candidateId: uuid('candidate_id').notNull(),
    collectorId: text('collector_id').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    date: date('date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('school_payment_tenant_id').on(t.institutionId, t.id),
    foreignKey({
      columns: [t.institutionId, t.candidateId],
      foreignColumns: [admissionCandidate.institutionId, admissionCandidate.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.collectorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    check('school_payment_amount', sql`${t.amountMinor} between 1 and 100000000`),
    index('school_payment_tenant_date').on(t.institutionId, t.date),
  ],
);
export const schoolFeeAllocation = pgTable(
  'school_fee_allocation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    paymentId: uuid('payment_id').notNull(),
    chargeId: uuid('charge_id').notNull(),
    amountMinor: integer('amount_minor').notNull(),
  },
  (t) => [
    unique('school_allocation_charge').on(t.institutionId, t.paymentId, t.chargeId),
    foreignKey({
      columns: [t.institutionId, t.paymentId],
      foreignColumns: [schoolFeePayment.institutionId, schoolFeePayment.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.chargeId],
      foreignColumns: [monthlyFeeCharge.institutionId, monthlyFeeCharge.id],
    }).onDelete('restrict'),
    check('school_allocation_amount', sql`${t.amountMinor} between 1 and 100000000`),
    index('school_allocation_balance').on(t.institutionId, t.chargeId),
  ],
);
export const schoolFeeReversal = pgTable(
  'school_fee_reversal',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    paymentId: uuid('payment_id').notNull(),
    actorId: text('actor_id').notNull(),
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('school_reversal_once').on(t.institutionId, t.paymentId),
    foreignKey({
      columns: [t.institutionId, t.paymentId],
      foreignColumns: [schoolFeePayment.institutionId, schoolFeePayment.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.actorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    check('school_reversal_reason', sql`length(trim(${t.reason})) between 1 and 1000`),
  ],
);
