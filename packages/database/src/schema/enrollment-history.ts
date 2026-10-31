import {
  pgTable,
  uuid,
  text,
  date,
  timestamp,
  foreignKey,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { studentEnrollment } from './academics.js';
import { membership } from './identity.js';

export const enrollmentDateChange = pgTable(
  'enrollment_date_change',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    enrollmentId: uuid('enrollment_id').notNull(),
    actorId: text('actor_id').notNull(),
    previousStart: date('previous_start'),
    previousEnd: date('previous_end'),
    startsOn: date('starts_on'),
    endsOn: date('ends_on'),
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.institutionId, t.enrollmentId],
      foreignColumns: [studentEnrollment.institutionId, studentEnrollment.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.actorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    index('enrollment_change_history').on(t.institutionId, t.enrollmentId, t.createdAt),
    check('enrollment_change_reason', sql`length(trim(${t.reason})) between 1 and 1000`),
    check(
      'enrollment_change_date_order',
      sql`${t.startsOn} is null or ${t.endsOn} is null or ${t.startsOn} <= ${t.endsOn}`,
    ),
  ],
);
