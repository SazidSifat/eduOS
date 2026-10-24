import { and, eq, type Database } from '@eduos/database';
import { platformOperator, platformOperatorChange, user } from '@eduos/database/schema';
import { conflict, forbidden } from '../../lib/errors.js';
import { platformAccessLock } from './service.js';

export async function bootstrapPlatformOwner(db: Database, email: string) {
  await db.transaction(async (tx) => {
    await tx.execute(platformAccessLock);
    const [owner] = await tx
      .select()
      .from(platformOperator)
      .where(and(eq(platformOperator.role, 'platform_owner'), eq(platformOperator.active, true)))
      .limit(1);
    if (owner) conflict();
    const [target] = await tx.select({ id: user.id }).from(user).where(eq(user.email, email));
    if (!target) forbidden();
    const [previous] = await tx
      .select()
      .from(platformOperator)
      .where(eq(platformOperator.userId, target.id))
      .for('update');
    await tx
      .insert(platformOperator)
      .values({ userId: target.id, role: 'platform_owner', active: true })
      .onConflictDoUpdate({
        target: platformOperator.userId,
        set: { role: 'platform_owner', active: true },
      });
    await tx.insert(platformOperatorChange).values({
      actorUserId: target.id,
      targetUserId: target.id,
      previousRole: previous?.role ?? null,
      role: 'platform_owner',
      previousActive: previous?.active ?? null,
      active: true,
    });
  });
}
