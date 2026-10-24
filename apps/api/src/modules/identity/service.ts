import { and, eq, type Database } from '@eduos/database';
import { institution, membership } from '@eduos/database/schema';
import { isRole, permissionsForRole, type MembershipResolver } from '@eduos/permissions';
import { forbidden } from '../../lib/errors.js';
import { createMembershipService } from './membership-service.js';
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
      return row && isRole(row.role)
        ? {
            userId,
            institutionId,
            role: row.role,
            permissions: new Set(permissionsForRole(row.role)),
          }
        : null;
    },
  };
  return {
    ...createMembershipService(db),
    resolver,
    async getAccess(userId: string, institutionId: string) {
      const context = await resolver.resolve(userId, institutionId);
      if (!context) forbidden();
      return { ...context, permissions: [...context.permissions] };
    },
    async listMemberships(userId: string) {
      return db
        .select({ institutionId: institution.id, name: institution.name, role: membership.role })
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
          role: membership.role,
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
      if (!row || !permissionsForRole(row.role).includes('workspace.read')) forbidden();
      return { institutionId: row.institutionId, name: row.name, timezone: row.timezone };
    },
  };
}
export type IdentityService = ReturnType<typeof createIdentityService>;
