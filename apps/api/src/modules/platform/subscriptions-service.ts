import { asc, eq, inArray, type Database } from '@eduos/database';
import { institution, institutionSubscription } from '@eduos/database/schema';
import { notFound } from '../../lib/errors.js';
import { authorizeInstitutionManagement, writeInstitutionAudit } from './institution-policy.js';

type SubscriptionState = {
  planName: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled';
  billingCycle: 'monthly' | 'annual';
  amountTaka: number;
  periodEndsAt: string | null;
};

export function createPlatformSubscriptionService(db: Database) {
  return {
    async listSubscriptions(userId: string, limit: number, offset: number) {
      return db.transaction(async (tx) => {
        await authorizeInstitutionManagement(tx, userId, 'platform.subscriptions.manage');
        const schools = await tx
          .select({
            id: institution.id,
            name: institution.name,
            slug: institution.slug,
            type: institution.type,
          })
          .from(institution)
          .orderBy(asc(institution.id))
          .limit(limit)
          .offset(offset);
        const subscriptions = schools.length
          ? await tx
              .select()
              .from(institutionSubscription)
              .where(
                inArray(
                  institutionSubscription.institutionId,
                  schools.map((school) => school.id),
                ),
              )
          : [];
        const byInstitution = new Map(subscriptions.map((entry) => [entry.institutionId, entry]));
        return {
          items: schools.map((school) => {
            const entry = byInstitution.get(school.id);
            return {
              institution: school,
              subscription: entry ? { ...entry, updatedAt: entry.updatedAt.toISOString() } : null,
            };
          }),
          limit,
          offset,
        };
      });
    },
    async getSubscription(userId: string, institutionId: string) {
      return db.transaction(async (tx) => {
        await authorizeInstitutionManagement(tx, userId, 'platform.subscriptions.manage');
        const [school] = await tx
          .select({ id: institution.id })
          .from(institution)
          .where(eq(institution.id, institutionId));
        if (!school) notFound();
        const [entry] = await tx
          .select()
          .from(institutionSubscription)
          .where(eq(institutionSubscription.institutionId, institutionId));
        return entry ? { ...entry, updatedAt: entry.updatedAt.toISOString() } : null;
      });
    },
    async updateSubscription(actorUserId: string, institutionId: string, state: SubscriptionState) {
      return db.transaction(async (tx) => {
        await authorizeInstitutionManagement(tx, actorUserId, 'platform.subscriptions.manage');
        const [school] = await tx
          .select({ id: institution.id })
          .from(institution)
          .where(eq(institution.id, institutionId))
          .for('update');
        if (!school) notFound();
        const [previous] = await tx
          .select()
          .from(institutionSubscription)
          .where(eq(institutionSubscription.institutionId, institutionId))
          .for('update');
        const changed =
          !previous ||
          previous.planName !== state.planName ||
          previous.status !== state.status ||
          previous.billingCycle !== state.billingCycle ||
          previous.amountTaka !== state.amountTaka ||
          previous.periodEndsAt !== state.periodEndsAt;
        if (previous && !changed)
          return { ...previous, updatedAt: previous.updatedAt.toISOString() };
        const [entry] = await tx
          .insert(institutionSubscription)
          .values({ institutionId, ...state })
          .onConflictDoUpdate({
            target: institutionSubscription.institutionId,
            set: { ...state, updatedAt: new Date() },
          })
          .returning();
        if (!entry) throw new Error('Subscription write returned no row.');
        if (changed)
          await writeInstitutionAudit(tx, {
            institutionId,
            actorUserId,
            changeType: 'subscription',
            previousValue: previous ?? null,
            value: state,
          });
        return { ...entry, updatedAt: entry.updatedAt.toISOString() };
      });
    },
  };
}
