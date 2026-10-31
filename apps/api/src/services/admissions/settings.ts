import { and, eq, inArray, type Database, type DatabaseTransaction } from '@eduos/database';
import {
  academicOffering,
  admissionCandidate,
  admissionConfigurationHistory,
  admissionSettings,
  membership,
  user,
} from '@eduos/database/schema';
import { admissionSetupSchema, type AdmissionSettings } from '@eduos/contracts';
import { authorizeAdmissions } from './policy.js';
import { admissionConflict } from './errors.js';
import { scheduleFollowUp } from '../communication/follow-ups.js';
import { createOffering } from '../academics/academics.service.js';

export const initialAdmissionSettings: AdmissionSettings = {
  version: 0,
  reminderDaysBefore: 1,
  beforeTime: '09:00',
  onDateTime: '09:00',
  willingFeeMinor: 0,
  admissionFeeMinor: 0,
  creditWillingFee: true,
};
export async function readAdmissionSettings(tx: DatabaseTransaction, institutionId: string) {
  const [settings] = await tx
    .select()
    .from(admissionSettings)
    .where(eq(admissionSettings.institutionId, institutionId));
  return settings
    ? {
        version: settings.version,
        reminderDaysBefore: settings.reminderDaysBefore,
        beforeTime: settings.beforeTime,
        onDateTime: settings.onDateTime,
        willingFeeMinor: settings.willingFeeMinor,
        admissionFeeMinor: settings.admissionFeeMinor,
        creditWillingFee: settings.creditWillingFee,
      }
    : initialAdmissionSettings;
}
export function createAdmissionSettingsService(db: Pick<Database, 'transaction'>) {
  return {
    async setup(actorId: string, institutionId: string) {
      return db.transaction(async (tx) => {
        const access = await authorizeAdmissions(tx, actorId, institutionId, 'admissions.read');
        const assignees = await tx
          .select({ userId: membership.userId, name: user.name })
          .from(membership)
          .innerJoin(user, eq(user.id, membership.userId))
          .where(
            and(
              eq(membership.institutionId, institutionId),
              eq(membership.active, true),
              inArray(membership.role, ['admin', 'principal', 'admission_officer']),
              access.permissions.includes('admissions.manage')
                ? undefined
                : eq(membership.userId, actorId),
            ),
          );
        return admissionSetupSchema.parse({
          settings: {
            ...(await readAdmissionSettings(tx, institutionId)),
            timezone: access.school.timezone,
          },
          offerings: (
            await tx
              .select()
              .from(academicOffering)
              .where(eq(academicOffering.institutionId, institutionId))
              .orderBy(academicOffering.session, academicOffering.className)
          ).map(({ id, session, className }) => ({ id, session, className })),
          assignees,
        });
      });
    },
    async updateSettings(actorId: string, institutionId: string, input: AdmissionSettings) {
      return db.transaction(async (tx) => {
        const access = await authorizeAdmissions(
          tx,
          actorId,
          institutionId,
          'admissions.settings',
          true,
        );
        const current = await readAdmissionSettings(tx, institutionId);
        if (current.version !== input.version) admissionConflict();
        const values = { ...input, version: input.version + 1 };
        await tx
          .insert(admissionSettings)
          .values({ institutionId, ...values })
          .onConflictDoUpdate({ target: admissionSettings.institutionId, set: values });
        const pending = await tx
          .select()
          .from(admissionCandidate)
          .where(
            and(
              eq(admissionCandidate.institutionId, institutionId),
              eq(admissionCandidate.state, 'follow_up'),
            ),
          );
        for (const candidate of pending) {
          const [updated] = await tx
            .update(admissionCandidate)
            .set({ version: candidate.version + 1 })
            .where(
              and(
                eq(admissionCandidate.institutionId, institutionId),
                eq(admissionCandidate.id, candidate.id),
              ),
            )
            .returning();
          if (updated) await scheduleFollowUp(tx, updated, access.school.timezone);
        }
        // Settings contain no identity data; retain attributable configuration history.
        await tx
          .insert(admissionConfigurationHistory)
          .values({ institutionId, actorId, value: values });
        return { ...values, timezone: access.school.timezone };
      });
    },
    async addOffering(
      actorId: string,
      institutionId: string,
      input: { session: string; className: string },
    ) {
      return db.transaction(async (tx) => {
        await authorizeAdmissions(tx, actorId, institutionId, 'admissions.settings', true);
        const offering = await createOffering(tx, institutionId, input);
        await tx
          .insert(admissionConfigurationHistory)
          .values({ institutionId, actorId, value: { action: 'offering_added', ...offering } });
        return offering;
      });
    },
  };
}
