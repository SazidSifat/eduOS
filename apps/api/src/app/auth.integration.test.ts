import { randomUUID } from 'node:crypto';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { createAuth, hashPassword } from '@eduos/auth/server';
import { createDatabase, eq, sql, migrateDatabase } from '@eduos/database';
import { user, account, institution, membership, rateLimit } from '@eduos/database/schema';
import { parseEnv } from '../config/env.js';
import { createIdentityService } from '../modules/identity/service.js';
import { createApp } from './create-app.js';
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl)
  throw new Error('TEST_DATABASE_URL must point to a dedicated disposable eduos_test database.');
if (!/^eduos_test(?:_[a-z0-9]+)?$/.test(new URL(testUrl).pathname.slice(1)))
  throw new Error('Refusing integration tests outside an eduos_test database.');
const connection = createDatabase(testUrl);
const env = parseEnv({
  DATABASE_URL: testUrl,
  REDIS_URL: 'redis://localhost',
  NODE_ENV: 'test',
  ADMIN_URL: 'http://localhost:5173',
  AUTH_BASE_URL: 'http://localhost:3001',
  AUTH_SECRET: 'test-only-secret-'.repeat(4),
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
  identity: createIdentityService(connection.db),
  logger: { write() {} },
  checkDatabase: async () => {
    await connection.db.execute(sql`select 1`);
  },
});
const userId = randomUUID(),
  schoolA = randomUUID(),
  schoolB = randomUUID();
const email = `${userId}@example.test`,
  password = 'Synthetic-test-password-42';
const ipPrefix = `2001:db8:${userId.slice(0, 4)}:${userId.slice(4, 8)}`;
const ip = `${ipPrefix}::1`;
const post = (path: string, body: unknown, cookie = '', origin = env.ADMIN_URL) =>
  app.request(`http://localhost:3001${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin, cookie, 'x-eduos-client-ip': ip },
    body: JSON.stringify(body),
  });
let cookie = '';
beforeAll(async () => {
  await migrateDatabase(connection.db);
  await connection.db.insert(user).values({ id: userId, email, name: 'Synthetic user' });
  await connection.db.insert(account).values({
    id: randomUUID(),
    userId,
    accountId: userId,
    providerId: 'credential',
    password: await hashPassword(password),
  });
  await connection.db.insert(institution).values([
    { id: schoolA, slug: `a-${userId}`, name: 'Synthetic A' },
    { id: schoolB, slug: `b-${userId}`, name: 'Synthetic B' },
  ]);
  await connection.db.insert(membership).values({ userId, institutionId: schoolA });
});
afterAll(async () => {
  await connection.db.delete(user).where(eq(user.id, userId));
  await connection.db.delete(institution).where(eq(institution.id, schoolA));
  await connection.db.delete(institution).where(eq(institution.id, schoolB));
  // Only this suite's rate-limit keys; never truncate shared tables.
  await connection.db.delete(rateLimit).where(sql`${rateLimit.key} like ${'%' + ipPrefix + '%'}`);
  await connection.close();
});
describe.sequential('real database and Better Auth sessions', () => {
  it('is ready after migration', async () =>
    expect((await app.request('/api/ready')).status).toBe(200));
  it('rejects public registration', async () =>
    expect(
      (await post('/api/auth/sign-up/email', { email, password, name: 'Blocked' })).status,
    ).toBeGreaterThanOrEqual(400));
  it('authenticates and issues an HttpOnly session cookie', async () => {
    const response = await post('/api/auth/sign-in/email', { email, password });
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(response.headers.get('set-cookie')).toContain('SameSite=Lax');
    cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    expect(cookie).toContain('session_token');
  });
  it('validates a real session', async () => {
    const response = await app.request('/api/v1/me', { headers: { cookie } });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: userId });
  });
  it('scopes membership lists and rejects another institution', async () => {
    const list = await app.request('/api/v1/memberships', { headers: { cookie } });
    expect(await list.json()).toEqual([{ institutionId: schoolA, name: 'Synthetic A' }]);
    expect(
      (await app.request(`/api/v1/institutions/${schoolA}/workspace`, { headers: { cookie } }))
        .status,
    ).toBe(200);
    expect(
      (await app.request(`/api/v1/institutions/${schoolB}/workspace`, { headers: { cookie } }))
        .status,
    ).toBe(403);
  });
  it('rejects revoked membership on the next request', async () => {
    await connection.db
      .update(membership)
      .set({ active: false })
      .where(eq(membership.userId, userId));
    expect(
      (await app.request(`/api/v1/institutions/${schoolA}/workspace`, { headers: { cookie } }))
        .status,
    ).toBe(403);
  });
  it('rejects forged auth origins', async () =>
    expect((await post('/api/auth/sign-out', {}, cookie, 'https://evil.example')).status).toBe(
      403,
    ));
  it('revokes the session on logout', async () => {
    expect((await post('/api/auth/sign-out', {}, cookie)).status).toBe(200);
    expect((await app.request('/api/v1/me', { headers: { cookie } })).status).toBe(401);
  });
  it('rate limits repeated invalid logins', async () => {
    let limited = false;
    for (let attempt = 0; attempt < 7; attempt++) {
      if (
        (await post('/api/auth/sign-in/email', { email, password: 'wrong-password' })).status ===
        429
      )
        limited = true;
    }
    expect(limited).toBe(true);
  });
  it('rolls back a failed transaction', async () => {
    const id = randomUUID();
    await expect(
      connection.transaction(async (tx) => {
        await tx.insert(institution).values({ id, name: 'Rolled back', slug: `rollback-${id}` });
        throw new Error('Rollback');
      }),
    ).rejects.toThrow('Rollback');
    expect(
      await connection.db.select().from(institution).where(eq(institution.id, id)),
    ).toHaveLength(0);
  });
});
