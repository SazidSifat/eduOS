import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  unique,
  foreignKey,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { institution, membership } from './identity.js';
import { student } from './academics.js';
import { user } from './auth.js';

// Shared phone numbers never establish identity or child access.
export const guardian = pgTable(
  'guardian',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institution.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('guardian_tenant_id').on(t.institutionId, t.id),
    index('guardian_tenant_name').on(t.institutionId, t.name),
    check('guardian_name_required', sql`length(trim(${t.name})) between 1 and 200`),
  ],
);

export const guardianRelationship = pgTable(
  'guardian_relationship',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    guardianId: uuid('guardian_id').notNull(),
    studentId: uuid('student_id').notNull(),
    relationship: text('relationship').notNull(),
    canViewAttendance: boolean('can_view_attendance').notNull().default(false),
    canViewResults: boolean('can_view_results').notNull().default(false),
    canViewFinance: boolean('can_view_finance').notNull().default(false),
    canCollectChild: boolean('can_collect_child').notNull().default(false),
    approvedBy: text('approved_by'),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('guardian_relationship_tenant_id').on(t.institutionId, t.id),
    unique('guardian_student_relationship').on(t.institutionId, t.guardianId, t.studentId),
    foreignKey({
      columns: [t.institutionId, t.guardianId],
      foreignColumns: [guardian.institutionId, guardian.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.studentId],
      foreignColumns: [student.institutionId, student.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.approvedBy],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    index('guardian_relationship_student').on(t.institutionId, t.studentId),
    check(
      'guardian_relationship_approval',
      sql`(${t.approvedAt} is null) = (${t.approvedBy} is null)`,
    ),
    check(
      'guardian_relationship_revocation',
      sql`${t.revokedAt} is null or (${t.approvedAt} is not null and ${t.revokedAt} >= ${t.approvedAt})`,
    ),
  ],
);

// A verified account still requires an approved, unrevoked relationship for
// every child-specific request. School membership is never implied.
export const guardianAccount = pgTable(
  'guardian_account',
  {
    institutionId: uuid('institution_id').notNull(),
    guardianId: uuid('guardian_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [
    unique('guardian_account_guardian').on(t.institutionId, t.guardianId),
    unique('guardian_account_user').on(t.institutionId, t.userId),
    foreignKey({
      columns: [t.institutionId, t.guardianId],
      foreignColumns: [guardian.institutionId, guardian.id],
    }).onDelete('restrict'),
    check(
      'guardian_account_revocation',
      sql`${t.revokedAt} is null or ${t.revokedAt} >= ${t.verifiedAt}`,
    ),
  ],
);
