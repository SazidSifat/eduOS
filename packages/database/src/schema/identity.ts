import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  primaryKey,
  index,
  check,
  pgEnum,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { user } from './auth.js';
export const institution = pgTable(
  'institution',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    timezone: text('timezone').default('Asia/Dhaka').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [check('institution_slug_format', sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`)],
);
export const institutionRole = pgEnum('institution_role', [
  'admin',
  'principal',
  'admission_officer',
  'accountant',
  'teacher',
]);
// Unassigned memberships intentionally have no grants; migrations never promote users.
export const membership = pgTable(
  'institution_membership',
  {
    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institution.id, { onDelete: 'restrict' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    active: boolean('active').default(true).notNull(),
    role: institutionRole('role'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.institutionId, t.userId] }),
    index('membership_user_idx').on(t.userId, t.active),
    index('membership_institution_role_idx').on(t.institutionId, t.active, t.role),
  ],
);
export const membershipChange = pgTable(
  'membership_change',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    actorUserId: text('actor_user_id').notNull(),
    targetUserId: text('target_user_id').notNull(),
    previousRole: institutionRole('previous_role'),
    role: institutionRole('role'),
    previousActive: boolean('previous_active').notNull(),
    active: boolean('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.institutionId, t.actorUserId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.targetUserId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    index('membership_change_institution_created_idx').on(t.institutionId, t.createdAt),
  ],
);
