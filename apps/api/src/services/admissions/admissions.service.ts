import { and, eq, desc, count, ilike, or, sql, type Database } from '@eduos/database';
import { admissionCandidate, followUpReminder } from '@eduos/database/schema';
import {
  admissionNotificationsSchema,
  candidateListSchema,
  type CandidateListQuery,
} from '@eduos/contracts';
import { authorizeAdmissions } from './policy.js';
import { candidateDetails, candidateSummary, getCandidate } from './records.js';
import { createAdmissionMutations } from './mutations.js';
import { createAdmissionBillingService } from './billing.js';
import { createAdmissionSettingsService } from './settings.js';
export function createAdmissionsService(db: Pick<Database, 'transaction'>) {
  return {
    ...createAdmissionMutations(db),
    ...createAdmissionBillingService(db),
    ...createAdmissionSettingsService(db),
    async list(actorId: string, institutionId: string, query: CandidateListQuery) {
      return db.transaction(async (tx) => {
        const access = await authorizeAdmissions(tx, actorId, institutionId, 'admissions.read');
        const search = query.search.replace(/[\\%_]/g, '\\$&');
        const today = sql`(now() at time zone ${access.school.timezone})::date`;
        const condition = and(
          eq(admissionCandidate.institutionId, institutionId),
          eq(admissionCandidate.state, query.state),
          query.offeringId ? eq(admissionCandidate.offeringId, query.offeringId) : undefined,
          query.assigneeId ? eq(admissionCandidate.assigneeId, query.assigneeId) : undefined,
          access.permissions.includes('admissions.manage')
            ? undefined
            : eq(admissionCandidate.assigneeId, actorId),
          query.search
            ? or(
                ilike(sql`${admissionCandidate.profile}->>'studentName'`, `%${search}%`),
                ilike(sql`${admissionCandidate.profile}->>'phone'`, `%${search}%`),
              )
            : undefined,
          query.state !== 'follow_up' || query.due === 'all'
            ? undefined
            : query.due === 'today'
              ? sql`${admissionCandidate.followUpDate} = ${today}`
              : query.due === 'overdue'
                ? sql`${admissionCandidate.followUpDate} < ${today}`
                : sql`${admissionCandidate.followUpDate} > ${today}`,
        );
        const [total] = await tx
          .select({ value: count() })
          .from(admissionCandidate)
          .where(condition);
        const rows = await tx
          .select()
          .from(admissionCandidate)
          .where(condition)
          .orderBy(
            query.state === 'follow_up'
              ? sql`${admissionCandidate.followUpDate} asc nulls last`
              : desc(admissionCandidate.createdAt),
            admissionCandidate.id,
          )
          .limit(query.limit)
          .offset(query.offset);
        const items = [];
        for (const row of rows) items.push(await candidateSummary(tx, row));
        return candidateListSchema.parse({
          items,
          total: total?.value ?? 0,
          limit: query.limit,
          offset: query.offset,
        });
      });
    },
    async detail(actorId: string, institutionId: string, id: string) {
      return db.transaction(async (tx) => {
        const access = await authorizeAdmissions(tx, actorId, institutionId, 'admissions.read');
        return candidateDetails(tx, await getCandidate(tx, institutionId, id, access));
      });
    },
    async notifications(actorId: string, institutionId: string) {
      return db.transaction(async (tx) => {
        await authorizeAdmissions(tx, actorId, institutionId, 'admissions.read');
        const rows = await tx
          .select({
            id: followUpReminder.id,
            candidateId: followUpReminder.candidateId,
            dueDate: followUpReminder.dueDate,
            kind: followUpReminder.kind,
            read: followUpReminder.read,
            createdAt: followUpReminder.deliveredAt,
          })
          .from(followUpReminder)
          .innerJoin(
            admissionCandidate,
            and(
              eq(admissionCandidate.institutionId, followUpReminder.institutionId),
              eq(admissionCandidate.id, followUpReminder.candidateId),
            ),
          )
          .where(
            and(
              eq(followUpReminder.institutionId, institutionId),
              eq(followUpReminder.recipientId, actorId),
              eq(admissionCandidate.assigneeId, actorId),
              eq(admissionCandidate.state, 'follow_up'),
              eq(admissionCandidate.followUpDate, followUpReminder.dueDate),
              eq(followUpReminder.cancelled, false),
              sql`${followUpReminder.deliveredAt} is not null`,
            ),
          )
          .orderBy(desc(followUpReminder.deliveredAt))
          .limit(100);
        return admissionNotificationsSchema.parse(
          rows.map((row) => ({ ...row, createdAt: row.createdAt?.toISOString() })),
        );
      });
    },
    async readNotification(actorId: string, institutionId: string, id: string) {
      return db.transaction(async (tx) => {
        await authorizeAdmissions(tx, actorId, institutionId, 'admissions.read', true);
        await tx
          .update(followUpReminder)
          .set({ read: true })
          .where(
            and(
              eq(followUpReminder.institutionId, institutionId),
              eq(followUpReminder.recipientId, actorId),
              eq(followUpReminder.id, id),
            ),
          );
        return { ok: true };
      });
    },
  };
}
export type AdmissionsService = ReturnType<typeof createAdmissionsService>;
