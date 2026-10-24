import { and, eq, type DatabaseTransaction } from '@eduos/database';
import {
  institution,
  institutionModuleGrant,
  platformInstitutionChange,
  platformOperator,
} from '@eduos/database/schema';
import { permissionsForPlatformRole, type PlatformPermission } from '@eduos/permissions';
import { forbidden, notFound } from '../../lib/errors.js';

export async function authorizeInstitutionManagement(
  tx: DatabaseTransaction,
  actorUserId: string,
  permission: PlatformPermission,
) {
  const [actor] = await tx
    .select()
    .from(platformOperator)
    .where(eq(platformOperator.userId, actorUserId))
    .for('share');
  if (!actor?.active || !permissionsForPlatformRole(actor.role).includes(permission)) forbidden();
}

async function enabledModules(tx: DatabaseTransaction, institutionId: string) {
  const rows = await tx
    .select({ module: institutionModuleGrant.module })
    .from(institutionModuleGrant)
    .where(
      and(
        eq(institutionModuleGrant.institutionId, institutionId),
        eq(institutionModuleGrant.enabled, true),
      ),
    );
  return rows.map((row) => row.module);
}

export async function institutionRecord(tx: DatabaseTransaction, institutionId: string) {
  const [record] = await tx
    .select({
      id: institution.id,
      code: institution.code,
      name: institution.name,
      slug: institution.slug,
      timezone: institution.timezone,
      type: institution.type,
      status: institution.status,
      statusReason: institution.statusReason,
    })
    .from(institution)
    .where(eq(institution.id, institutionId));
  if (!record) notFound();
  return { ...record, enabledModules: await enabledModules(tx, institutionId) };
}

export async function writeInstitutionAudit(
  tx: DatabaseTransaction,
  input: {
    institutionId: string;
    actorUserId: string;
    changeType: 'created' | 'status' | 'modules' | 'subscription';
    previousValue: unknown | null;
    value: unknown;
    reason?: string | null;
  },
) {
  await tx.insert(platformInstitutionChange).values(input);
}
