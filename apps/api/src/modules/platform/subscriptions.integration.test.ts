import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { and, eq } from '@eduos/database';
import { institution, platformInstitutionChange } from '@eduos/database/schema';
import {
  platformInstitutionSubscriptionSchema,
  platformSubscriptionsSchema,
} from '@eduos/contracts';
import { createPlatformFixture } from '../../../test/platform-fixture.js';

const fixture = createPlatformFixture();
beforeAll(() => fixture.setup());
afterAll(() => fixture.cleanup());

describe('platform subscription management', () => {
  it('creates and replaces manual plan terms with atomic audit rows and idempotent repeats', async () => {
    const school = await fixture.create();
    const path = `/api/v1/platform/institutions/${school.data.id}/subscription`;
    const initial = await fixture.request(path);
    expect(initial.status).toBe(200);
    expect(await initial.json()).toBeNull();
    const terms = {
      planName: 'Synthetic agreed plan',
      status: 'active',
      billingCycle: 'annual',
      amountTaka: 24000,
      periodEndsAt: '2027-12-31',
    };
    const response = await fixture.request(path, 'PUT', terms);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const saved = platformInstitutionSubscriptionSchema.parse(await response.json());
    expect(saved).toMatchObject({ ...terms, institutionId: school.data.id });
    const list = await fixture.request('/api/v1/platform/subscriptions?limit=100&offset=0');
    expect(list.status).toBe(200);
    expect(platformSubscriptionsSchema.parse(await list.json()).items).toContainEqual(
      expect.objectContaining({
        institution: expect.objectContaining({ id: school.data.id }),
        subscription: expect.objectContaining({ planName: terms.planName, status: 'active' }),
      }),
    );
    const repeat = await fixture.request(path, 'PUT', terms);
    expect(repeat.status).toBe(200);
    expect(platformInstitutionSubscriptionSchema.parse(await repeat.json()).updatedAt).toBe(
      saved.updatedAt,
    );
    let events = await fixture.db
      .select()
      .from(platformInstitutionChange)
      .where(
        and(
          eq(platformInstitutionChange.institutionId, school.data.id),
          eq(platformInstitutionChange.changeType, 'subscription'),
        ),
      );
    expect(events).toHaveLength(1);
    expect(events[0]?.actorUserId).toBe(fixture.operatorIds.owner);
    expect((await fixture.request(path, 'PUT', { ...terms, status: 'cancelled' })).status).toBe(
      200,
    );
    events = await fixture.db
      .select()
      .from(platformInstitutionChange)
      .where(
        and(
          eq(platformInstitutionChange.institutionId, school.data.id),
          eq(platformInstitutionChange.changeType, 'subscription'),
        ),
      );
    expect(events).toHaveLength(2);
    const [record] = await fixture.db
      .select()
      .from(institution)
      .where(eq(institution.id, school.data.id));
    expect(record?.status).toBe('active');
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
  });

  it('rejects invalid billing terms, managers, school Admins and unknown institutions', async () => {
    const school = await fixture.create();
    const path = `/api/v1/platform/institutions/${school.data.id}/subscription`;
    const terms = {
      planName: 'Synthetic agreed plan',
      status: 'trial',
      billingCycle: 'monthly',
      amountTaka: 0,
      periodEndsAt: null,
    };
    expect((await fixture.request(path, 'PUT', { ...terms, amountTaka: -1 })).status).toBe(400);
    expect(
      (await fixture.request(path, 'PUT', { ...terms, periodEndsAt: '2027-02-30' })).status,
    ).toBe(400);
    expect(
      (await fixture.request(path, 'PUT', { ...terms, institutionId: crypto.randomUUID() })).status,
    ).toBe(400);
    const manager = fixture.cookies.get('manager') ?? '';
    expect((await fixture.request(path, 'PUT', terms, manager)).status).toBe(403);
    expect(
      (await fixture.request('/api/v1/platform/subscriptions', 'GET', undefined, manager)).status,
    ).toBe(403);
    expect((await fixture.request(path, 'PUT', terms, school.cookie)).status).toBe(403);
    expect((await fixture.request(path, 'GET', undefined, '')).status).toBe(401);
    expect(
      (
        await fixture.request(
          `/api/v1/platform/institutions/${crypto.randomUUID()}/subscription`,
          'PUT',
          terms,
        )
      ).status,
    ).toBe(404);
    expect(
      await fixture.platform.getSubscription(fixture.operatorIds.owner, school.data.id),
    ).toBeNull();
  });
});
