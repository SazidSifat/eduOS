import { createHash, randomUUID } from 'node:crypto';
import { and, eq, sql, type Database, type DatabaseTransaction } from '@eduos/database';
import {
  admissionCandidate,
  admissionHistory,
  admissionOperation,
  membership,
} from '@eduos/database/schema';
import {
  candidateProfileSchema,
  type CandidateAction,
  type CandidateCreate,
  type AdmissionFeeItem,
} from '@eduos/contracts';
import { permissionsForRole } from '@eduos/permissions';
import { forbidden } from '../../lib/errors.js';
import { AdmissionError, admissionConflict } from './errors.js';
import {
  authorizeAdmissions,
  checkAssignment,
  requireCollection,
  requireFullProfile,
  type AdmissionAccess,
} from './policy.js';
import { candidateDetails, getCandidate } from './records.js';
import { readAdmissionSettings } from './settings.js';
import { findOffering } from '../academics/academics.service.js';
import { collectAdmissionCharge, registrationCredit } from '../fees/admission-collections.js';
import { enrollStudent } from '../students/students.service.js';
import { scheduleFollowUp } from '../communication/follow-ups.js';
import { saveAdmissionFees } from '../fees/admission-fees.js';

const fingerprint = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
async function replay(tx: DatabaseTransaction, access: AdmissionAccess, key: string, hash: string) {
  const [operation] = await tx
    .select()
    .from(admissionOperation)
    .where(
      and(
        eq(admissionOperation.institutionId, access.school.id),
        eq(admissionOperation.operationKey, key),
      ),
    );
  if (!operation) return;
  if (operation.actorId !== access.actor.userId || operation.fingerprint !== hash)
    admissionConflict();
  return getCandidate(tx, access.school.id, operation.candidateId, access);
}
async function checkFollowUpDate(tx: DatabaseTransaction, date: string | null, timezone: string) {
  if (!date) throw new AdmissionError('FOLLOW_UP_DATE_REQUIRED', 'Choose the next follow-up date.');
  const result = await tx.execute<{ valid: boolean }>(
    sql`select ${date}::date >= (now() at time zone ${timezone})::date as valid`,
  );
  if (!result.rows[0]?.valid)
    throw new AdmissionError('FOLLOW_UP_DATE_PAST', 'Choose today or a future follow-up date.');
}
async function finishAdmission(
  tx: DatabaseTransaction,
  access: AdmissionAccess,
  row: typeof admissionCandidate.$inferSelect,
  collect: boolean,
  items?: AdmissionFeeItem[],
) {
  const profile = candidateProfileSchema.parse(row.profile);
  requireFullProfile(profile, access);
  const offering = await findOffering(tx, row.institutionId, row.offeringId);
  if (
    items &&
    !access.permissions.includes('admissions.settings') &&
    (items.length !== 1 ||
      items[0]?.type !== 'admission' ||
      items[0]?.label !== 'Admission fees' ||
      items[0]?.amountMinor !== row.admissionFeeMinor ||
      items[0]?.billingStartDate !== null ||
      items[0]?.billingEndDate !== null)
  )
    forbidden();
  const amountMinor = await saveAdmissionFees(tx, {
    institutionId: row.institutionId,
    candidateId: row.id,
    timezone: access.school.timezone,
    legacyAmount: row.admissionFeeMinor,
    ...(items ? { items } : {}),
  });
  const credit = row.creditWillingFee
    ? Math.min(amountMinor, await registrationCredit(tx, row.institutionId, row.id))
    : 0;
  if (amountMinor > 0) requireCollection(access);
  await collectAdmissionCharge(tx, {
    institutionId: row.institutionId,
    candidateId: row.id,
    collectorId: access.actor.userId,
    kind: 'admission',
    amountMinor,
    creditMinor: credit,
    collect,
  });
  const studentId = await enrollStudent(tx, row.institutionId, offering, profile);
  return {
    studentId,
    admissionFeeMinor: amountMinor,
    admittedAt: new Date(),
    admissionNumber: `AD-${randomUUID().toUpperCase()}`,
    state: 'admitted',
    followUpDate: null,
  };
}
async function willingCollection(
  tx: DatabaseTransaction,
  access: AdmissionAccess,
  row: typeof admissionCandidate.$inferSelect,
) {
  requireCollection(access);
  if (await registrationCredit(tx, row.institutionId, row.id))
    throw new AdmissionError(
      'WILLING_FEE_ALREADY_COLLECTED',
      'A willing fee has already been collected for this candidate.',
      409,
    );
  if (!row.willingFeeMinor)
    throw new AdmissionError(
      'WILLING_FEE_NOT_CONFIGURED',
      'Configure a positive willing fee before collecting it.',
    );
  await collectAdmissionCharge(tx, {
    institutionId: row.institutionId,
    candidateId: row.id,
    collectorId: access.actor.userId,
    kind: 'willing',
    amountMinor: row.willingFeeMinor,
    creditMinor: 0,
    collect: true,
  });
}
async function auditOperation(
  tx: DatabaseTransaction,
  access: AdmissionAccess,
  candidateId: string,
  operationKey: string,
  hash: string,
  action: string,
  note: string,
) {
  await tx.insert(admissionHistory).values({
    institutionId: access.school.id,
    candidateId,
    actorId: access.actor.userId,
    action,
    note,
  });
  await tx.insert(admissionOperation).values({
    institutionId: access.school.id,
    candidateId,
    actorId: access.actor.userId,
    operationKey,
    fingerprint: hash,
  });
}
export function createAdmissionMutations(db: Pick<Database, 'transaction'>) {
  return {
    async create(actorId: string, institutionId: string, input: CandidateCreate) {
      return db.transaction(async (tx) => {
        const access = await authorizeAdmissions(
          tx,
          actorId,
          institutionId,
          'admissions.write',
          true,
        );
        const hash = fingerprint({ kind: 'create', input });
        const previous = await replay(tx, access, input.operationKey, hash);
        if (previous) return candidateDetails(tx, previous);
        checkAssignment(access, input.assigneeId);
        const [assignee] = await tx
          .select()
          .from(membership)
          .where(
            and(
              eq(membership.institutionId, institutionId),
              eq(membership.userId, input.assigneeId),
            ),
          )
          .for('share');
        if (!assignee?.active || !permissionsForRole(assignee.role).includes('admissions.write'))
          forbidden();
        await findOffering(tx, institutionId, input.offeringId);
        const settings = await readAdmissionSettings(tx, institutionId);
        if (!settings.version)
          throw new AdmissionError(
            'ADMISSION_SETUP_REQUIRED',
            'Ask an Admin to save admissions settings first.',
          );
        if (input.state !== 'follow_up') requireFullProfile(input.profile, access);
        if (input.state === 'follow_up')
          await checkFollowUpDate(tx, input.followUpDate, access.school.timezone);
        const [row] = await tx
          .insert(admissionCandidate)
          .values({
            institutionId,
            offeringId: input.offeringId,
            assigneeId: input.assigneeId,
            state: input.state === 'admitted' ? 'willing' : input.state,
            profile: input.profile,
            followUpDate: input.followUpDate,
            willingFeeMinor: settings.willingFeeMinor,
            admissionFeeMinor: settings.admissionFeeMinor,
            creditWillingFee: settings.creditWillingFee,
          })
          .returning();
        if (!row) throw new Error('Candidate was not persisted');
        if (input.collectWillingFee) await willingCollection(tx, access, row);
        let result = row;
        if (input.state === 'admitted') {
          const final = await finishAdmission(
            tx,
            access,
            row,
            input.collectAdmissionFee,
            input.admissionFees,
          );
          const [saved] = await tx
            .update(admissionCandidate)
            .set(final)
            .where(
              and(
                eq(admissionCandidate.institutionId, institutionId),
                eq(admissionCandidate.id, row.id),
              ),
            )
            .returning();
          if (!saved) throw new Error('Admission was not persisted');
          result = saved;
        }
        await scheduleFollowUp(tx, result, access.school.timezone);
        await auditOperation(
          tx,
          access,
          row.id,
          input.operationKey,
          hash,
          `created_${input.state}`,
          '',
        );
        return candidateDetails(tx, result);
      });
    },
    async act(actorId: string, institutionId: string, candidateId: string, input: CandidateAction) {
      return db.transaction(async (tx) => {
        const access = await authorizeAdmissions(
          tx,
          actorId,
          institutionId,
          'admissions.write',
          true,
        );
        const hash = fingerprint({ candidateId, input });
        const previous = await replay(tx, access, input.operationKey, hash);
        if (previous) return candidateDetails(tx, previous);
        const row = await getCandidate(tx, institutionId, candidateId, access);
        if (row.version !== input.version || row.state === 'admitted') admissionConflict();
        if (input.collectWillingFee && input.action !== 'willing')
          throw new AdmissionError(
            'INVALID_COLLECTION',
            'Willing collection applies only when marking a student willing.',
          );
        if (input.collectAdmissionFee && input.action !== 'admit')
          throw new AdmissionError(
            'INVALID_COLLECTION',
            'Admission collection applies only when confirming admission.',
          );
        const profile = input.profile ?? candidateProfileSchema.parse(row.profile);
        const changes: Partial<typeof admissionCandidate.$inferInsert> = {
          profile,
          version: row.version + 1,
        };
        if (input.assigneeId && input.assigneeId !== row.assigneeId) {
          if (input.action !== 'edit' || !access.permissions.includes('admissions.manage'))
            forbidden();
          const [assignee] = await tx
            .select()
            .from(membership)
            .where(
              and(
                eq(membership.institutionId, institutionId),
                eq(membership.userId, input.assigneeId),
              ),
            )
            .for('share');
          if (!assignee?.active || !permissionsForRole(assignee.role).includes('admissions.write'))
            forbidden();
          changes.assigneeId = input.assigneeId;
        }
        if (input.action === 'edit') {
          if (row.state === 'willing') requireFullProfile(profile, access);
        } else if (input.action === 'call') {
          if (row.state !== 'follow_up' || !input.outcome) admissionConflict();
          if (input.outcome === 'not_interested')
            Object.assign(changes, { state: 'closed', followUpDate: null });
          else {
            await checkFollowUpDate(tx, input.followUpDate, access.school.timezone);
            changes.followUpDate = input.followUpDate;
          }
        } else if (input.action === 'reopen') {
          if (row.state !== 'closed' && row.state !== 'willing') admissionConflict();
          await checkFollowUpDate(tx, input.followUpDate, access.school.timezone);
          Object.assign(changes, { state: 'follow_up', followUpDate: input.followUpDate });
        } else if (input.action === 'close') {
          if (!input.note)
            throw new AdmissionError(
              'CLOSING_REASON_REQUIRED',
              'Add a reason for closing this record.',
            );
          Object.assign(changes, { state: 'closed', followUpDate: null });
        } else if (input.action === 'willing') {
          if (row.state !== 'follow_up') admissionConflict();
          requireFullProfile(profile, access);
          Object.assign(changes, { state: 'willing', followUpDate: null });
          if (input.collectWillingFee) await willingCollection(tx, access, row);
        } else if (input.action === 'admit') {
          if (row.state !== 'follow_up' && row.state !== 'willing') admissionConflict();
          Object.assign(
            changes,
            await finishAdmission(
              tx,
              access,
              { ...row, profile },
              input.collectAdmissionFee,
              input.admissionFees,
            ),
          );
        }
        const [updated] = await tx
          .update(admissionCandidate)
          .set(changes)
          .where(
            and(
              eq(admissionCandidate.institutionId, institutionId),
              eq(admissionCandidate.id, row.id),
              eq(admissionCandidate.version, input.version),
            ),
          )
          .returning();
        if (!updated) admissionConflict();
        await scheduleFollowUp(tx, updated, access.school.timezone);
        await auditOperation(
          tx,
          access,
          row.id,
          input.operationKey,
          hash,
          input.outcome ? `call_${input.outcome}` : input.action,
          input.note,
        );
        return candidateDetails(tx, updated);
      });
    },
  };
}
