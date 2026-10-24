import { describe, expect, it, vi } from 'vitest';
import { HTTPException } from 'hono/http-exception';
import {
  accessSchema,
  platformAccessSchema,
  memberSchema,
  platformOperatorSchema,
  roleSchema,
  permissionSchema,
  platformRoleSchema,
  platformPermissionSchema,
  membersSchema,
} from '@eduos/contracts';
import { institutionRole, platformRole } from '@eduos/database/schema';
import {
  roleKeys,
  permissionKeys,
  platformRoleKeys,
  platformPermissionKeys,
  permissionsForRole,
  permissionsForPlatformRole,
  type Role,
  type PlatformRole,
} from '@eduos/permissions';
import { createApp } from './create-app.js';
import { parseEnv } from '../config/env.js';
import type { IdentityService } from '../modules/identity/service.js';
import type { PlatformService } from '../modules/platform/service.js';

const userId = '00000000-0000-4000-8000-000000000001';
const schoolId = '00000000-0000-4000-8000-000000000002';
const targetId = '00000000-0000-4000-8000-000000000003';
const env = parseEnv({
  DATABASE_URL: 'postgresql://test:test@localhost/eduos_test',
  REDIS_URL: 'redis://localhost',
  ADMIN_URL: 'http://localhost:5173',
  AUTH_BASE_URL: 'http://localhost:3001',
  AUTH_SECRET: 'a'.repeat(48),
  CORS_TRUSTED_ORIGINS: 'http://localhost:5173',
});
function fixture(
  schoolRole: Role | null = null,
  operatorRole: PlatformRole | null = null,
  authenticated = true,
) {
  const schoolContext = schoolRole
    ? {
        userId,
        institutionId: schoolId,
        role: schoolRole,
        permissions: new Set(permissionsForRole(schoolRole)),
      }
    : null;
  const operatorContext = operatorRole
    ? { userId, role: operatorRole, permissions: new Set(permissionsForPlatformRole(operatorRole)) }
    : null;
  const identity = {
    resolver: {
      resolve: vi.fn<IdentityService['resolver']['resolve']>(async (_actor, institutionId) =>
        institutionId === schoolId ? schoolContext : null,
      ),
    },
    listMemberships: vi.fn<IdentityService['listMemberships']>(async () => []),
    getWorkspace: vi.fn<IdentityService['getWorkspace']>(),
    getAccess: vi.fn<IdentityService['getAccess']>(async () => {
      if (!schoolContext) throw new HTTPException(403);
      return { ...schoolContext, permissions: [...schoolContext.permissions] };
    }),
    listMembers: vi.fn<IdentityService['listMembers']>(
      async (_actor, _institution, limit, offset) => ({
        items: [{ userId: targetId, role: 'teacher', active: true }],
        limit,
        offset,
      }),
    ),
    updateMembership: vi.fn<IdentityService['updateMembership']>(
      async (_actor, _institution, target, state) => ({ userId: target, ...state }),
    ),
  } satisfies IdentityService;
  const platform = {
    resolver: {
      resolve: vi.fn<PlatformService['resolver']['resolve']>(async () => operatorContext),
    },
    getAccess: vi.fn<PlatformService['getAccess']>(async () => {
      if (!operatorContext) throw new HTTPException(403);
      return { ...operatorContext, permissions: [...operatorContext.permissions] };
    }),
    listInstitutions: vi.fn<PlatformService['listInstitutions']>(async (_actor, limit, offset) => ({
      items: [],
      limit,
      offset,
    })),
    listOperators: vi.fn<PlatformService['listOperators']>(async (_actor, limit, offset) => ({
      items: [],
      limit,
      offset,
    })),
    updateOperator: vi.fn<PlatformService['updateOperator']>(async (_actor, target, state) => ({
      userId: target,
      ...state,
    })),
  } satisfies PlatformService;
  const app = createApp({
    env,
    identity,
    platform,
    auth: {
      api: {
        getSession: async () =>
          authenticated
            ? { user: { id: userId, name: 'Synthetic', email: 'synthetic@example.test' } }
            : null,
      },
      handler: async () => new Response(),
    },
    logger: { write: vi.fn() },
    checkDatabase: async () => {},
  });
  function put(path: string, body: unknown, origin = env.ADMIN_URL) {
    return app.request(path, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify(body),
    });
  }
  return { app, identity, platform, put };
}
const schoolPath = `/api/v1/institutions/${schoolId}`;
const memberPath = `${schoolPath}/memberships/${targetId}`;
const operatorPath = `/api/v1/platform/operators/${targetId}`;

describe('role definitions agree at the wire and persistence boundaries', () => {
  it('keeps institution enum/grant catalogs aligned', () => {
    expect(roleSchema.options).toEqual(roleKeys);
    expect(institutionRole.enumValues).toEqual(roleKeys);
    expect(permissionSchema.options).toEqual(permissionKeys);
  });
  it('keeps platform catalogs aligned and separate', () => {
    expect(platformRoleSchema.options).toEqual(platformRoleKeys);
    expect(platformRole.enumValues).toEqual(platformRoleKeys);
    expect(platformPermissionSchema.options).toEqual(platformPermissionKeys);
  });
});
describe('institution HTTP authorization', () => {
  it.each(roleKeys)('reports current %s access with no-store', async (role) => {
    const response = await fixture(role).app.request(`${schoolPath}/access`);
    expect(response.status).toBe(200);
    expect(accessSchema.parse(await response.json()).role).toBe(role);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it.each(['admin', 'principal'] as const)(
    'allows %s to change an existing membership',
    async (role) => {
      const { put, identity } = fixture(role);
      const response = await put(memberPath, { role: 'accountant', active: true });
      expect(response.status).toBe(200);
      expect(memberSchema.parse(await response.json()).role).toBe('accountant');
      expect(identity.updateMembership).toHaveBeenCalledWith(userId, schoolId, targetId, {
        role: 'accountant',
        active: true,
      });
    },
  );
  it.each(['teacher', 'admission_officer', 'accountant'] as const)(
    'denies %s role changes',
    async (role) => {
      const { put, identity } = fixture(role);
      expect((await put(memberPath, { role: 'admin', active: true })).status).toBe(403);
      expect(identity.updateMembership).not.toHaveBeenCalled();
    },
  );
  it('denies unassigned users and platform-only owners', async () => {
    const { app, identity } = fixture(null, 'platform_owner');
    expect((await app.request(`${schoolPath}/access`)).status).toBe(403);
    expect(identity.getAccess).not.toHaveBeenCalled();
  });
  it('denies a forged institution even for an Admin', async () => {
    const { app, identity } = fixture('admin');
    expect((await app.request(`/api/v1/institutions/${targetId}/access`)).status).toBe(403);
    expect(identity.getAccess).not.toHaveBeenCalled();
  });
  it.each([
    { role: 'platform_owner', active: true },
    { role: 'teacher' },
    { role: 'teacher', active: 'false' },
    { role: 'teacher', active: true, permissions: ['memberships.manage'] },
  ])('rejects invalid or privilege-injecting membership input %j', async (body) => {
    const { put, identity } = fixture('admin');
    expect((await put(memberPath, body)).status).toBe(400);
    expect(identity.updateMembership).not.toHaveBeenCalled();
  });
  it('allows explicit unassignment and revocation', async () => {
    const { put } = fixture('principal');
    expect((await put(memberPath, { role: null, active: false })).status).toBe(200);
  });
  it('bounds list input before reaching the service', async () => {
    const { app, identity } = fixture('admin');
    expect((await app.request(`${schoolPath}/memberships?limit=101`)).status).toBe(400);
    expect(identity.listMembers).not.toHaveBeenCalled();
    const response = await app.request(`${schoolPath}/memberships?limit=10&offset=2`);
    expect(response.status).toBe(200);
    expect(membersSchema.parse(await response.json())).toMatchObject({ limit: 10, offset: 2 });
  });
  it('rejects a membership revoked after middleware authorization', async () => {
    const { put, identity } = fixture('admin');
    identity.updateMembership.mockRejectedValueOnce(new HTTPException(403));
    expect((await put(memberPath, { role: 'teacher', active: true })).status).toBe(403);
  });
});
describe('platform HTTP authorization', () => {
  it.each(platformRoleKeys)('reports %s access', async (role) => {
    const response = await fixture(null, role).app.request('/api/v1/platform/access');
    expect(response.status).toBe(200);
    expect(platformAccessSchema.parse(await response.json()).role).toBe(role);
  });
  it.each(roleKeys)('denies institution %s platform access', async (role) => {
    const { app, platform } = fixture(role);
    expect((await app.request('/api/v1/platform/access')).status).toBe(403);
    expect(platform.getAccess).not.toHaveBeenCalled();
  });
  it('allows an Owner to assign a platform role', async () => {
    const { put, platform } = fixture(null, 'platform_owner');
    const response = await put(operatorPath, { role: 'platform_manager', active: true });
    expect(response.status).toBe(200);
    expect(platformOperatorSchema.parse(await response.json()).role).toBe('platform_manager');
    expect(platform.updateOperator).toHaveBeenCalledWith(userId, targetId, {
      role: 'platform_manager',
      active: true,
    });
  });
  it('allows a Manager institution metadata but denies staff changes and listing', async () => {
    const { app, put, platform } = fixture(null, 'platform_manager');
    expect((await app.request('/api/v1/platform/institutions')).status).toBe(200);
    expect((await app.request('/api/v1/platform/operators')).status).toBe(403);
    expect((await put(operatorPath, { role: 'platform_owner', active: true })).status).toBe(403);
    expect(platform.updateOperator).not.toHaveBeenCalled();
    expect(platform.listOperators).not.toHaveBeenCalled();
  });
  it('rejects institution roles at the platform boundary', async () => {
    const { put, platform } = fixture(null, 'platform_owner');
    expect((await put(operatorPath, { role: 'admin', active: true })).status).toBe(400);
    expect(platform.updateOperator).not.toHaveBeenCalled();
  });
});
describe('protected mutation behavior', () => {
  it('rejects anonymous requests in both scopes', async () => {
    const { put } = fixture(null, null, false);
    expect((await put(memberPath, { role: 'admin', active: true })).status).toBe(401);
    expect((await put(operatorPath, { role: 'platform_owner', active: true })).status).toBe(401);
  });
  it('rejects missing and forged origins', async () => {
    const { put, app, identity } = fixture('admin');
    expect(
      (await put(memberPath, { role: 'teacher', active: true }, 'https://evil.example')).status,
    ).toBe(403);
    expect((await app.request(memberPath, { method: 'PUT' })).status).toBe(403);
    expect(identity.updateMembership).not.toHaveBeenCalled();
  });
  it('rejects malformed JSON and oversized bodies', async () => {
    const { app, identity } = fixture('admin');
    for (const [body, status] of [
      ['{', 400],
      ['x'.repeat(17000), 413],
    ] as const) {
      expect(
        (
          await app.request(memberPath, {
            method: 'PUT',
            headers: {
              origin: env.ADMIN_URL,
              'content-type': 'application/json',
            },
            body,
          })
        ).status,
      ).toBe(status);
    }
    expect(identity.updateMembership).not.toHaveBeenCalled();
  });
  it('maps last-administrator conflicts consistently', async () => {
    const { put, identity } = fixture('admin');
    identity.updateMembership.mockRejectedValueOnce(new HTTPException(409));
    const response = await put(memberPath, { role: 'teacher', active: true });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: 'CONFLICT', requestId: response.headers.get('x-request-id') },
    });
  });
  it('documents both scopes and mutation conflicts in OpenAPI', async () => {
    const response = await fixture().app.request('/api/openapi.json');
    expect(await response.json()).toMatchObject({
      paths: {
        '/api/v1/platform/operators/{userId}': {
          put: { responses: { 400: {}, 401: {}, 403: {}, 409: {}, 413: {} } },
        },
        '/api/v1/institutions/{institutionId}/memberships/{userId}': {
          put: { responses: { 409: {} } },
        },
      },
    });
  });
});
