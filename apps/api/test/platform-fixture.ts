import { randomBytes, randomUUID } from 'node:crypto';
import { createAuth, hashPassword } from '@eduos/auth/server';
import { createDatabase, eq, inArray, migrateDatabase } from '@eduos/database';
import {
  account,
  institution,
  institutionModuleGrant,
  institutionSubscription,
  membership,
  membershipChange,
  platformInstitutionChange,
  platformOperator,
  platformOperatorChange,
  user,
} from '@eduos/database/schema';
import { platformInstitutionSchema, type platformInstitutionCreateSchema } from '@eduos/contracts';
import type { z } from 'zod';
import { createApp } from '../src/app/create-app.js';
import { parseEnv } from '../src/config/env.js';
import { createIdentityService } from '../src/modules/identity/service.js';
import { createPlatformService } from '../src/modules/platform/service.js';
import { createAdmissionsService } from '../src/modules/admissions/service.js';

export function institutionInput(): z.input<typeof platformInstitutionCreateSchema> {
  const suffix = randomUUID();
  return {
    name: 'Synthetic platform institution',
    slug: `platform-${suffix}`,
    timezone: 'Asia/Dhaka',
    type: 'high_school',
    firstAdmin: {
      name: 'Synthetic school Admin',
      email: `${suffix}@example.test`,
      password: randomBytes(24).toString('base64url'),
    },
  };
}

export function createPlatformFixture(options: { adminUrl?: string; authBaseUrl?: string } = {}) {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl || !/^eduos_test(?:_[a-z0-9]+)?$/.test(new URL(testUrl).pathname.slice(1)))
    throw new Error('TEST_DATABASE_URL must reference a dedicated eduos_test database.');
  const connection = createDatabase(testUrl);
  const identity = createIdentityService(connection.db);
  const platform = createPlatformService(connection.db);
  const admissions = createAdmissionsService(connection.db);
  const env = parseEnv({
    NODE_ENV: 'test',
    DATABASE_URL: testUrl,
    REDIS_URL: 'redis://localhost',
    ADMIN_URL: options.adminUrl ?? 'http://localhost:5173',
    AUTH_BASE_URL: options.authBaseUrl ?? 'http://localhost:3001',
    AUTH_SECRET: randomBytes(48).toString('hex'),
    CORS_TRUSTED_ORIGINS: options.adminUrl ?? 'http://localhost:5173',
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
    admissions,
    logger: { write() {} },
    checkDatabase: async () => {},
  });
  const operatorIds = { owner: randomUUID(), manager: randomUUID() };
  const cookies = new Map<string, string>();
  const schools: string[] = [];
  const admins: string[] = [];
  let loginCounter = 0;
  const ipPrefix = `2001:db8:${randomBytes(2).toString('hex')}`;

  async function login(email: string, password: string) {
    const response = await app.request(`${env.AUTH_BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        origin: env.ADMIN_URL,
        'content-type': 'application/json',
        'x-eduos-client-ip': `${ipPrefix}:${(++loginCounter).toString(16)}::1`,
      },
      body: JSON.stringify({ email, password }),
    });
    if (response.status !== 200)
      throw new Error(`Synthetic account could not sign in (HTTP ${response.status}).`);
    return response.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
  }
  async function request(
    path: string,
    method = 'GET',
    body?: unknown,
    cookie = cookies.get('owner'),
  ) {
    return app.request(`${env.AUTH_BASE_URL}${path}`, {
      method,
      headers: {
        ...(cookie ? { cookie } : {}),
        origin: env.ADMIN_URL,
        'content-type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  return {
    ...connection,
    identity,
    platform,
    admissions,
    auth,
    app,
    operatorIds,
    cookies,
    request,
    login,
    async setup() {
      await migrateDatabase(connection.db);
      await migrateDatabase(connection.db);
      const password = randomBytes(24).toString('base64url');
      const hashed = await hashPassword(password);
      for (const [role, id] of Object.entries(operatorIds)) {
        await connection.db
          .insert(user)
          .values({ id, name: 'Synthetic platform operator', email: `${id}@example.test` });
        await connection.db.insert(account).values({
          id: randomUUID(),
          userId: id,
          accountId: id,
          providerId: 'credential',
          password: hashed,
        });
        await connection.db
          .insert(platformOperator)
          .values({ userId: id, role: role === 'owner' ? 'platform_owner' : 'platform_manager' });
        cookies.set(role, await login(`${id}@example.test`, password));
      }
    },
    async create(input = institutionInput()) {
      const response = await request('/api/v1/platform/institutions', 'POST', input);
      if (response.status !== 201) throw new Error('Synthetic institution creation failed.');
      const data = platformInstitutionSchema.parse(await response.json());
      schools.push(data.id);
      const [member] = await connection.db
        .select()
        .from(membership)
        .where(eq(membership.institutionId, data.id));
      if (!member) throw new Error('First Admin membership is missing.');
      admins.push(member.userId);
      return {
        data,
        input,
        adminId: member.userId,
        cookie: await login(input.firstAdmin.email, input.firstAdmin.password),
      };
    },
    async cleanup() {
      try {
        if (schools.length) {
          await connection.db
            .delete(platformInstitutionChange)
            .where(inArray(platformInstitutionChange.institutionId, schools));
          await connection.db
            .delete(membershipChange)
            .where(inArray(membershipChange.institutionId, schools));
          await connection.db
            .delete(institutionSubscription)
            .where(inArray(institutionSubscription.institutionId, schools));
          await connection.db
            .delete(institutionModuleGrant)
            .where(inArray(institutionModuleGrant.institutionId, schools));
          await connection.db.delete(membership).where(inArray(membership.institutionId, schools));
          await connection.db.delete(institution).where(inArray(institution.id, schools));
        }
        const ids = Object.values(operatorIds);
        await connection.db
          .delete(platformOperatorChange)
          .where(inArray(platformOperatorChange.actorUserId, ids));
        await connection.db.delete(platformOperator).where(inArray(platformOperator.userId, ids));
        await connection.db.delete(user).where(inArray(user.id, [...ids, ...admins]));
      } finally {
        await connection.close();
      }
    },
  };
}
