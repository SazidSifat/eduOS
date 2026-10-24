import { and, eq, type Database } from '@eduos/database';
import { institution, membership, membershipChange, user } from '@eduos/database/schema';
import { conflict, forbidden } from '../../lib/errors.js';

// Internal development bootstrap, never exposed by a route. Existing institutions only.
export async function bootstrapInstitutionAdmin(
  db: Database,
  institutionId: string,
  email: string,
) {
  await db.transaction(async (tx) => {
    const [school] = await tx
      .select({ id: institution.id })
      .from(institution)
      .where(eq(institution.id, institutionId))
      .for('update');
    if (!school) forbidden();
    const [existingAdmin] = await tx
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.institutionId, institutionId),
          eq(membership.role, 'admin'),
          eq(membership.active, true),
        ),
      )
      .limit(1);
    if (existingAdmin) conflict();
    const [target] = await tx.select({ id: user.id }).from(user).where(eq(user.email, email));
    if (!target) forbidden();
    const [previous] = await tx
      .select()
      .from(membership)
      .where(and(eq(membership.institutionId, institutionId), eq(membership.userId, target.id)))
      .for('update');
    await tx
      .insert(membership)
      .values({ institutionId, userId: target.id, role: 'admin', active: true })
      .onConflictDoUpdate({
        target: [membership.institutionId, membership.userId],
        set: { role: 'admin', active: true },
      });
    await tx.insert(membershipChange).values({
      institutionId,
      actorUserId: target.id,
      targetUserId: target.id,
      previousRole: previous?.role ?? null,
      role: 'admin',
      previousActive: previous?.active ?? false,
      active: true,
    });
  });
}
