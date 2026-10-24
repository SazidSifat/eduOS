import { and, asc, eq, ne, type Database } from '@eduos/database';
import { institution, membership, membershipChange } from '@eduos/database/schema';
import { can, isRole, permissionsForRole, type Role } from '@eduos/permissions';
import { conflict, forbidden } from '../../lib/errors.js';

export interface MembershipState {
  role: Role | null;
  active: boolean;
}
export function createMembershipService(db: Database) {
  return {
    async listMembers(userId: string, institutionId: string, limit: number, offset: number) {
      return db.transaction(async (tx) => {
        // Hold authorization stable until the protected read completes.
        const [actor] = await tx
          .select()
          .from(membership)
          .where(
            and(
              eq(membership.userId, userId),
              eq(membership.institutionId, institutionId),
              eq(membership.active, true),
            ),
          )
          .for('share');
        if (!actor || !permissionsForRole(actor.role).includes('memberships.read')) forbidden();
        const items = await tx
          .select({
            userId: membership.userId,
            role: membership.role,
            active: membership.active,
          })
          .from(membership)
          .where(eq(membership.institutionId, institutionId))
          .orderBy(asc(membership.userId))
          .limit(limit)
          .offset(offset);
        return { items, limit, offset };
      });
    },
    async updateMembership(
      actorUserId: string,
      institutionId: string,
      targetUserId: string,
      state: MembershipState,
    ) {
      return db.transaction(async (tx) => {
        // All role mutations in an institution take this lock first, preventing
        // concurrent demotions from removing the last active Admin.
        const [school] = await tx
          .select({ id: institution.id })
          .from(institution)
          .where(eq(institution.id, institutionId))
          .for('update');
        if (!school) forbidden();
        const [actor] = await tx
          .select()
          .from(membership)
          .where(
            and(eq(membership.institutionId, institutionId), eq(membership.userId, actorUserId)),
          )
          .for('update');
        if (
          !actor?.active ||
          !isRole(actor.role) ||
          !can(
            {
              institutionId,
              userId: actorUserId,
              role: actor.role,
              permissions: new Set(permissionsForRole(actor.role)),
            },
            'memberships.manage',
          )
        )
          forbidden();
        const [target] = await tx
          .select()
          .from(membership)
          .where(
            and(eq(membership.institutionId, institutionId), eq(membership.userId, targetUserId)),
          )
          .for('update');
        // No global account lookup: missing and foreign memberships look identical.
        if (!target) forbidden();
        if (target.active && target.role === 'admin' && (!state.active || state.role !== 'admin')) {
          const [otherAdmin] = await tx
            .select({ userId: membership.userId })
            .from(membership)
            .where(
              and(
                eq(membership.institutionId, institutionId),
                eq(membership.active, true),
                eq(membership.role, 'admin'),
                ne(membership.userId, targetUserId),
              ),
            )
            .limit(1);
          if (!otherAdmin) conflict();
        }
        if (target.role !== state.role || target.active !== state.active) {
          await tx
            .update(membership)
            .set(state)
            .where(
              and(eq(membership.institutionId, institutionId), eq(membership.userId, targetUserId)),
            );
          await tx.insert(membershipChange).values({
            institutionId,
            actorUserId,
            targetUserId,
            previousRole: target.role,
            role: state.role,
            previousActive: target.active,
            active: state.active,
          });
        }
        return { userId: targetUserId, ...state };
      });
    },
  };
}
