import { createHash } from 'node:crypto';
import { and, eq, type Database } from '@eduos/database';
import {
  admissionCandidate,
  schoolConfiguration,
  schoolOperation,
  schoolEvidence,
} from '@eduos/database/schema';
import {
  schoolCommandSchema,
  schoolEvidenceInputSchema,
  type SchoolCommand,
} from '@eduos/contracts';
import type { z } from 'zod';
import { authorizeSchool, authorizeSchoolAction, requireSchool } from './policy.js';
import { readSchoolSnapshot } from './snapshot.js';
import { readSchoolConfiguration } from '../../models/school.model.js';
import { runSchoolSettings } from './settings.js';
import { runSchoolAdmission } from '../admissions/school-admissions.js';
import { attendanceClass, runSchoolAttendance } from '../attendance/attendance.service.js';
import { runSchoolExpense } from '../expenses/expenses.service.js';
import { runSchoolRoutine } from '../routine/routine.service.js';
import { runSchoolFees } from '../fees/school-fees.js';
import { runSchoolMembership } from '../identity/school-members.js';
import { saveSchoolOffering } from '../academics/school-offerings.js';
import { setEnrollmentDates } from '../students/enrollment-dates.js';
import { readEnrollmentHistory } from '../students/enrollment-history.js';
import { conflict, forbidden, invalidRequest } from '../../lib/errors.js';
export function createSchoolService(db: Database) {
  return {
    async enrollmentHistory(
      actorId: string,
      institutionId: string,
      enrollmentId: string,
      page: { limit: number; offset: number },
    ) {
      return db.transaction(async (tx) =>
        readEnrollmentHistory(
          tx,
          await authorizeSchool(tx, actorId, institutionId),
          enrollmentId,
          page,
        ),
      );
    },
    async snapshot(actorId: string, institutionId: string) {
      return db.transaction(async (tx) =>
        readSchoolSnapshot(tx, await authorizeSchool(tx, actorId, institutionId)),
      );
    },
    async command(actorId: string, institutionId: string, raw: SchoolCommand) {
      const input = schoolCommandSchema.parse(raw);
      return db.transaction(async (tx) => {
        const access = await authorizeSchool(tx, actorId, institutionId, true);
        authorizeSchoolAction(access, input.action);
        const hash = createHash('sha256').update(JSON.stringify(input.action)).digest('hex');
        const [previous] = await tx
          .select()
          .from(schoolOperation)
          .where(
            and(
              eq(schoolOperation.institutionId, institutionId),
              eq(schoolOperation.operationKey, input.operationKey),
            ),
          );
        if (previous) {
          if (previous.actorId !== actorId || previous.fingerprint !== hash) conflict();
          if (input.action.type === 'attendance-save')
            await attendanceClass(tx, access, input.action.classId);
          if (input.action.type === 'correction-request')
            await attendanceClass(
              tx,
              access,
              input.action.correction.registerId.split('|').slice(1).join('|'),
            );
          if (access.actor.role === 'admission_officer') {
            const candidateId =
              input.action.type === 'candidate-save'
                ? previous.resourceId
                : 'candidateId' in input.action
                  ? input.action.candidateId
                  : null;
            if (candidateId) {
              const [candidate] = await tx
                .select({ assigneeId: admissionCandidate.assigneeId })
                .from(admissionCandidate)
                .where(
                  and(
                    eq(admissionCandidate.institutionId, institutionId),
                    eq(admissionCandidate.id, candidateId),
                  ),
                );
              if (!candidate || candidate.assigneeId !== actorId) forbidden();
            }
          }
          return { ok: true as const, ...(previous.resourceId ? { id: previous.resourceId } : {}) };
        }
        const config = await readSchoolConfiguration(tx, access);
        if (config.revision !== input.revision) conflict();
        await tx.insert(schoolConfiguration).values({ institutionId }).onConflictDoNothing();
        const action = input.action;
        let id: string | void;
        switch (action.type) {
          case 'candidate-save':
          case 'candidate-state':
          case 'call':
          case 'admit':
          case 'willing-payment':
            id = await runSchoolAdmission(tx, access, action, input.operationKey);
            break;
          case 'collect':
          case 'reverse':
          case 'schedule-stop':
            id = await runSchoolFees(tx, access, action);
            break;
          case 'expense-save':
          case 'expense-review':
          case 'expense-pay':
            id = await runSchoolExpense(tx, access, config, action);
            break;
          case 'attendance-save':
          case 'correction-request':
          case 'correction-review':
            id = await runSchoolAttendance(tx, access, action);
            break;
          case 'routine-configure':
          case 'lesson-save':
          case 'routine-publish':
            id = await runSchoolRoutine(tx, access, action);
            break;
          case 'member-save':
          case 'member-update':
            id = await runSchoolMembership(tx, access, action);
            break;
          case 'offering-save':
            id = await saveSchoolOffering(tx, access, action);
            break;
          case 'enrollment-dates':
            id = await setEnrollmentDates(tx, access, action);
            break;
          case 'settings-save':
          case 'category-add':
          case 'fee-defaults':
            id = await runSchoolSettings(tx, access, config, action);
            break;
        }
        await tx
          .update(schoolConfiguration)
          .set({ revision: config.revision + 1 })
          .where(eq(schoolConfiguration.institutionId, institutionId));
        await tx.insert(schoolOperation).values({
          institutionId,
          actorId,
          operationKey: input.operationKey,
          fingerprint: hash,
          action: action.type,
          resourceId: id ?? null,
        });
        return { ok: true as const, ...(id ? { id } : {}) };
      });
    },
    async uploadEvidence(
      actorId: string,
      institutionId: string,
      raw: z.infer<typeof schoolEvidenceInputSchema>,
    ) {
      const input = schoolEvidenceInputSchema.parse(raw);
      const content = Buffer.from(input.content, 'base64');
      if (
        !content.length ||
        content.length > 5 * 1024 * 1024 ||
        content.toString('base64') !== input.content
      )
        invalidRequest();
      const signatures = {
        'application/pdf': content.subarray(0, 5).toString() === '%PDF-',
        'image/png': content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
        'image/jpeg': content[0] === 255 && content[1] === 216 && content[2] === 255,
      };
      if (!signatures[input.mediaType]) invalidRequest();
      return db.transaction(async (tx) => {
        const access = await authorizeSchool(tx, actorId, institutionId, true);
        requireSchool(access, 'expenses.write', 'fees');
        const [row] = await tx
          .insert(schoolEvidence)
          .values({
            institutionId,
            actorId,
            name: input.name.replace(/[/\r\n]/g, '_'),
            mediaType: input.mediaType,
            content: input.content,
          })
          .returning({ id: schoolEvidence.id, name: schoolEvidence.name });
        if (!row) throw new Error('Evidence was not persisted');
        return row;
      });
    },
    async evidence(actorId: string, institutionId: string, id: string) {
      return db.transaction(async (tx) => {
        const access = await authorizeSchool(tx, actorId, institutionId);
        requireSchool(access, 'expenses.read', 'fees');
        const [row] = await tx
          .select()
          .from(schoolEvidence)
          .where(and(eq(schoolEvidence.institutionId, institutionId), eq(schoolEvidence.id, id)));
        if (!row) forbidden();
        return row;
      });
    },
  };
}
export type SchoolService = ReturnType<typeof createSchoolService>;
