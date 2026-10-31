import { and, eq, sql, type Database } from '@eduos/database';
import {
  admissionCandidate,
  institution,
  institutionModuleGrant,
  monthlyFeeSchedule,
  monthlyFeeCharge,
} from '@eduos/database/schema';
import { nextMonthlyDate } from './monthly-dates.js';

// Bounded recovery: one overdue period per schedule per tick, at most 100 schedules.
export async function postMonthlyFees(db: Database, now = new Date()) {
  const instant = now.toISOString();
  const due = await db
    .select({ id: monthlyFeeSchedule.id, institutionId: monthlyFeeSchedule.institutionId })
    .from(monthlyFeeSchedule)
    .innerJoin(institution, eq(institution.id, monthlyFeeSchedule.institutionId))
    .innerJoin(
      institutionModuleGrant,
      and(
        eq(institutionModuleGrant.institutionId, institution.id),
        eq(institutionModuleGrant.module, 'fees'),
        eq(institutionModuleGrant.enabled, true),
      ),
    )
    .where(
      and(
        eq(monthlyFeeSchedule.active, true),
        eq(institution.status, 'active'),
        sql`${monthlyFeeSchedule.nextDueDate} <= (${instant}::timestamptz at time zone ${institution.timezone})::date`,
      ),
    )
    .orderBy(monthlyFeeSchedule.nextDueDate, monthlyFeeSchedule.id)
    .limit(100);
  for (const item of due)
    await db.transaction(async (tx) => {
      // Match school mutation lock order; disabling Fees/freezing/stop cannot race posting.
      const [school] = await tx
        .select({ status: institution.status, timezone: institution.timezone })
        .from(institution)
        .where(eq(institution.id, item.institutionId))
        .for('share');
      if (school?.status !== 'active') return;
      const [grant] = await tx
        .select()
        .from(institutionModuleGrant)
        .where(
          and(
            eq(institutionModuleGrant.institutionId, item.institutionId),
            eq(institutionModuleGrant.module, 'fees'),
          ),
        )
        .for('share');
      if (!grant?.enabled) return;
      const [schedule] = await tx
        .select()
        .from(monthlyFeeSchedule)
        .where(
          and(
            eq(monthlyFeeSchedule.institutionId, item.institutionId),
            eq(monthlyFeeSchedule.id, item.id),
          ),
        )
        .for('update');
      if (!schedule?.active) return;
      const [candidate] = await tx
        .select({ state: admissionCandidate.state })
        .from(admissionCandidate)
        .where(
          and(
            eq(admissionCandidate.institutionId, item.institutionId),
            eq(admissionCandidate.id, schedule.candidateId),
          ),
        );
      if (candidate?.state !== 'admitted') return;
      const result = await tx.execute<{ today: string }>(
        sql`select (${instant}::timestamptz at time zone ${school.timezone})::date::text as today`,
      );
      if (!result.rows[0] || schedule.nextDueDate > result.rows[0].today) return;
      if (schedule.endDate && schedule.nextDueDate > schedule.endDate) {
        await tx
          .update(monthlyFeeSchedule)
          .set({ active: false })
          .where(
            and(
              eq(monthlyFeeSchedule.institutionId, item.institutionId),
              eq(monthlyFeeSchedule.id, item.id),
            ),
          );
        return;
      }
      await tx
        .insert(monthlyFeeCharge)
        .values({
          institutionId: item.institutionId,
          scheduleId: schedule.id,
          dueDate: schedule.nextDueDate,
          amountMinor: schedule.amountMinor,
        })
        .onConflictDoNothing({
          target: [
            monthlyFeeCharge.institutionId,
            monthlyFeeCharge.scheduleId,
            monthlyFeeCharge.dueDate,
          ],
        });
      const nextDueDate = nextMonthlyDate(schedule.startDate, schedule.nextDueDate);
      await tx
        .update(monthlyFeeSchedule)
        .set({ nextDueDate, active: !schedule.endDate || nextDueDate <= schedule.endDate })
        .where(
          and(
            eq(monthlyFeeSchedule.institutionId, item.institutionId),
            eq(monthlyFeeSchedule.id, item.id),
          ),
        );
    });
}
