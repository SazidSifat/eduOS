import { z } from 'zod';
import { and, eq, or, isNull, lte, gte, type DatabaseTransaction } from '@eduos/database';
import {
  academicOffering,
  attendanceRegister,
  attendanceRegisterMark,
  attendanceCorrection,
  studentEnrollment,
} from '@eduos/database/schema';
import {
  schoolMarkSchema,
  schoolRegisterSchema,
  schoolCorrectionSchema,
  type SchoolAction,
} from '@eduos/contracts';
import { readSchoolConfiguration } from '../../models/school.model.js';
import { forbidden, invalidRequest, conflict } from '../../lib/errors.js';
import { allowed, requireSchool, schoolToday, type SchoolAccess } from '../school/policy.js';
const marksSchema = z.record(z.string(), schoolMarkSchema);
export async function attendanceClass(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  classId: string,
) {
  const [offeringId, section] = classId.split('|');
  if (!z.uuid().safeParse(offeringId).success || !section) invalidRequest();
  const [offering] = await tx
    .select()
    .from(academicOffering)
    .where(
      and(
        eq(academicOffering.institutionId, access.school.id),
        eq(academicOffering.id, offeringId ?? ''),
      ),
    );
  if (
    !offering ||
    !offering.sections
      .split(',')
      .map((s) => s.trim())
      .includes(section)
  )
    forbidden();
  if (access.actor.role === 'teacher' && offering.teacherId !== access.actor.userId) forbidden();
  return { offering, section };
}
export async function readSchoolAttendance(tx: DatabaseTransaction, access: SchoolAccess) {
  if (!allowed(access, 'attendance.read', 'attendance')) return { registers: [], corrections: [] };
  const rows = await tx
    .select({ register: attendanceRegister })
    .from(attendanceRegister)
    .innerJoin(
      academicOffering,
      and(
        eq(academicOffering.institutionId, attendanceRegister.institutionId),
        eq(academicOffering.id, attendanceRegister.offeringId),
      ),
    )
    .where(
      and(
        eq(attendanceRegister.institutionId, access.school.id),
        access.actor.role === 'teacher'
          ? eq(academicOffering.teacherId, access.actor.userId)
          : undefined,
      ),
    );
  const registers = rows.map(({ register: r }) =>
    schoolRegisterSchema.parse({
      id: `${r.date}|${r.offeringId}|${r.section}`,
      classId: `${r.offeringId}|${r.section}`,
      date: r.date,
      marks: r.marks,
      submitted: r.submitted,
      saved: true,
    }),
  );
  const correctionRows = await tx
    .select({ correction: attendanceCorrection, register: attendanceRegister })
    .from(attendanceCorrection)
    .innerJoin(
      attendanceRegister,
      and(
        eq(attendanceRegister.institutionId, attendanceCorrection.institutionId),
        eq(attendanceRegister.id, attendanceCorrection.registerId),
      ),
    )
    .innerJoin(
      academicOffering,
      and(
        eq(academicOffering.institutionId, attendanceRegister.institutionId),
        eq(academicOffering.id, attendanceRegister.offeringId),
      ),
    )
    .where(
      and(
        eq(attendanceCorrection.institutionId, access.school.id),
        access.actor.role === 'teacher'
          ? eq(academicOffering.teacherId, access.actor.userId)
          : undefined,
      ),
    );
  return {
    registers,
    corrections: correctionRows.map(({ correction: c, register: r }) =>
      schoolCorrectionSchema.parse({
        id: c.id,
        registerId: `${r.date}|${r.offeringId}|${r.section}`,
        studentId: c.studentId,
        original: c.original,
        proposed: c.proposed,
        reason: c.reason,
        status: c.status,
      }),
    ),
  };
}
export async function runSchoolAttendance(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  action: SchoolAction,
) {
  if (action.type === 'attendance-save') {
    requireSchool(access, 'attendance.write', 'attendance');
    const { offering, section } = await attendanceClass(tx, access, action.classId);
    const { settings } = await readSchoolConfiguration(tx, access);
    if (
      action.submit &&
      access.actor.role === 'teacher' &&
      settings.cutoff &&
      action.date === schoolToday(access.school.timezone)
    ) {
      const time = new Intl.DateTimeFormat('en-GB', {
        timeZone: access.school.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(new Date());
      if (time > settings.cutoff) forbidden();
    }
    if (action.date > schoolToday(access.school.timezone)) invalidRequest();
    const roster = await tx
      .select({ id: studentEnrollment.studentId })
      .from(studentEnrollment)
      .where(
        and(
          eq(studentEnrollment.institutionId, access.school.id),
          eq(studentEnrollment.offeringId, offering.id),
          eq(studentEnrollment.section, section),
          or(isNull(studentEnrollment.startsOn), lte(studentEnrollment.startsOn, action.date)),
          or(isNull(studentEnrollment.endsOn), gte(studentEnrollment.endsOn, action.date)),
        ),
      );
    const ids = new Set(roster.map((s) => s.id));
    if (
      !ids.size ||
      Object.keys(action.marks).length !== ids.size ||
      Object.keys(action.marks).some((id) => !ids.has(id))
    )
      invalidRequest();
    if (action.submit && Object.values(action.marks).includes('Unmarked')) invalidRequest();
    const [current] = await tx
      .select()
      .from(attendanceRegister)
      .where(
        and(
          eq(attendanceRegister.institutionId, access.school.id),
          eq(attendanceRegister.offeringId, offering.id),
          eq(attendanceRegister.section, section),
          eq(attendanceRegister.date, action.date),
        ),
      );
    if (current?.submitted) conflict();
    const values = {
      marks: action.marks,
      submitted: action.submit,
      originalMarks: action.submit ? action.marks : null,
      submittedAt: action.submit ? new Date() : null,
      actorId: access.actor.userId,
    };
    if (current)
      await tx
        .update(attendanceRegister)
        .set(values)
        .where(
          and(
            eq(attendanceRegister.institutionId, access.school.id),
            eq(attendanceRegister.id, current.id),
          ),
        );
    else
      await tx.insert(attendanceRegister).values({
        institutionId: access.school.id,
        offeringId: offering.id,
        section,
        date: action.date,
        ...values,
      });
    const [saved] = await tx
      .select({ id: attendanceRegister.id })
      .from(attendanceRegister)
      .where(
        and(
          eq(attendanceRegister.institutionId, access.school.id),
          eq(attendanceRegister.offeringId, offering.id),
          eq(attendanceRegister.section, section),
          eq(attendanceRegister.date, action.date),
        ),
      );
    if (!saved) throw new Error('Register was not persisted');
    for (const [studentId, mark] of Object.entries(action.marks))
      await tx
        .insert(attendanceRegisterMark)
        .values({
          institutionId: access.school.id,
          registerId: saved.id,
          studentId,
          mark,
          original: action.submit ? mark : null,
        })
        .onConflictDoUpdate({
          target: [
            attendanceRegisterMark.institutionId,
            attendanceRegisterMark.registerId,
            attendanceRegisterMark.studentId,
          ],
          set: { mark, original: action.submit ? mark : null },
        });
    return;
  }
  if (action.type === 'correction-request') {
    requireSchool(access, 'attendance.write', 'attendance');
    const c = action.correction;
    const [date, ...parts] = c.registerId.split('|');
    const { offering, section } = await attendanceClass(tx, access, parts.join('|'));
    const [register] = await tx
      .select()
      .from(attendanceRegister)
      .where(
        and(
          eq(attendanceRegister.institutionId, access.school.id),
          eq(attendanceRegister.offeringId, offering.id),
          eq(attendanceRegister.section, section),
          eq(attendanceRegister.date, date ?? ''),
        ),
      );
    if (
      !register?.submitted ||
      marksSchema.parse(register.marks)[c.studentId] !== c.original ||
      c.proposed === c.original
    )
      invalidRequest();
    await tx.insert(attendanceCorrection).values({
      id: c.id,
      institutionId: access.school.id,
      registerId: register.id,
      studentId: c.studentId,
      original: c.original,
      proposed: c.proposed,
      reason: c.reason,
      status: 'pending',
      actorId: access.actor.userId,
    });
    return c.id;
  }
  if (action.type === 'correction-review') {
    requireSchool(access, 'attendance.review', 'attendance');
    const { settings } = await readSchoolConfiguration(tx, access);
    if (settings.correctionRole === 'Principal' && access.actor.role !== 'principal') forbidden();
    const [c] = await tx
      .select()
      .from(attendanceCorrection)
      .where(
        and(
          eq(attendanceCorrection.institutionId, access.school.id),
          eq(attendanceCorrection.id, action.id),
        ),
      );
    if (!c || c.status !== 'pending') conflict();
    const [register] = await tx
      .select()
      .from(attendanceRegister)
      .where(
        and(
          eq(attendanceRegister.institutionId, access.school.id),
          eq(attendanceRegister.id, c.registerId),
        ),
      );
    if (!register) forbidden();
    const marks = marksSchema.parse(register.marks);
    if (action.approved && marks[c.studentId] !== c.original) conflict();
    await tx
      .update(attendanceCorrection)
      .set({
        status: action.approved ? 'approved' : 'rejected',
        reviewerId: access.actor.userId,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(attendanceCorrection.institutionId, access.school.id),
          eq(attendanceCorrection.id, c.id),
        ),
      );
    if (action.approved)
      await tx
        .update(attendanceRegister)
        .set({ marks: { ...marks, [c.studentId]: c.proposed } })
        .where(
          and(
            eq(attendanceRegister.institutionId, access.school.id),
            eq(attendanceRegister.id, register.id),
          ),
        );
    if (action.approved)
      await tx
        .update(attendanceRegisterMark)
        .set({ mark: c.proposed })
        .where(
          and(
            eq(attendanceRegisterMark.institutionId, access.school.id),
            eq(attendanceRegisterMark.registerId, c.registerId),
            eq(attendanceRegisterMark.studentId, c.studentId),
          ),
        );
    return c.id;
  }
  invalidRequest();
}
