import { and, eq, type Database } from '@eduos/database';
import { platformOperator, platformOperatorChange, user } from '@eduos/database/schema';
import { conflict, forbidden } from '../../lib/errors.js';
import { platformAccessLock } from './platform.service.js';

// Development-only operator handoff. It never deletes identities or audit history.
export async function replacePlatformOwner(db: Database, email: string) {
  await db.transaction(async (tx) => {
    await tx.execute(platformAccessLock);
    const owners = await tx
      .select()
      .from(platformOperator)
      .where(and(eq(platformOperator.role, 'platform_owner'), eq(platformOperator.active, true)))
      .for('update');
    if (owners.length > 1) conflict();

    const [targetUser] = await tx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email.toLowerCase()));
    if (!targetUser) forbidden();

    const [previousTarget] = await tx
      .select()
      .from(platformOperator)
      .where(eq(platformOperator.userId, targetUser.id))
      .for('update');
    const previousOwner = owners[0];
    if (previousOwner?.userId === targetUser.id) conflict();

    await tx
      .insert(platformOperator)
      .values({ userId: targetUser.id, role: 'platform_owner', active: true })
      .onConflictDoUpdate({
        target: platformOperator.userId,
        set: { role: 'platform_owner', active: true },
      });
    await tx.insert(platformOperatorChange).values({
      actorUserId: targetUser.id,
      targetUserId: targetUser.id,
      previousRole: previousTarget?.role ?? null,
      role: 'platform_owner',
      previousActive: previousTarget?.active ?? null,
      active: true,
    });

    if (previousOwner) {
      await tx
        .update(platformOperator)
        .set({ active: false })
        .where(eq(platformOperator.userId, previousOwner.userId));
      await tx.insert(platformOperatorChange).values({
        actorUserId: targetUser.id,
        targetUserId: previousOwner.userId,
        previousRole: previousOwner.role,
        role: previousOwner.role,
        previousActive: true,
        active: false,
      });
    }
  });
}
