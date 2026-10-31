import {
  pgTable,
  uuid,
  text,
  unique,
  foreignKey,
  integer,
  boolean,
  check,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { institution, membership } from './identity.js';
export const academicOffering = pgTable(
  'academic_offering',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institution.id, { onDelete: 'restrict' }),
    session: text('session').notNull(),
    className: text('class_name').notNull(),
    sections: text('sections').notNull().default('A'),
    capacity: integer('capacity').notNull().default(40),
    teacherId: text('teacher_id'),
    active: boolean('active').notNull().default(true),
  },
  (t) => [
    check('offering_capacity', sql`${t.capacity} between 1 and 9999`),
    foreignKey({
      columns: [t.institutionId, t.teacherId],
      foreignColumns: [membership.institutionId, membership.userId],
    }).onDelete('restrict'),
    unique('offering_tenant_id').on(t.institutionId, t.id),
    unique('offering_tenant_session_id').on(t.institutionId, t.id, t.session),
    unique('offering_session_class').on(t.institutionId, t.session, t.className),
  ],
);

export const student = pgTable(
  'student',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institution.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    birthCertificate: text('birth_certificate'),
    profile: text('profile').notNull(),
  },
  (t) => [
    unique('student_tenant_id').on(t.institutionId, t.id),
    unique('student_birth_identity').on(t.institutionId, t.birthCertificate),
  ],
);
export const studentEnrollment = pgTable(
  'student_enrollment',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    institutionId: uuid('institution_id').notNull(),
    studentId: uuid('student_id').notNull(),
    offeringId: uuid('offering_id').notNull(),
    session: text('session').notNull(),
    section: text('section').notNull().default('A'),
    startsOn: date('starts_on'),
    endsOn: date('ends_on'),
  },
  (t) => [
    unique('enrollment_tenant_id').on(t.institutionId, t.id),
    check(
      'enrollment_date_order',
      sql`${t.startsOn} is null or ${t.endsOn} is null or ${t.startsOn} <= ${t.endsOn}`,
    ),
    index('enrollment_dated_roster').on(
      t.institutionId,
      t.offeringId,
      t.section,
      t.startsOn,
      t.endsOn,
    ),
    unique('enrollment_one_per_session').on(t.institutionId, t.studentId, t.session),
    foreignKey({
      columns: [t.institutionId, t.studentId],
      foreignColumns: [student.institutionId, student.id],
    }).onDelete('restrict'),
    foreignKey({
      columns: [t.institutionId, t.offeringId, t.session],
      foreignColumns: [
        academicOffering.institutionId,
        academicOffering.id,
        academicOffering.session,
      ],
    }).onDelete('restrict'),
  ],
);
