import { and, eq, type DatabaseTransaction } from '@eduos/database';
import { academicOffering } from '@eduos/database/schema';
import { AdmissionError } from '../admissions/errors.js';
export async function findOffering(tx: DatabaseTransaction, institutionId: string, id: string) {
  const [offering] = await tx
    .select()
    .from(academicOffering)
    .where(and(eq(academicOffering.institutionId, institutionId), eq(academicOffering.id, id)));
  if (!offering)
    throw new AdmissionError(
      'INVALID_OFFERING',
      'Choose a class and session from this institution.',
    );
  return offering;
}
export async function createOffering(
  tx: DatabaseTransaction,
  institutionId: string,
  input: { session: string; className: string },
) {
  await tx
    .insert(academicOffering)
    .values({ institutionId, ...input })
    .onConflictDoNothing();
  const [row] = await tx
    .select()
    .from(academicOffering)
    .where(
      and(
        eq(academicOffering.institutionId, institutionId),
        eq(academicOffering.session, input.session),
        eq(academicOffering.className, input.className),
      ),
    );
  if (!row) throw new Error('Offering was not persisted');
  return { id: row.id, session: row.session, className: row.className };
}
