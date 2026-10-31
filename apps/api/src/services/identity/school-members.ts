import { and, eq, type DatabaseTransaction } from '@eduos/database';
import { membership, membershipChange, user } from '@eduos/database/schema';
import { roleDefinitions } from '@eduos/permissions';
import type { SchoolAction } from '@eduos/contracts';
import { requireSchool, type SchoolAccess } from '../school/policy.js';
import { createMembershipService } from './membership.service.js';
import { forbidden, invalidRequest, conflict } from '../../lib/errors.js';
export async function runSchoolMembership(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  action: SchoolAction,
) {
  requireSchool(access, 'memberships.manage');
  if (action.type !== 'member-save' && action.type !== 'member-update') invalidRequest();
  const m = action.type === 'member-save' ? action.member : action;
  const role = roleDefinitions.find((r) => r.name === m.role)?.key;
  if (!role) invalidRequest();
  const [existing] = await tx
    .select()
    .from(membership)
    .where(and(eq(membership.institutionId, access.school.id), eq(membership.userId, m.id)));
  if (existing) {
    await createMembershipService(tx).updateMembership(
      access.actor.userId,
      access.school.id,
      m.id,
      { role, active: m.active },
    );
    return m.id;
  }
  if (action.type !== 'member-save' || !action.member.email) invalidRequest();
  const [identity] = await tx
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, action.member.email.toLowerCase()));
  if (!identity) forbidden();
  const [prior] = await tx
    .select()
    .from(membership)
    .where(and(eq(membership.institutionId, access.school.id), eq(membership.userId, identity.id)));
  if (prior) conflict();
  await tx
    .insert(membership)
    .values({ institutionId: access.school.id, userId: identity.id, role, active: m.active });
  await tx.insert(membershipChange).values({
    institutionId: access.school.id,
    actorUserId: access.actor.userId,
    targetUserId: identity.id,
    previousRole: null,
    role,
    previousActive: false,
    active: m.active,
  });
  return identity.id;
}
