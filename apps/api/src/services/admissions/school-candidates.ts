import { and, eq, desc, type DatabaseTransaction } from '@eduos/database';
import {
  academicOffering,
  admissionCandidate,
  admissionHistory,
  admissionFeeItem,
  admissionPayment,
  admissionCharge,
} from '@eduos/database/schema';
import {
  candidateProfileSchema,
  schoolCandidateSchema,
  admissionFeeItemSchema,
  type SchoolCandidate,
} from '@eduos/contracts';
import { allowed, type SchoolAccess } from '../school/policy.js';
import { defaultAdmissionFees } from '../fees/admission-fees.js';
export async function schoolCandidates(tx: DatabaseTransaction, access: SchoolAccess) {
  const admission = allowed(access, 'admissions.read', 'admissions');
  const finance = allowed(access, 'fees.read', 'fees');
  if (!admission && !finance) return [];
  const rows = await tx
    .select()
    .from(admissionCandidate)
    .where(
      and(
        eq(admissionCandidate.institutionId, access.school.id),
        admission
          ? access.permissions.includes('admissions.manage')
            ? undefined
            : eq(admissionCandidate.assigneeId, access.actor.userId)
          : eq(admissionCandidate.state, 'admitted'),
      ),
    )
    .orderBy(admissionCandidate.createdAt);
  const offerings = await tx
    .select()
    .from(academicOffering)
    .where(eq(academicOffering.institutionId, access.school.id));
  const fees = await tx
    .select()
    .from(admissionFeeItem)
    .where(eq(admissionFeeItem.institutionId, access.school.id))
    .orderBy(admissionFeeItem.position);
  const history = admission
    ? await tx
        .select()
        .from(admissionHistory)
        .where(eq(admissionHistory.institutionId, access.school.id))
        .orderBy(desc(admissionHistory.createdAt))
    : [];
  const receipts = await tx
    .select({ candidateId: admissionCharge.candidateId, amount: admissionPayment.amountMinor })
    .from(admissionPayment)
    .innerJoin(
      admissionCharge,
      and(
        eq(admissionCharge.institutionId, admissionPayment.institutionId),
        eq(admissionCharge.id, admissionPayment.chargeId),
      ),
    )
    .where(
      and(
        eq(admissionPayment.institutionId, access.school.id),
        eq(admissionCharge.kind, 'willing'),
      ),
    );
  const result: SchoolCandidate[] = [];
  for (const row of rows) {
    const offering = offerings.find((o) => o.id === row.offeringId);
    const items = fees
      .filter((f) => f.candidateId === row.id)
      .map((f) =>
        admissionFeeItemSchema.parse({
          type: f.type,
          label: f.label,
          amountMinor: f.amountMinor,
          billingStartDate: f.billingStartDate,
          billingEndDate: f.billingEndDate,
        }),
      );
    const p = candidateProfileSchema.parse(row.profile);
    result.push(
      schoolCandidateSchema.parse({
        id: row.id,
        version: row.version,
        name: p.studentName,
        guardian: p.guardianName,
        phone: p.phone,
        className: `${offering?.className ?? ''} · ${p.section ?? 'A'}`,
        session: offering?.session ?? '',
        officer: row.assigneeId,
        state: row.state,
        nextCall: row.followUpDate ?? '',
        notes: admission ? p.notes : '',
        dob: admission ? p.dateOfBirth : '',
        father: admission ? p.fatherName : '',
        mother: admission ? p.motherName : '',
        address: admission ? p.address : '',
        certificate: admission ? p.birthCertificate : '',
        nid: admission ? p.guardianNid : '',
        relationship: p.relationship,
        nationality: admission ? p.nationality : '',
        previousSchool: admission ? p.previousSchool : '',
        source: admission ? p.source : '',
        exceptionReason: admission ? p.identityException : '',
        willingPaid: receipts
          .filter((r) => r.candidateId === row.id)
          .reduce((sum, r) => sum + r.amount, 0),
        admittedOn: row.admittedAt ? schoolTodayAt(row.admittedAt, access.school.timezone) : '',
        calls: admission
          ? history
              .filter((h) => h.candidateId === row.id)
              .slice(0, 100)
              .map((h) => ({
                date: schoolTodayAt(h.createdAt, access.school.timezone),
                outcome: h.action,
                note: h.note,
              }))
          : [],
        fees: (items.length ? items : defaultAdmissionFees(row.admissionFeeMinor)).map((f, i) => ({
          id: String(i),
          label: f.label,
          type: f.type,
          amount: f.amountMinor,
          start: f.billingStartDate ?? '',
          end: f.billingEndDate ?? '',
        })),
      }),
    );
  }
  return result;
}
function schoolTodayAt(date: Date, timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
