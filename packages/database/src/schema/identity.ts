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
// Composite ownership key prevents duplicate membership; no product roles are seeded.
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
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.institutionId, t.userId] }),
    index('membership_user_idx').on(t.userId, t.active),
  ],
);
