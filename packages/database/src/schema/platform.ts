import {
  boolean,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth.js';

export const platformRole = pgEnum('platform_role', ['platform_owner', 'platform_manager']);
// Separate from institution memberships: platform access never implies tenant access.
export const platformOperator = pgTable(
  'platform_operator',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'restrict' }),
    role: platformRole('role').notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('platform_operator_active_role_idx').on(t.active, t.role)],
);

export const platformOperatorChange = pgTable(
  'platform_operator_change',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: text('actor_user_id').notNull(),
    targetUserId: text('target_user_id').notNull(),
    previousRole: platformRole('previous_role'),
    role: platformRole('role').notNull(),
    previousActive: boolean('previous_active'),
    active: boolean('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    foreignKey({ columns: [t.actorUserId], foreignColumns: [platformOperator.userId] }).onDelete(
      'restrict',
    ),
    foreignKey({ columns: [t.targetUserId], foreignColumns: [platformOperator.userId] }).onDelete(
      'restrict',
    ),
    index('platform_operator_change_created_idx').on(t.createdAt),
  ],
);
