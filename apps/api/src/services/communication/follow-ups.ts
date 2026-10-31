import {
  and,
  eq,
  isNull,
  lte,
  sql,
  type Database,
  type DatabaseTransaction,
} from '@eduos/database';
import {
  admissionCandidate,
  admissionSettings,
  followUpReminder,
  institution,
  institutionModuleGrant,
  membership,
} from '@eduos/database/schema';
import { permissionsForRole } from '@eduos/permissions';

export async function scheduleFollowUp(
  tx: DatabaseTransaction,
  candidate: typeof admissionCandidate.$inferSelect,
  timezone: string,
) {
  await tx
    .update(followUpReminder)
    .set({ cancelled: true })
    .where(
      and(
        eq(followUpReminder.institutionId, candidate.institutionId),
        eq(followUpReminder.candidateId, candidate.id),
        isNull(followUpReminder.deliveredAt),
      ),
    );
  if (candidate.state !== 'follow_up' || !candidate.followUpDate) return;
  const [settings] = await tx
    .select()
    .from(admissionSettings)
    .where(eq(admissionSettings.institutionId, candidate.institutionId));
  if (!settings) return;
  for (const kind of ['before', 'on_date'] as const) {
    const [delivered] = await tx
      .select()
      .from(followUpReminder)
      .where(
        and(
          eq(followUpReminder.institutionId, candidate.institutionId),
          eq(followUpReminder.candidateId, candidate.id),
          eq(followUpReminder.dueDate, candidate.followUpDate),
          eq(followUpReminder.kind, kind),
          eq(followUpReminder.recipientId, candidate.assigneeId),
          sql`${followUpReminder.deliveredAt} is not null`,
        ),
      )
      .limit(1);
    if (delivered) continue;
    const days = kind === 'before' ? settings.reminderDaysBefore : 0;
    const time = kind === 'before' ? settings.beforeTime : settings.onDateTime;
    await tx.insert(followUpReminder).values({
      institutionId: candidate.institutionId,
      candidateId: candidate.id,
      recipientId: candidate.assigneeId,
      candidateVersion: candidate.version,
      dueDate: candidate.followUpDate,
      kind,
      deliverAt: sql`((${candidate.followUpDate}::date - ${days}::int) + ${time}::time) at time zone ${timezone}`,
    });
  }
}

// The PostgreSQL row is both the durable job and the in-app notification. Delivery
// and visible notification creation commit together, so retrying cannot double-send.
export async function deliverFollowUps(db: Database, now = new Date()) {
  const due = await db
    .selectDistinct({ institutionId: followUpReminder.institutionId })
    .from(followUpReminder)
    .innerJoin(institution, eq(institution.id, followUpReminder.institutionId))
    .innerJoin(
      institutionModuleGrant,
      and(
        eq(institutionModuleGrant.institutionId, institution.id),
        eq(institutionModuleGrant.module, 'admissions'),
        eq(institutionModuleGrant.enabled, true),
      ),
    )
    .where(
      and(
        eq(followUpReminder.cancelled, false),
        eq(institution.status, 'active'),
        isNull(followUpReminder.deliveredAt),
        lte(followUpReminder.deliverAt, now),
      ),
    )
    .limit(25);
  let delivered = 0;
  for (const scope of due) {
    delivered += await db.transaction(async (tx) => {
      const [school] = await tx
        .select()
        .from(institution)
        .where(eq(institution.id, scope.institutionId))
        .for('update');
      if (school?.status !== 'active') return 0;
      const [module] = await tx
        .select()
        .from(institutionModuleGrant)
        .where(
          and(
            eq(institutionModuleGrant.institutionId, school.id),
            eq(institutionModuleGrant.module, 'admissions'),
            eq(institutionModuleGrant.enabled, true),
          ),
        );
      if (!module) return 0;
      const jobs = await tx
        .select()
        .from(followUpReminder)
        .where(
          and(
            eq(followUpReminder.institutionId, school.id),
            eq(followUpReminder.cancelled, false),
            isNull(followUpReminder.deliveredAt),
            lte(followUpReminder.deliverAt, now),
          ),
        )
        .orderBy(followUpReminder.deliverAt)
        .limit(200)
        .for('update');
      let count = 0;
      for (const job of jobs) {
        const [candidate] = await tx
          .select()
          .from(admissionCandidate)
          .where(
            and(
              eq(admissionCandidate.institutionId, school.id),
              eq(admissionCandidate.id, job.candidateId),
            ),
          );
        const [recipient] = await tx
          .select()
          .from(membership)
          .where(
            and(eq(membership.institutionId, school.id), eq(membership.userId, job.recipientId)),
          )
          .for('share');
        const valid =
          candidate?.state === 'follow_up' &&
          candidate.version === job.candidateVersion &&
          candidate.assigneeId === job.recipientId &&
          recipient?.active &&
          permissionsForRole(recipient.role).includes('admissions.read');
        // Check beyond this batch: overdue on-date jobs may be after the limit.
        const [onDateJob] =
          job.kind === 'before'
            ? await tx
                .select({ id: followUpReminder.id })
                .from(followUpReminder)
                .where(
                  and(
                    eq(followUpReminder.institutionId, school.id),
                    eq(followUpReminder.candidateId, job.candidateId),
                    eq(followUpReminder.candidateVersion, job.candidateVersion),
                    eq(followUpReminder.kind, 'on_date'),
                    eq(followUpReminder.cancelled, false),
                    lte(followUpReminder.deliverAt, now),
                  ),
                )
                .limit(1)
            : [];
        const onDateDue = Boolean(onDateJob);
        await tx
          .update(followUpReminder)
          .set(valid && !onDateDue ? { deliveredAt: now } : { cancelled: true })
          .where(eq(followUpReminder.id, job.id));
        if (valid && !onDateDue) count++;
      }
      return count;
    });
  }
  return delivered;
}
