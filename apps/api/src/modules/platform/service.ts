import { and, asc, eq, ne, sql, type Database, type DatabaseTransaction } from '@eduos/database';
import {
  institution,
  platformOperator,
  platformOperatorChange,
  user,
} from '@eduos/database/schema';
import {
  permissionsForPlatformRole,
  type PlatformPermission,
  type PlatformResolver,
  type PlatformRole,
} from '@eduos/permissions';
import { conflict, forbidden } from '../../lib/errors.js';

// One transaction-scoped lock serializes platform staff changes, including bootstrap.
// Stable namespace/key: callers must acquire it before locking operator rows.
export const platformAccessLock = sql`select pg_advisory_xact_lock(164720, 1)`;
export function createPlatformService(db: Database) {
  const resolver: PlatformResolver = {
    async resolve(userId) {
      const [row] = await db
        .select()
        .from(platformOperator)
        .where(and(eq(platformOperator.userId, userId), eq(platformOperator.active, true)));
      return row
        ? { userId, role: row.role, permissions: new Set(permissionsForPlatformRole(row.role)) }
        : null;
    },
  };
  async function readAuthorized<T>(
    userId: string,
    permission: PlatformPermission,
    read: (tx: DatabaseTransaction) => Promise<T>,
  ) {
    return db.transaction(async (tx) => {
      const [actor] = await tx
        .select()
        .from(platformOperator)
        .where(eq(platformOperator.userId, userId))
        .for('share');
      if (!actor?.active || !permissionsForPlatformRole(actor.role).includes(permission))
        forbidden();
      return read(tx);
    });
  }
  return {
    resolver,
    async getAccess(userId: string) {
      const context = await resolver.resolve(userId);
      if (!context) forbidden();
      return { ...context, permissions: [...context.permissions] };
    },
    async listInstitutions(userId: string, limit: number, offset: number) {
      return readAuthorized(userId, 'platform.institutions.read', async (tx) => ({
        items: await tx
          .select({
            id: institution.id,
            name: institution.name,
            slug: institution.slug,
            timezone: institution.timezone,
          })
          .from(institution)
          .orderBy(asc(institution.id))
          .limit(limit)
          .offset(offset),
        limit,
        offset,
      }));
    },
    async listOperators(userId: string, limit: number, offset: number) {
      return readAuthorized(userId, 'platform.operators.manage', async (tx) => ({
        items: await tx
          .select({
            userId: platformOperator.userId,
            role: platformOperator.role,
            active: platformOperator.active,
          })
          .from(platformOperator)
          .orderBy(asc(platformOperator.userId))
          .limit(limit)
          .offset(offset),
        limit,
        offset,
      }));
    },
    async updateOperator(
      actorUserId: string,
      targetUserId: string,
      state: { role: PlatformRole; active: boolean },
    ) {
      return db.transaction(async (tx) => {
        await tx.execute(platformAccessLock);
        const [actor] = await tx
          .select()
          .from(platformOperator)
          .where(eq(platformOperator.userId, actorUserId))
          .for('update');
        if (
          !actor?.active ||
          !permissionsForPlatformRole(actor.role).includes('platform.operators.manage')
        )
          forbidden();
        const [targetUser] = await tx
          .select({ id: user.id })
          .from(user)
          .where(eq(user.id, targetUserId));
        if (!targetUser) forbidden();
        const [target] = await tx
          .select()
          .from(platformOperator)
          .where(eq(platformOperator.userId, targetUserId))
          .for('update');
        if (
          target?.active &&
          target.role === 'platform_owner' &&
          (!state.active || state.role !== 'platform_owner')
        ) {
          const [otherOwner] = await tx
            .select({ userId: platformOperator.userId })
            .from(platformOperator)
            .where(
              and(
                eq(platformOperator.active, true),
                eq(platformOperator.role, 'platform_owner'),
                ne(platformOperator.userId, targetUserId),
              ),
            )
            .limit(1);
          if (!otherOwner) conflict();
        }
        if (!target || target.role !== state.role || target.active !== state.active) {
          await tx
            .insert(platformOperator)
            .values({ userId: targetUserId, ...state })
            .onConflictDoUpdate({ target: platformOperator.userId, set: state });
          await tx.insert(platformOperatorChange).values({
            actorUserId,
            targetUserId,
            previousRole: target?.role ?? null,
            role: state.role,
            previousActive: target?.active ?? null,
            active: state.active,
          });
        }
        return { userId: targetUserId, ...state };
      });
    },
  };
}
export type PlatformService = ReturnType<typeof createPlatformService>;
