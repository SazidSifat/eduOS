import { type Database } from '@eduos/database';
import { admissionHistory } from '@eduos/database/schema';
import { forbidden } from '../../lib/errors.js';
import { authorizeAdmissions, requireCollection } from './policy.js';
import { candidateDetails, getCandidate } from './records.js';
import { collectMonthlyCharge, stopMonthlySchedule } from '../fees/monthly-billing.js';

export function createAdmissionBillingService(db: Database) {
  return {
    async collectMonthlyFee(
      actorId: string,
      institutionId: string,
      candidateId: string,
      chargeId: string,
    ) {
      return db.transaction(async (tx) => {
        const access = await authorizeAdmissions(tx, actorId, institutionId, 'fees.collect', true);
        requireCollection(access);
        const candidate = await getCandidate(tx, institutionId, candidateId, access);
        if (candidate.state !== 'admitted') forbidden();
        const posted = await collectMonthlyCharge(tx, {
          institutionId,
          candidateId,
          chargeId,
          collectorId: actorId,
        });
        if (posted)
          await tx.insert(admissionHistory).values({
            institutionId,
            candidateId,
            actorId,
            action: 'monthly_fee_collected',
            note: '',
          });
        return candidateDetails(tx, candidate);
      });
    },
    async stopMonthlyFee(
      actorId: string,
      institutionId: string,
      candidateId: string,
      scheduleId: string,
    ) {
      return db.transaction(async (tx) => {
        const access = await authorizeAdmissions(
          tx,
          actorId,
          institutionId,
          'admissions.manage',
          true,
        );
        const candidate = await getCandidate(tx, institutionId, candidateId, access);
        const stopped = await stopMonthlySchedule(tx, institutionId, candidateId, scheduleId);
        if (stopped)
          await tx.insert(admissionHistory).values({
            institutionId,
            candidateId,
            actorId,
            action: 'monthly_billing_stopped',
            note: '',
          });
        return candidateDetails(tx, candidate);
      });
    },
  };
}
