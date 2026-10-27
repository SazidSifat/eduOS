import { randomUUID } from 'node:crypto';
import { and, eq, type DatabaseTransaction } from '@eduos/database';
import { student, studentEnrollment } from '@eduos/database/schema';
import { candidateProfileSchema, type CandidateProfile } from '@eduos/contracts';
import { AdmissionError } from '../admissions/errors.js';
export async function enrollStudent(
  tx: DatabaseTransaction,
  institutionId: string,
  offering: { id: string; session: string },
  profile: CandidateProfile,
) {
  const [existing] = profile.birthCertificate
    ? await tx
        .select()
        .from(student)
        .where(
          and(
            eq(student.institutionId, institutionId),
            eq(student.birthCertificate, profile.birthCertificate),
          ),
        )
    : [];
  if (existing) {
    const saved = candidateProfileSchema.parse(JSON.parse(existing.profile));
    if (saved.studentName !== profile.studentName || saved.dateOfBirth !== profile.dateOfBirth)
      throw new AdmissionError(
        'STUDENT_IDENTITY_CONFLICT',
        'This birth certificate belongs to a different student record. Ask an Admin to review it.',
        409,
      );
  }
  const studentId = existing?.id ?? randomUUID();
  if (!existing)
    await tx.insert(student).values({
      id: studentId,
      institutionId,
      name: profile.studentName,
      birthCertificate: profile.birthCertificate || null,
      profile: JSON.stringify(profile),
    });
  const [enrollment] = await tx
    .select()
    .from(studentEnrollment)
    .where(
      and(
        eq(studentEnrollment.institutionId, institutionId),
        eq(studentEnrollment.studentId, studentId),
        eq(studentEnrollment.session, offering.session),
      ),
    );
  if (enrollment)
    throw new AdmissionError(
      'STUDENT_ALREADY_ENROLLED',
      'This student already has an enrollment in this session.',
      409,
    );
  await tx
    .insert(studentEnrollment)
    .values({ institutionId, studentId, offeringId: offering.id, session: offering.session });
  return studentId;
}
