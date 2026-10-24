import { and, asc, eq, inArray, sql, type Database } from '@eduos/database';
import { institution, institutionModuleGrant } from '@eduos/database/schema';
import { institutionModuleKeys, type InstitutionModule } from '@eduos/permissions';
import { ProvisioningConflict, invalidRequest, notFound } from '../../lib/errors.js';
import { provisionInstitutionAdmin } from '../identity/provision-institution-admin.js';
import {
  authorizeInstitutionManagement,
  institutionRecord,
  writeInstitutionAudit,
} from './institution-policy.js';

type InstitutionState = { status: 'active' | 'frozen' | 'inactive'; reason?: string | undefined };

export function createPlatformInstitutionService(db: Database) {
  return {
    async listInstitutions(userId: string, limit: number, offset: number) {
      return db.transaction(async (tx) => {
        await authorizeInstitutionManagement(tx, userId, 'platform.institutions.read');
        const records = await tx
          .select({
            id: institution.id,
            name: institution.name,
            slug: institution.slug,
            timezone: institution.timezone,
            type: institution.type,
            status: institution.status,
            statusReason: institution.statusReason,
          })
          .from(institution)
          .orderBy(asc(institution.id))
          .limit(limit)
          .offset(offset);
        const moduleRows = records.length
          ? await tx
              .select({
                institutionId: institutionModuleGrant.institutionId,
                module: institutionModuleGrant.module,
              })
              .from(institutionModuleGrant)
              .where(
                and(
                  inArray(
                    institutionModuleGrant.institutionId,
                    records.map((record) => record.id),
                  ),
                  eq(institutionModuleGrant.enabled, true),
                ),
              )
          : [];
        const modulesByInstitution = new Map<string, InstitutionModule[]>();
        for (const row of moduleRows) {
          const modules = modulesByInstitution.get(row.institutionId) ?? [];
          modules.push(row.module);
          modulesByInstitution.set(row.institutionId, modules);
        }
        return {
          items: records.map((record) => ({
            ...record,
            enabledModules: modulesByInstitution.get(record.id) ?? [],
          })),
          limit,
          offset,
        };
      });
    },
    async getInstitution(userId: string, institutionId: string) {
      return db.transaction(async (tx) => {
        await authorizeInstitutionManagement(tx, userId, 'platform.institutions.read');
        return institutionRecord(tx, institutionId);
      });
    },
    async createInstitution(
      actorUserId: string,
      values: {
        name: string;
        slug: string;
        timezone: string;
        type: 'kindergarten' | 'high_school' | 'coaching_center';
        firstAdmin: { name: string; email: string; password: string };
      },
    ) {
      return db.transaction(async (tx) => {
        await authorizeInstitutionManagement(tx, actorUserId, 'platform.institutions.create');
        const [record] = await tx
          .insert(institution)
          .values({
            name: values.name,
            slug: values.slug,
            timezone: values.timezone,
            type: values.type,
          })
          .onConflictDoNothing({ target: institution.slug })
          .returning({ id: institution.id });
        if (!record) throw new ProvisioningConflict('INSTITUTION_SLUG_TAKEN');
        const firstAdminUserId = await provisionInstitutionAdmin(tx, record.id, values.firstAdmin);
        await tx.insert(institutionModuleGrant).values(
          institutionModuleKeys.map((module) => ({
            institutionId: record.id,
            module,
            enabled: false,
          })),
        );
        await writeInstitutionAudit(tx, {
          institutionId: record.id,
          actorUserId,
          changeType: 'created',
          previousValue: null,
          value: { type: values.type, enabledModules: [], firstAdminUserId },
        });
        return institutionRecord(tx, record.id);
      });
    },
    async updateInstitutionStatus(
      actorUserId: string,
      institutionId: string,
      state: InstitutionState,
    ) {
      return db.transaction(async (tx) => {
        await authorizeInstitutionManagement(tx, actorUserId, 'platform.institutions.manage');
        const [locked] = await tx
          .select({ id: institution.id })
          .from(institution)
          .where(eq(institution.id, institutionId))
          .for('update');
        if (!locked) notFound();
        const before = await institutionRecord(tx, institutionId);
        const nextReason = state.reason?.trim() || null;
        if (state.status !== 'active' && (!nextReason || nextReason.length < 5)) invalidRequest();
        if (before.status === state.status && before.statusReason === nextReason) return before;
        await tx
          .update(institution)
          .set({
            status: state.status,
            statusReason: nextReason,
            statusUpdatedAt: new Date(),
          })
          .where(eq(institution.id, institutionId));
        const after = { status: state.status, reason: nextReason };
        await writeInstitutionAudit(tx, {
          institutionId,
          actorUserId,
          changeType: 'status',
          previousValue: { status: before.status, reason: before.statusReason },
          value: after,
          reason: after.reason,
        });
        return institutionRecord(tx, institutionId);
      });
    },
    async updateInstitutionModules(
      actorUserId: string,
      institutionId: string,
      values: { enabledModules: InstitutionModule[] },
    ) {
      return db.transaction(async (tx) => {
        await authorizeInstitutionManagement(tx, actorUserId, 'platform.institutions.manage');
        const [locked] = await tx
          .select({ id: institution.id })
          .from(institution)
          .where(eq(institution.id, institutionId))
          .for('update');
        if (!locked) notFound();
        const before = await institutionRecord(tx, institutionId);
        const nextModules = institutionModuleKeys.filter((module) =>
          values.enabledModules.includes(module),
        );
        const changed = institutionModuleKeys.some(
          (module) => before.enabledModules.includes(module) !== nextModules.includes(module),
        );
        if (!changed) return before;
        await tx
          .insert(institutionModuleGrant)
          .values(
            institutionModuleKeys.map((module) => ({
              institutionId,
              module,
              enabled: nextModules.includes(module),
              updatedAt: new Date(),
            })),
          )
          .onConflictDoUpdate({
            target: [institutionModuleGrant.institutionId, institutionModuleGrant.module],
            set: { enabled: sql`excluded.enabled`, updatedAt: new Date() },
          });
        await writeInstitutionAudit(tx, {
          institutionId,
          actorUserId,
          changeType: 'modules',
          previousValue: before.enabledModules,
          value: nextModules,
        });
        return institutionRecord(tx, institutionId);
      });
    },
  };
}
