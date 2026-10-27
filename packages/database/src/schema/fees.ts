import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  unique,
  foreignKey,
  check,
} from 'drizzle-orm/pg-core';
import { admissionCandidate } from './admissions.js';
import { membership } from './identity.js';
export const admissionCharge = pgTable(
  'admission_charge',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    candidateId: uuid('candidate_id').notNull(),
    kind: text('kind').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    creditMinor: integer('credit_minor').notNull().default(0),
  },
  (t) => [
    unique('charge_tenant_id').on(t.institutionId, t.id),
    unique('candidate_charge_kind').on(t.institutionId, t.candidateId, t.kind),
    foreignKey({
      columns: [t.institutionId, t.candidateId],
      foreignColumns: [admissionCandidate.institutionId, admissionCandidate.id],
    }).onDelete('restrict'),
    check(
      'charge_amounts',
      sql`${t.amountMinor} >= 0 and ${t.creditMinor} >= 0 and ${t.creditMinor} <= ${t.amountMinor}`,
    ),
    check('charge_kind', sql`${t.kind} in ('willing','admission')`),
  ],
);
export const admissionPayment = pgTable(
  'admission_payment',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    chargeId: uuid('charge_id').notNull(),
    collectorId: text('collector_id').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    method: text('method').notNull().default('cash'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('payment_tenant_id').on(t.institutionId, t.id),
    unique('payment_one_per_charge').on(t.institutionId, t.chargeId),
    foreignKey({
      columns: [t.institutionId, t.chargeId],
      foreignColumns: [admissionCharge.institutionId, admissionCharge.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.collectorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    check('payment_positive', sql`${t.amountMinor} > 0 and ${t.method} = 'cash'`),
  ],
);
export const admissionReceipt = pgTable(
  'admission_receipt',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    paymentId: uuid('payment_id').notNull(),
    number: text('number').notNull(),
  },
  (t) => [
    unique('receipt_number').on(t.institutionId, t.number),
    unique('receipt_payment').on(t.institutionId, t.paymentId),
    foreignKey({
      columns: [t.institutionId, t.paymentId],
      foreignColumns: [admissionPayment.institutionId, admissionPayment.id],
    }).onDelete('restrict'),
  ],
);
