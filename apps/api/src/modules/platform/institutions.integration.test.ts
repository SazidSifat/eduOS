import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { and, eq } from '@eduos/database';
import {
  account,
  institution,
  membership,
  platformInstitutionChange,
  platformOperator,
  user,
} from '@eduos/database/schema';
import { accessSchema, platformInstitutionSchema, workspaceSchema } from '@eduos/contracts';
import { requireSession, requireTenantModule, type ApiVariables } from '../../middleware/auth.js';
import { createPlatformFixture, institutionInput } from '../../../test/platform-fixture.js';

const fixture = createPlatformFixture();
beforeAll(() => fixture.setup());
afterAll(() => fixture.cleanup());
const path = (id: string) => `/api/v1/platform/institutions/${id}`;

describe('platform institution provisioning', () => {
  it('atomically creates the institution and first Admin with every module initially off', async () => {
    const input = institutionInput();
    input.type = 'coaching_center';
    const school = await fixture.create(input);
    expect(school.data.code).toMatch(/^[1-9]\d{5}$/);
    expect(school.data.type).toBe('coaching_center');
    expect(school.data.enabledModules).toEqual([]);
    expect(JSON.stringify(school.data)).not.toContain(input.firstAdmin.password);
    const [member] = await fixture.db
      .select()
      .from(membership)
      .where(eq(membership.userId, school.adminId));
    expect(member).toMatchObject({ institutionId: school.data.id, role: 'admin', active: true });
    const [credential] = await fixture.db
      .select()
      .from(account)
      .where(eq(account.userId, school.adminId));
    expect(credential?.password).toBeTruthy();
    expect(credential?.password).not.toBe(input.firstAdmin.password);
    expect(
      await fixture.db
        .select()
        .from(platformOperator)
        .where(eq(platformOperator.userId, school.adminId)),
    ).toHaveLength(0);
    const access = await fixture.request(
      `/api/v1/institutions/${school.data.id}/access`,
      'GET',
      undefined,
      school.cookie,
    );
    expect(access.status).toBe(200);
    expect(accessSchema.parse(await access.json())).toMatchObject({
      role: 'admin',
      modules: [],
    });
    const workspace = await fixture.request(
      `/api/v1/institutions/${school.data.id}/workspace`,
      'GET',
      undefined,
      school.cookie,
    );
    expect(workspaceSchema.parse(await workspace.json()).code).toBe(school.data.code);
    const directory = await fixture.request(
      `/api/v1/platform/institutions?code=${school.data.code}`,
    );
    expect(directory.status).toBe(200);
    expect(await directory.json()).toMatchObject({
      items: [{ id: school.data.id, code: school.data.code }],
    });
    expect((await fixture.request('/api/v1/platform/institutions?code=12345')).status).toBe(400);
    expect((await fixture.request(`/api/v1/institutions/${school.data.id}/workspace`)).status).toBe(
      403,
    );
    expect(
      (await fixture.request('/api/v1/platform/access', 'GET', undefined, school.cookie)).status,
    ).toBe(403);
    const events = await fixture.db
      .select()
      .from(platformInstitutionChange)
      .where(eq(platformInstitutionChange.institutionId, school.data.id));
    expect(events).toHaveLength(1);
    expect(events[0]?.value).toMatchObject({
      code: school.data.code,
      firstAdminUserId: school.adminId,
    });
  });

  it('rejects existing Admin emails and duplicate slugs without partial institutions or accounts', async () => {
    const original = await fixture.create();
    const duplicateEmail = institutionInput();
    duplicateEmail.firstAdmin.email = original.input.firstAdmin.email;
    const rejected = await fixture.request('/api/v1/platform/institutions', 'POST', duplicateEmail);
    expect(rejected.status).toBe(409);
    expect(await rejected.json()).toMatchObject({ error: { code: 'ADMIN_EMAIL_TAKEN' } });
    expect(
      await fixture.db.select().from(institution).where(eq(institution.slug, duplicateEmail.slug)),
    ).toHaveLength(0);
    const duplicateSlug = institutionInput();
    duplicateSlug.slug = original.data.slug;
    const slugResponse = await fixture.request(
      '/api/v1/platform/institutions',
      'POST',
      duplicateSlug,
    );
    expect(slugResponse.status).toBe(409);
    expect(await slugResponse.json()).toMatchObject({ error: { code: 'INSTITUTION_SLUG_TAKEN' } });
    expect(
      await fixture.db.select().from(user).where(eq(user.email, duplicateSlug.firstAdmin.email)),
    ).toHaveLength(0);
    expect(
      await fixture.db.select().from(membership).where(eq(membership.userId, original.adminId)),
    ).toHaveLength(1);
  });

  it('denies managers and anonymous callers and rejects privilege injection', async () => {
    const input = institutionInput();
    expect(
      (
        await fixture.request(
          '/api/v1/platform/institutions',
          'POST',
          input,
          fixture.cookies.get('manager') ?? '',
        )
      ).status,
    ).toBe(403);
    expect((await fixture.request('/api/v1/platform/institutions', 'POST', input, '')).status).toBe(
      401,
    );
    expect(
      (
        await fixture.request('/api/v1/platform/institutions', 'POST', {
          ...input,
          role: 'platform_owner',
        })
      ).status,
    ).toBe(400);
    expect(
      (await fixture.request('/api/v1/platform/institutions', 'POST', { ...input, code: '123456' }))
        .status,
    ).toBe(400);
    expect(
      (
        await fixture.request('/api/v1/platform/institutions', 'POST', {
          ...input,
          enabledModules: ['attendance'],
        })
      ).status,
    ).toBe(400);
    expect(
      await fixture.db.select().from(institution).where(eq(institution.slug, input.slug)),
    ).toHaveLength(0);
  });
});

describe('institution access and modules', () => {
  it('blocks frozen/deactivated schools on the next request and restores access on reactivation', async () => {
    const school = await fixture.create();
    const other = await fixture.create();
    const update = (status: string) =>
      fixture.request(`${path(school.data.id)}/status`, 'PUT', {
        status,
        reason: 'Synthetic access review',
      });
    expect(
      (await fixture.request(`${path(school.data.id)}/status`, 'PUT', { status: 'frozen' })).status,
    ).toBe(400);
    expect((await update('frozen')).status).toBe(200);
    expect(await fixture.identity.resolver.resolve(school.adminId, school.data.id)).toBeNull();
    expect(
      (
        await fixture.request(
          `/api/v1/institutions/${school.data.id}/workspace`,
          'GET',
          undefined,
          school.cookie,
        )
      ).status,
    ).toBe(403);
    expect(
      (await fixture.request('/api/v1/memberships', 'GET', undefined, school.cookie)).status,
    ).toBe(200);
    expect(await fixture.identity.listMemberships(school.adminId)).toHaveLength(0);
    await expect(
      fixture.identity.listMembers(school.adminId, school.data.id, 50, 0),
    ).rejects.toMatchObject({ status: 403 });
    expect(await fixture.identity.resolver.resolve(other.adminId, other.data.id)).not.toBeNull();
    const firstEvents = await fixture.db
      .select()
      .from(platformInstitutionChange)
      .where(
        and(
          eq(platformInstitutionChange.institutionId, school.data.id),
          eq(platformInstitutionChange.changeType, 'status'),
        ),
      );
    expect((await update('frozen')).status).toBe(200);
    const repeatedEvents = await fixture.db
      .select()
      .from(platformInstitutionChange)
      .where(
        and(
          eq(platformInstitutionChange.institutionId, school.data.id),
          eq(platformInstitutionChange.changeType, 'status'),
        ),
      );
    expect(repeatedEvents).toHaveLength(firstEvents.length);
    expect(
      (await fixture.request(`${path(school.data.id)}/status`, 'PUT', { status: 'active' })).status,
    ).toBe(200);
    expect(
      (
        await fixture.request(
          `/api/v1/institutions/${school.data.id}/workspace`,
          'GET',
          undefined,
          school.cookie,
        )
      ).status,
    ).toBe(200);
    expect((await update('inactive')).status).toBe(200);
    expect(
      (
        await fixture.request(
          `/api/v1/institutions/${school.data.id}/access`,
          'GET',
          undefined,
          school.cookie,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await fixture.request(
          `${path(school.data.id)}/status`,
          'PUT',
          { status: 'active' },
          fixture.cookies.get('manager') ?? '',
        )
      ).status,
    ).toBe(403);
  });

  it('enforces module switches without adding role grants or school access to platform operators', async () => {
    const school = await fixture.create();
    const moduleApp = new Hono<{ Variables: ApiVariables }>();
    moduleApp.get(
      '/institutions/:institutionId/attendance',
      requireSession(fixture.auth),
      requireTenantModule(fixture.identity.resolver, 'workspace.read', 'attendance'),
      (c) => c.json({ allowed: true }),
    );
    const moduleRequest = () =>
      moduleApp.request(`/institutions/${school.data.id}/attendance`, {
        headers: { cookie: school.cookie },
      });
    expect((await moduleRequest()).status).toBe(403);
    const enabled = await fixture.request(`${path(school.data.id)}/modules`, 'PUT', {
      enabledModules: ['attendance', 'fees'],
    });
    expect(enabled.status).toBe(200);
    expect((await moduleRequest()).status).toBe(200);
    const response = await fixture.request(`${path(school.data.id)}/modules`, 'PUT', {
      enabledModules: ['fees'],
    });
    expect(response.status).toBe(200);
    const updated = platformInstitutionSchema.parse(await response.json());
    expect(updated.enabledModules).toEqual(['fees']);
    expect(updated.code).toBe(school.data.code);
    expect((await moduleRequest()).status).toBe(403);
    const workspace = await fixture.request(
      `/api/v1/institutions/${school.data.id}/workspace`,
      'GET',
      undefined,
      school.cookie,
    );
    expect(workspace.status).toBe(200);
    expect(workspaceSchema.parse(await workspace.json()).modules).toEqual(['fees']);
    expect(
      (
        await fixture.request(`${path(school.data.id)}/modules`, 'PUT', {
          enabledModules: ['unknown'],
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await fixture.request(
          `${path(school.data.id)}/modules`,
          'PUT',
          { enabledModules: [] },
          fixture.cookies.get('manager') ?? '',
        )
      ).status,
    ).toBe(403);
    await fixture.db
      .update(platformOperator)
      .set({ active: false })
      .where(eq(platformOperator.userId, fixture.operatorIds.owner));
    try {
      await expect(
        fixture.platform.updateInstitutionModules(fixture.operatorIds.owner, school.data.id, {
          enabledModules: [],
        }),
      ).rejects.toMatchObject({ status: 403 });
    } finally {
      await fixture.db
        .update(platformOperator)
        .set({ active: true })
        .where(eq(platformOperator.userId, fixture.operatorIds.owner));
    }
  });
});
