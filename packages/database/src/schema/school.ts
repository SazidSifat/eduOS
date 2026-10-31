import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  jsonb,
  integer,
  timestamp,
  foreignKey,
  unique,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { institution, membership } from './identity.js';
export const schoolConfiguration = pgTable(
  'school_configuration',
  {
    institutionId: uuid('institution_id')
      .primaryKey()
      .references(() => institution.id, { onDelete: 'restrict' }),
    revision: integer('revision').notNull().default(0),
    settings: jsonb('settings').notNull().default({}),
    categories: jsonb('categories').notNull().default([]),
    feeDefaults: jsonb('fee_defaults').notNull().default([]),
  },
  (t) => [check('school_revision_nonnegative', sql`${t.revision} >= 0`)],
);
// Every command stores only a fingerprint and resource ID, never identity payloads.
export const schoolOperation = pgTable(
  'school_operation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    actorId: text('actor_id').notNull(),
    operationKey: uuid('operation_key').notNull(),
    fingerprint: text('fingerprint').notNull(),
    action: text('action').notNull(),
    resourceId: text('resource_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('school_operation_key').on(t.institutionId, t.operationKey),
    foreignKey({
      columns: [t.institutionId, t.actorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    index('school_operation_audit').on(t.institutionId, t.createdAt),
  ],
);
export const schoolEvidence = pgTable(
  'school_evidence',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    actorId: text('actor_id').notNull(),
    name: text('name').notNull(),
    mediaType: text('media_type').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('school_evidence_tenant_id').on(t.institutionId, t.id),
    foreignKey({
      columns: [t.institutionId, t.actorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    check('school_evidence_size', sql`length(${t.content}) between 1 and 6990508`),
  ],
);
export const schoolExpense = pgTable(
  'school_expense',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    evidenceId: uuid('evidence_id'),
    amountMinor: integer('amount_minor').notNull(),
    status: text('status').notNull(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({ columns: [t.institutionId], foreignColumns: [institution.id] }).onDelete(
      'restrict',
    ),
    foreignKey({
      columns: [t.institutionId, t.evidenceId],
      foreignColumns: [schoolEvidence.institutionId, schoolEvidence.id],
    }).onDelete('restrict'),
    check('school_expense_amount', sql`${t.amountMinor} between 1 and 100000000`),
    check('school_expense_status', sql`${t.status} in ('draft','pending','approved','returned')`),
    index('school_expense_tenant_date').on(t.institutionId, t.createdAt),
  ],
);
