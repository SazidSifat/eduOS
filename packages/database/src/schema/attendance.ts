import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  date,
  jsonb,
  timestamp,
  boolean,
  foreignKey,
  unique,
  check,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { academicOffering, student } from './academics.js';
import { membership } from './identity.js';
export const attendanceRegister = pgTable(
  'attendance_register',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    offeringId: uuid('offering_id').notNull(),
    section: text('section').notNull(),
    date: date('date').notNull(),
    marks: jsonb('marks').notNull(),
    originalMarks: jsonb('original_marks'),
    submitted: boolean('submitted').notNull().default(false),
    actorId: text('actor_id').notNull(),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
  },
  (t) => [
    unique('attendance_tenant_id').on(t.institutionId, t.id),
    unique('attendance_class_date').on(t.institutionId, t.offeringId, t.section, t.date),
    foreignKey({
      columns: [t.institutionId, t.offeringId],
      foreignColumns: [academicOffering.institutionId, academicOffering.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.actorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    check(
      'attendance_submitted_original',
      sql`not ${t.submitted} or (${t.originalMarks} is not null and ${t.submittedAt} is not null)`,
    ),
  ],
);
export const attendanceCorrection = pgTable(
  'attendance_correction',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    registerId: uuid('register_id').notNull(),
    studentId: uuid('student_id').notNull(),
    original: text('original').notNull(),
    proposed: text('proposed').notNull(),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('pending'),
    actorId: text('actor_id').notNull(),
    reviewerId: text('reviewer_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (t) => [
    foreignKey({
      columns: [t.institutionId, t.registerId],
      foreignColumns: [attendanceRegister.institutionId, attendanceRegister.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.studentId],
      foreignColumns: [student.institutionId, student.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.actorId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.reviewerId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    check('attendance_correction_status', sql`${t.status} in ('pending','approved','rejected')`),
    check(
      'attendance_correction_marks',
      sql`${t.original} in ('Present','Absent','Late') and ${t.proposed} in ('Present','Absent','Late') and ${t.original} <> ${t.proposed}`,
    ),
    uniqueIndex('attendance_one_pending')
      .on(t.institutionId, t.registerId, t.studentId)
      .where(sql`${t.status} = 'pending'`),
    index('attendance_correction_tenant').on(t.institutionId, t.createdAt),
  ],
);
export const classRoutine = pgTable(
  'class_routine',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    offeringId: uuid('offering_id').notNull(),
    section: text('section').notNull(),
    version: text('version').notNull(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.institutionId, t.offeringId],
      foreignColumns: [academicOffering.institutionId, academicOffering.id],
    }).onDelete('restrict'),
    unique('routine_class_version').on(t.institutionId, t.offeringId, t.section, t.version),
    index('routine_tenant_created').on(t.institutionId, t.createdAt),
  ],
);

export const attendanceRegisterMark = pgTable(
  'attendance_register_mark',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    registerId: uuid('register_id').notNull(),
    studentId: uuid('student_id').notNull(),
    mark: text('mark').notNull(),
    original: text('original'),
  },
  (t) => [
    unique('attendance_mark_student').on(t.institutionId, t.registerId, t.studentId),
    foreignKey({
      columns: [t.institutionId, t.registerId],
      foreignColumns: [attendanceRegister.institutionId, attendanceRegister.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.studentId],
      foreignColumns: [student.institutionId, student.id],
    }).onDelete('restrict'),
    check(
      'attendance_mark_values',
      sql`${t.mark} in ('Present','Absent','Late','Unmarked') and (${t.original} is null or ${t.original} in ('Present','Absent','Late'))`,
    ),
  ],
);
