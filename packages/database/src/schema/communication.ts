import {
  pgTable,
  uuid,
  text,
  integer,
  date,
  timestamp,
  boolean,
  unique,
  foreignKey,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { admissionCandidate } from './admissions.js';
import { membership } from './identity.js';
export const followUpReminder = pgTable(
  'follow_up_reminder',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    candidateId: uuid('candidate_id').notNull(),
    recipientId: text('recipient_id').notNull(),
    candidateVersion: integer('candidate_version').notNull(),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    kind: text('kind').notNull(),
    deliverAt: timestamp('deliver_at', { withTimezone: true }).notNull(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    read: boolean('read').default(false).notNull(),
    cancelled: boolean('cancelled').default(false).notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.institutionId, t.candidateId],
      foreignColumns: [admissionCandidate.institutionId, admissionCandidate.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.recipientId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    unique('reminder_delivery_key').on(
      t.institutionId,
      t.candidateId,
      t.dueDate,
      t.kind,
      t.candidateVersion,
    ),
    index('reminder_delivery_queue').on(t.cancelled, t.deliveredAt, t.deliverAt),
    index('reminder_inbox').on(t.institutionId, t.recipientId, t.deliveredAt),
    check('reminder_kind', sql`${t.kind} in ('before','on_date')`),
  ],
);
