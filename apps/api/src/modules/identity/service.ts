import { and, eq, type Database } from '@eduos/database';
import { institution, membership } from '@eduos/database/schema';
import type { MembershipResolver, Permission } from '@eduos/permissions';
import { forbidden } from '../../lib/errors.js';
// Foundation grant: active members can read their workspace only. No school roles yet.
const memberPermissions: readonly Permission[] = ['workspace.read'];
export function createIdentityService(db: Database) {
  const resolver: MembershipResolver = {
    async resolve(userId, institutionId) {
      const [row] = await db
        .select()
        .from(membership)
        .where(
          and(
            eq(membership.userId, userId),
            eq(membership.institutionId, institutionId),
            eq(membership.active, true),
          ),
        )
        .limit(1);
      return row ? { userId, institutionId, permissions: new Set(memberPermissions) } : null;
    },
  };
  return {
    resolver,
    async listMemberships(userId: string) {
      return db
        .select({ institutionId: institution.id, name: institution.name })
        .from(membership)
        .innerJoin(institution, eq(institution.id, membership.institutionId))
        .where(and(eq(membership.userId, userId), eq(membership.active, true)));
    },
    async getWorkspace(userId: string, institutionId: string) {
      // Repeat scoped ownership at the data boundary; membership can be revoked between requests.
      const [row] = await db
        .select({
          institutionId: institution.id,
          name: institution.name,
          timezone: institution.timezone,
        })
        .from(membership)
        .innerJoin(institution, eq(institution.id, membership.institutionId))
        .where(
          and(
            eq(membership.userId, userId),
            eq(membership.institutionId, institutionId),
            eq(membership.active, true),
          ),
        )
        .limit(1);
      if (!row) forbidden();
      return row;
    },
  };
}
export type IdentityService = ReturnType<typeof createIdentityService>;
