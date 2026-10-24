import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createAuth, hashPassword } from '@eduos/auth/server';
import { and, createDatabase, eq, inArray, migrateDatabase, sql } from '@eduos/database';
import {
  account,
  institution,
  membership,
  membershipChange,
  platformOperator,
  platformOperatorChange,
  rateLimit,
  user,
} from '@eduos/database/schema';
import { parseEnv } from '../config/env.js';
import { createIdentityService } from '../modules/identity/service.js';
import { createPlatformService } from '../modules/platform/service.js';
import { bootstrapInstitutionAdmin } from '../modules/identity/bootstrap.js';
import { bootstrapPlatformOwner } from '../modules/platform/bootstrap.js';
import { createApp } from './create-app.js';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !/^eduos_test(?:_[a-z0-9]+)?$/.test(new URL(testUrl).pathname.slice(1)))
  throw new Error('TEST_DATABASE_URL must point to a dedicated eduos_test database.');
const connection = createDatabase(testUrl);
const identity = createIdentityService(connection.db);
const platform = createPlatformService(connection.db);
const env = parseEnv({
  DATABASE_URL: testUrl,
  REDIS_URL: 'redis://localhost',
  NODE_ENV: 'test',
  ADMIN_URL: 'http://localhost:5173',
  AUTH_BASE_URL: 'http://localhost:3001',
  AUTH_SECRET: 'synthetic-rbac-secret-'.repeat(4),
  CORS_TRUSTED_ORIGINS: 'http://localhost:5173',
});
const auth = createAuth(connection.db, {
  baseURL: env.AUTH_BASE_URL,
  secret: env.AUTH_SECRET,
  trustedOrigins: env.CORS_TRUSTED_ORIGINS,
  production: false,
});
const app = createApp({
  env,
  auth,
  identity,
  platform,
  logger: { write() {} },
  checkDatabase: async () => {
    await connection.db.execute(sql`select 1`);
  },
});
const ids = {
  admin: randomUUID(),
  principal: randomUUID(),
  teacher: randomUUID(),
  secondAdmin: randomUUID(),
  owner: randomUUID(),
  secondOwner: randomUUID(),
  manager: randomUUID(),
  unassigned: randomUUID(),
  outsider: randomUUID(),
};
const schoolA = randomUUID(),
  schoolB = randomUUID();
const userIds = Object.values(ids);
const password = 'Synthetic-rbac-password-42';
const ipPrefix = `2001:db8:${schoolA.slice(0, 4)}:${schoolA.slice(4, 8)}`;
const cookies = new Map<string, string>();
let fixturesStarted = false;
const memberPath = (target: string) => `/api/v1/institutions/${schoolA}/memberships/${target}`;
async function request(path: string, actor: string, body?: unknown) {
  const cookie = cookies.get(actor);
  if (!cookie) throw new Error('Synthetic login missing');
  return app.request(
    `http://localhost:3001${path}`,
    body === undefined
      ? { headers: { cookie } }
      : {
          method: 'PUT',
          headers: { cookie, origin: env.ADMIN_URL, 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
  );
}
beforeAll(async () => {
  await migrateDatabase(connection.db);
  await migrateDatabase(connection.db); // Committed migrations must be safe to reapply.
  if ((await connection.db.select().from(platformOperator).limit(1)).length)
    throw new Error(
      'RBAC integration requires an isolated test database without existing platform operators.',
    );
  fixturesStarted = true;
  await connection.db
    .insert(user)
    .values(userIds.map((id) => ({ id, email: `${id}@example.test`, name: 'Synthetic RBAC' })));
  const hash = await hashPassword(password);
  await connection.db.insert(account).values(
    userIds.map((id) => ({
      id: randomUUID(),
      userId: id,
      accountId: id,
      providerId: 'credential',
      password: hash,
    })),
  );
  await connection.db.insert(institution).values([
    { id: schoolA, name: 'Synthetic RBAC A', slug: `a-${schoolA}` },
    { id: schoolB, name: 'Synthetic RBAC B', slug: `b-${schoolB}` },
  ]);
  await connection.db.insert(membership).values([
    { institutionId: schoolA, userId: ids.admin, role: 'admin' },
    { institutionId: schoolA, userId: ids.secondAdmin, role: 'admin' },
    { institutionId: schoolA, userId: ids.principal, role: 'principal' },
    { institutionId: schoolA, userId: ids.teacher, role: 'teacher' },
    { institutionId: schoolA, userId: ids.unassigned },
    { institutionId: schoolB, userId: ids.outsider, role: 'admin' },
    { institutionId: schoolB, userId: ids.admin, role: 'teacher' },
  ]);
  await connection.db.insert(platformOperator).values([
    { userId: ids.owner, role: 'platform_owner' },
    { userId: ids.secondOwner, role: 'platform_owner' },
    { userId: ids.manager, role: 'platform_manager' },
  ]);
  for (const [index, id] of userIds.entries()) {
    const response = await app.request('http://localhost:3001/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        origin: env.ADMIN_URL,
        'content-type': 'application/json',
        'x-eduos-client-ip': `${ipPrefix}::${index + 1}`,
      },
      body: JSON.stringify({ email: `${id}@example.test`, password }),
    });
    expect(response.status).toBe(200);
    cookies.set(
      id,
      response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; '),
    );
  }
});
beforeEach(async () => {
  await connection.db
    .delete(membershipChange)
    .where(inArray(membershipChange.institutionId, [schoolA, schoolB]));
  await connection.db
    .delete(platformOperatorChange)
    .where(inArray(platformOperatorChange.actorUserId, userIds));
  await connection.db.delete(platformOperator).where(eq(platformOperator.userId, ids.teacher));
  for (const [userId, role] of [
    [ids.admin, 'admin'],
    [ids.secondAdmin, 'admin'],
    [ids.principal, 'principal'],
    [ids.teacher, 'teacher'],
    [ids.unassigned, null],
  ] as const) {
    await connection.db
      .update(membership)
      .set({ role, active: true })
      .where(and(eq(membership.institutionId, schoolA), eq(membership.userId, userId)));
  }
  for (const [userId, role] of [
    [ids.owner, 'platform_owner'],
    [ids.secondOwner, 'platform_owner'],
    [ids.manager, 'platform_manager'],
  ] as const) {
    await connection.db
      .update(platformOperator)
      .set({ role, active: true })
      .where(eq(platformOperator.userId, userId));
  }
});
afterAll(async () => {
  try {
    if (!fixturesStarted) return;
    await connection.db
      .delete(membershipChange)
      .where(inArray(membershipChange.institutionId, [schoolA, schoolB]));
    await connection.db
      .delete(platformOperatorChange)
      .where(inArray(platformOperatorChange.actorUserId, userIds));
    await connection.db.delete(platformOperator).where(inArray(platformOperator.userId, userIds));
    await connection.db.delete(user).where(inArray(user.id, userIds));
    await connection.db.delete(institution).where(inArray(institution.id, [schoolA, schoolB]));
    await connection.db.delete(rateLimit).where(sql`${rateLimit.key} like ${'%' + ipPrefix + '%'}`);
  } finally {
    await connection.close();
  }
});

describe.sequential('real institution RBAC', () => {
  it('keeps a user role institution-specific and denies unassigned membership', async () => {
    expect((await identity.getAccess(ids.admin, schoolA)).role).toBe('admin');
    expect((await identity.getAccess(ids.admin, schoolB)).role).toBe('teacher');
    await expect(identity.getWorkspace(ids.unassigned, schoolA)).rejects.toMatchObject({
      status: 403,
    });
  });
  it('allows Principal role changes and writes one atomic audit event for repeated desired state', async () => {
    const body = { role: 'accountant', active: true };
    expect((await request(memberPath(ids.teacher), ids.principal, body)).status).toBe(200);
    expect((await request(memberPath(ids.teacher), ids.principal, body)).status).toBe(200);
    expect((await identity.getAccess(ids.teacher, schoolA)).role).toBe('accountant');
    const changes = await connection.db
      .select()
      .from(membershipChange)
      .where(eq(membershipChange.institutionId, schoolA));
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      actorUserId: ids.principal,
      targetUserId: ids.teacher,
      previousRole: 'teacher',
      role: 'accountant',
    });
  });
  it('denies teacher escalation and foreign membership changes without audit writes', async () => {
    expect(
      (await request(memberPath(ids.teacher), ids.teacher, { role: 'admin', active: true })).status,
    ).toBe(403);
    expect(
      (await request(memberPath(ids.outsider), ids.admin, { role: 'teacher', active: true }))
        .status,
    ).toBe(403);
    expect(
      await connection.db
        .select()
        .from(membershipChange)
        .where(eq(membershipChange.institutionId, schoolA)),
    ).toHaveLength(0);
  });
  it('honors demotion and revocation in the same authenticated session', async () => {
    expect(
      (await request(memberPath(ids.principal), ids.admin, { role: 'teacher', active: true }))
        .status,
    ).toBe(200);
    expect(
      (await request(memberPath(ids.teacher), ids.principal, { role: 'admin', active: true }))
        .status,
    ).toBe(403);
    expect(
      (await request(memberPath(ids.principal), ids.admin, { role: null, active: false })).status,
    ).toBe(200);
    expect((await request(`/api/v1/institutions/${schoolA}/access`, ids.principal)).status).toBe(
      403,
    );
  });
  it('rechecks a previously resolved grant inside the mutation service', async () => {
    expect(await identity.resolver.resolve(ids.principal, schoolA)).not.toBeNull();
    await identity.updateMembership(ids.admin, schoolA, ids.principal, {
      role: 'teacher',
      active: true,
    });
    await expect(
      identity.updateMembership(ids.principal, schoolA, ids.teacher, {
        role: 'admin',
        active: true,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it('protects the last active Admin against concurrent demotions', async () => {
    const results = await Promise.allSettled([
      identity.updateMembership(ids.principal, schoolA, ids.admin, {
        role: 'teacher',
        active: true,
      }),
      identity.updateMembership(ids.principal, schoolA, ids.secondAdmin, {
        role: 'teacher',
        active: true,
      }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const failure = results.find((result) => result.status === 'rejected');
    expect(failure).toMatchObject({ reason: { status: 409 } });
    const admins = await connection.db
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.institutionId, schoolA),
          eq(membership.role, 'admin'),
          eq(membership.active, true),
        ),
      );
    expect(admins).toHaveLength(1);
  });
  it('rejects audit references that cross institutions', async () => {
    await expect(
      connection.db.insert(membershipChange).values({
        institutionId: schoolA,
        actorUserId: ids.admin,
        targetUserId: ids.outsider,
        previousRole: null,
        role: 'teacher',
        previousActive: false,
        active: true,
      }),
    ).rejects.toThrow();
  });
  it('rolls back the membership mutation if audit persistence fails', async () => {
    // Add a fixture-specific constraint that rejects this test's audit write only.
    const constraint = sql.identifier(`rbac_audit_${schoolA.replaceAll('-', '')}`);
    await connection.db.execute(sql`alter table membership_change add constraint ${constraint}
      check (institution_id::text <> ${sql.raw("'" + schoolA + "'")}) not valid`);
    try {
      await expect(
        identity.updateMembership(ids.admin, schoolA, ids.teacher, {
          role: 'accountant',
          active: true,
        }),
      ).rejects.toThrow();
      expect((await identity.getAccess(ids.teacher, schoolA)).role).toBe('teacher');
    } finally {
      await connection.db.execute(sql`alter table membership_change drop constraint ${constraint}`);
    }
  });
  it('refuses bootstrap when an active Admin exists', async () => {
    await expect(
      bootstrapInstitutionAdmin(connection.db, schoolA, `${ids.unassigned}@example.test`),
    ).rejects.toMatchObject({ status: 409 });
  });
});
describe.sequential('real platform authorization', () => {
  it('separates school and platform privileges with real sessions', async () => {
    expect((await request('/api/v1/platform/access', ids.admin)).status).toBe(403);
    expect((await request(`/api/v1/institutions/${schoolA}/access`, ids.owner)).status).toBe(403);
    expect((await request('/api/v1/platform/institutions', ids.manager)).status).toBe(200);
    expect((await request('/api/v1/platform/operators', ids.manager)).status).toBe(403);
  });
  it('allows only an Owner to provision platform access and audits changes', async () => {
    const path = `/api/v1/platform/operators/${ids.teacher}`;
    const body = { role: 'platform_manager', active: true };
    expect((await request(path, ids.manager, body)).status).toBe(403);
    expect((await request(path, ids.owner, body)).status).toBe(200);
    expect((await platform.getAccess(ids.teacher)).role).toBe('platform_manager');
    const changes = await connection.db
      .select()
      .from(platformOperatorChange)
      .where(eq(platformOperatorChange.actorUserId, ids.owner));
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ previousRole: null, role: 'platform_manager' });
  });
  it('honors platform deactivation without logout and revalidates service access', async () => {
    expect(await platform.resolver.resolve(ids.manager)).not.toBeNull();
    await platform.updateOperator(ids.owner, ids.manager, {
      role: 'platform_manager',
      active: false,
    });
    expect((await request('/api/v1/platform/access', ids.manager)).status).toBe(403);
    await expect(platform.listInstitutions(ids.manager, 10, 0)).rejects.toMatchObject({
      status: 403,
    });
  });
  it('prevents concurrent removal of every Owner', async () => {
    const results = await Promise.allSettled([
      platform.updateOperator(ids.owner, ids.secondOwner, {
        role: 'platform_manager',
        active: true,
      }),
      platform.updateOperator(ids.secondOwner, ids.owner, {
        role: 'platform_manager',
        active: true,
      }),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const owners = await connection.db
      .select()
      .from(platformOperator)
      .where(
        and(
          eq(platformOperator.role, 'platform_owner'),
          eq(platformOperator.active, true),
          inArray(platformOperator.userId, userIds),
        ),
      );
    expect(owners).toHaveLength(1);
  });
  it('protects the last Owner and refuses repeated bootstrap', async () => {
    await platform.updateOperator(ids.owner, ids.secondOwner, {
      role: 'platform_manager',
      active: false,
    });
    await expect(
      platform.updateOperator(ids.owner, ids.owner, { role: 'platform_manager', active: true }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      bootstrapPlatformOwner(connection.db, `${ids.teacher}@example.test`),
    ).rejects.toMatchObject({ status: 409 });
  });
});
