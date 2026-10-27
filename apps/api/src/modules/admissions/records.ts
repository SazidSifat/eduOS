import { and, eq, desc, type DatabaseTransaction } from '@eduos/database';
import {
  academicOffering,
  admissionCandidate,
  admissionHistory,
  user,
} from '@eduos/database/schema';
import { candidateDetailSchema, candidateProfileSchema } from '@eduos/contracts';
import { forbidden } from '../../lib/errors.js';
import { checkAssignment, type AdmissionAccess } from './policy.js';
import { admissionReceipts } from '../fees/admission-collections.js';
import { readAdmissionFees } from '../fees/admission-fees.js';
import { readMonthlyBilling } from '../fees/monthly-billing.js';

export async function getCandidate(
  tx: DatabaseTransaction,
  institutionId: string,
  id: string,
  access: AdmissionAccess,
) {
  const [row] = await tx
    .select()
    .from(admissionCandidate)
    .where(and(eq(admissionCandidate.institutionId, institutionId), eq(admissionCandidate.id, id)));
  if (!row) forbidden();
  checkAssignment(access, row.assigneeId);
  return row;
}
export async function candidateSummary(
  tx: DatabaseTransaction,
  row: typeof admissionCandidate.$inferSelect,
) {
  const profile = candidateProfileSchema.parse(row.profile);
  const [offering] = await tx
    .select()
    .from(academicOffering)
    .where(
      and(
        eq(academicOffering.institutionId, row.institutionId),
        eq(academicOffering.id, row.offeringId),
      ),
    );
  const [assignee] = await tx
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, row.assigneeId));
  return {
    id: row.id,
    state: row.state,
    version: row.version,
    studentName: profile.studentName,
    guardianName: profile.guardianName,
    phone: profile.phone,
    session: offering?.session ?? '',
    className: offering?.className ?? '',
    assigneeName: assignee?.name ?? 'Unassigned',
    followUpDate: row.followUpDate,
    studentId: row.studentId,
    admissionNumber: row.admissionNumber,
    admittedAt: row.admittedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
export async function candidateDetails(
  tx: DatabaseTransaction,
  row: typeof admissionCandidate.$inferSelect,
) {
  const history = await tx
    .select({
      id: admissionHistory.id,
      action: admissionHistory.action,
      note: admissionHistory.note,
      actorName: user.name,
      createdAt: admissionHistory.createdAt,
    })
    .from(admissionHistory)
    .innerJoin(user, eq(user.id, admissionHistory.actorId))
    .where(
      and(
        eq(admissionHistory.institutionId, row.institutionId),
        eq(admissionHistory.candidateId, row.id),
      ),
    )
    .orderBy(desc(admissionHistory.createdAt))
    .limit(100);
  const admissionFees = await readAdmissionFees(
    tx,
    row.institutionId,
    row.id,
    row.admissionFeeMinor,
  );
  return candidateDetailSchema.parse({
    candidate: await candidateSummary(tx, row),
    profile: row.profile,
    offeringId: row.offeringId,
    assigneeId: row.assigneeId,
    admissionFeeMinor: row.admissionFeeMinor,
    willingFeeMinor: row.willingFeeMinor,
    creditWillingFee: row.creditWillingFee,
    admissionFees,
    monthlyBilling: await readMonthlyBilling(tx, row.institutionId, row.id),
    receipts: await admissionReceipts(tx, row.institutionId, row.id, admissionFees),
    history: history.map((entry) => ({ ...entry, createdAt: entry.createdAt.toISOString() })),
  });
}
