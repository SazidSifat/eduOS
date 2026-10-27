import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
  unique,
  foreignKey,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { institution, membership } from './identity.js';
import { academicOffering, student } from './academics.js';

export const admissionSettings = pgTable(
  'admission_settings',
  {
    institutionId: uuid('institution_id')
      .primaryKey()
      .references(() => institution.id, { onDelete: 'restrict' }),
    version: integer('version').notNull(),
    reminderDaysBefore: integer('reminder_days_before').notNull(),
    beforeTime: text('before_time').notNull(),
    onDateTime: text('on_date_time').notNull(),
    willingFeeMinor: integer('willing_fee_minor').notNull(),
    admissionFeeMinor: integer('admission_fee_minor').notNull(),
    creditWillingFee: boolean('credit_willing_fee').notNull(),
  },
  (t) => [
    check(
      'admission_settings_amounts',
      sql`${t.willingFeeMinor} >= 0 and ${t.admissionFeeMinor} >= 0`,
    ),
    check('admission_settings_days', sql`${t.reminderDaysBefore} between 1 and 30`),
    check(
      'admission_settings_times',
      sql`${t.beforeTime} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and ${t.onDateTime} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`,
    ),
  ],
);
export const admissionCandidate = pgTable(
  'admission_candidate',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    offeringId: uuid('offering_id').notNull(),
    assigneeId: text('assignee_id').notNull(),
    state: text('state').notNull(),
    version: integer('version').default(1).notNull(),
    profile: jsonb('profile').$type<Record<string, unknown>>().notNull(),
    followUpDate: date('follow_up_date', { mode: 'string' }),
    admissionFeeMinor: integer('admission_fee_minor').notNull(),
    willingFeeMinor: integer('willing_fee_minor').notNull(),
    creditWillingFee: boolean('credit_willing_fee').notNull(),
    studentId: uuid('student_id'),
    admissionNumber: text('admission_number'),
    admittedAt: timestamp('admitted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('candidate_tenant_id').on(t.institutionId, t.id),
    unique('candidate_admission_number').on(t.institutionId, t.admissionNumber),
    foreignKey({
      columns: [t.institutionId, t.offeringId],
      foreignColumns: [academicOffering.institutionId, academicOffering.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.assigneeId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.studentId],
      foreignColumns: [student.institutionId, student.id],
    }).onDelete('restrict'),
    check('candidate_state', sql`${t.state} in ('follow_up','willing','admitted','closed')`),
    check('candidate_follow_up', sql`(${t.state} = 'follow_up') = (${t.followUpDate} is not null)`),
    check(
      'candidate_admitted',
      sql`(${t.state} = 'admitted') = (${t.studentId} is not null and ${t.admittedAt} is not null and ${t.admissionNumber} is not null)`,
    ),
    check(
      'candidate_amounts',
      sql`${t.willingFeeMinor} >= 0 and ${t.admissionFeeMinor} >= 0 and ${t.version} > 0`,
    ),
    index('candidate_call_queue').on(t.institutionId, t.assigneeId, t.state, t.followUpDate),
    index('candidate_directory').on(t.institutionId, t.state, t.createdAt),
  ],
);
export const admissionHistory = pgTable(
  'admission_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    candidateId: uuid('candidate_id').notNull(),
    actorId: text('actor_id').notNull(),
    action: text('action').notNull(),
    note: text('note').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.institutionId, t.candidateId],
      foreignColumns: [admissionCandidate.institutionId, admissionCandidate.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.actorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    index('admission_history_candidate').on(t.institutionId, t.candidateId, t.createdAt),
  ],
);
export const admissionOperation = pgTable(
  'admission_operation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    operationKey: uuid('operation_key').notNull(),
    actorId: text('actor_id').notNull(),
    fingerprint: text('fingerprint').notNull(),
    candidateId: uuid('candidate_id').notNull(),
  },
  (t) => [
    unique('admission_operation_key').on(t.institutionId, t.operationKey),
    foreignKey({
      columns: [t.institutionId, t.candidateId],
      foreignColumns: [admissionCandidate.institutionId, admissionCandidate.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.actorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
  ],
);
export const admissionConfigurationHistory = pgTable(
  'admission_configuration_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    actorId: text('actor_id').notNull(),
    value: jsonb('value').$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.institutionId, t.actorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    index('admission_configuration_tenant').on(t.institutionId, t.createdAt),
  ],
);
