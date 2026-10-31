import type { z } from 'zod';
import { and, eq, type DatabaseTransaction } from '@eduos/database';
import { academicOffering, admissionCandidate } from '@eduos/database/schema';
import {
  candidateProfileSchema,
  candidateCreateSchema,
  candidateActionSchema,
  type SchoolAction,
  type SchoolFee,
} from '@eduos/contracts';
import { createAdmissionMutations } from './mutations.js';
import { createAdmissionSettingsService } from './settings.js';
import { forbidden, invalidRequest } from '../../lib/errors.js';
import { requireSchool, type SchoolAccess } from '../school/policy.js';
export const admissionFees = (fees: SchoolFee[]) =>
  fees.map((f) => ({
    type: f.type,
    label: f.label,
    amountMinor: f.amount,
    billingStartDate: f.type === 'monthly' ? f.start : null,
    billingEndDate: f.type === 'monthly' ? f.end || null : null,
  }));
export async function runSchoolAdmission(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  action: SchoolAction,
  operationKey: string,
) {
  requireSchool(access, 'admissions.write', 'admissions');
  const service = createAdmissionMutations(tx);
  if (action.type === 'candidate-save') {
    const c = action.candidate;
    const [base, section] = c.className.split(' · ');
    const [offering] = await tx
      .select()
      .from(academicOffering)
      .where(
        and(
          eq(academicOffering.institutionId, access.school.id),
          eq(academicOffering.className, base ?? ''),
          eq(academicOffering.session, c.session),
        ),
      );
    if (
      !offering?.active ||
      !offering.sections
        .split(',')
        .map((s) => s.trim())
        .includes(section ?? '')
    )
      invalidRequest();
    const assigneeId = c.officer;
    const profile = inputValue(candidateProfileSchema, {
      studentName: c.name,
      guardianName: c.guardian,
      phone: c.phone,
      section,
      relationship: c.relationship,
      address: c.address,
      dateOfBirth: c.dob,
      birthCertificate: c.certificate,
      nationality: c.nationality,
      fatherName: c.father,
      motherName: c.mother,
      guardianNid: c.nid,
      guardianNationality: c.nationality,
      previousSchool: c.previousSchool,
      source: c.source,
      notes: c.notes,
      identityException: c.exceptionReason,
    });
    const [current] = await tx
      .select()
      .from(admissionCandidate)
      .where(
        and(
          eq(admissionCandidate.institutionId, access.school.id),
          eq(admissionCandidate.id, c.id),
        ),
      );
    const state = action.admission ? 'admitted' : c.state;
    if (state === 'closed') invalidRequest();
    if (!current) {
      const input = inputValue(candidateCreateSchema, {
        operationKey,
        offeringId: offering.id,
        assigneeId,
        profile,
        state,
        followUpDate: state === 'follow_up' ? c.nextCall : null,
        collectWillingFee: action.collectWillingFee ?? false,
        collectAdmissionFee: action.admission?.cashConfirmed ?? false,
        ...(action.admission ? { admissionFees: admissionFees(action.admission.fees) } : {}),
      });
      return (await service.create(access.actor.userId, access.school.id, input)).candidate.id;
    }
    if (current.offeringId !== offering.id || current.version !== c.version) invalidRequest();
    const input = inputValue(candidateActionSchema, {
      operationKey,
      version: c.version,
      action: action.admission
        ? 'admit'
        : current.state === state
          ? 'edit'
          : state === 'willing'
            ? 'willing'
            : 'reopen',
      profile,
      assigneeId,
      followUpDate: state === 'follow_up' ? c.nextCall : null,
      outcome: null,
      note: c.notes,
      collectWillingFee: action.collectWillingFee ?? false,
      collectAdmissionFee: action.admission?.cashConfirmed ?? false,
      ...(action.admission ? { admissionFees: admissionFees(action.admission.fees) } : {}),
    });
    await service.act(access.actor.userId, access.school.id, c.id, input);
    return c.id;
  }
  if (!('candidateId' in action)) invalidRequest();
  const [row] = await tx
    .select()
    .from(admissionCandidate)
    .where(
      and(
        eq(admissionCandidate.institutionId, access.school.id),
        eq(admissionCandidate.id, action.candidateId),
      ),
    );
  if (!row) forbidden();
  if (action.type === 'willing-payment') {
    // Optional collection can be recorded on the willing transition, never fabricated later.
    invalidRequest();
  }
  const kind =
    action.type === 'call'
      ? 'call'
      : action.type === 'admit'
        ? 'admit'
        : action.type === 'candidate-state'
          ? action.state === 'follow_up'
            ? 'reopen'
            : action.state === 'closed'
              ? 'close'
              : 'willing'
          : null;
  if (!kind) invalidRequest();
  const outcomes = {
    Agreed: 'agreed',
    'Needs more time': 'needs_time',
    'No answer': 'no_answer',
    'Not interested': 'not_interested',
  } as const;
  await service.act(
    access.actor.userId,
    access.school.id,
    row.id,
    inputValue(candidateActionSchema, {
      operationKey,
      version: row.version,
      action: kind,
      outcome: action.type === 'call' ? outcomes[action.outcome] : null,
      followUpDate: 'nextCall' in action ? action.nextCall || null : null,
      note: 'note' in action ? action.note : '',
      collectWillingFee: false,
      collectAdmissionFee: action.type === 'admit' && action.cashConfirmed,
      ...(action.type === 'admit' ? { admissionFees: admissionFees(action.fees) } : {}),
    }),
  );
  return row.id;
}
export async function saveSchoolAdmissionSettings(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  values: Record<string, string>,
) {
  const service = createAdmissionSettingsService(tx);
  const { settings } = await service.setup(access.actor.userId, access.school.id);
  await service.updateSettings(access.actor.userId, access.school.id, {
    version: settings.version,
    reminderDaysBefore: Number(values.reminderDays ?? settings.reminderDaysBefore),
    beforeTime: values.reminderTime ?? settings.beforeTime,
    onDateTime: values.reminderTime ?? settings.onDateTime,
    willingFeeMinor:
      values.willingFee === undefined
        ? settings.willingFeeMinor
        : Math.round(Number(values.willingFee) * 100),
    admissionFeeMinor: settings.admissionFeeMinor,
    creditWillingFee:
      values.creditWilling === undefined
        ? settings.creditWillingFee
        : values.creditWilling === 'yes',
  });
}

function inputValue<T extends z.ZodType>(schema: T, value: unknown): z.output<T> {
  const result = schema.safeParse(value);
  if (!result.success) invalidRequest();
  return result.data;
}
