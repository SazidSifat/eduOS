import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { schoolSnapshotSchema, type SchoolAction } from '@eduos/contracts';
import { createAdmissionsFixture } from './admissions-fixture.js';
export function createSchoolFixture(options: Parameters<typeof createAdmissionsFixture>[0] = {}) {
  const f = createAdmissionsFixture(options);
  type School = Awaited<ReturnType<typeof f.createSchool>>;
  const base = (s: School) => `/api/v1/institutions/${s.data.id}/school`;
  async function snapshot(s: School, cookie = s.cookie) {
    const r = await f.request(base(s), 'GET', undefined, cookie);
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('no-store');
    return schoolSnapshotSchema.parse(await r.json());
  }
  async function command(
    s: School,
    action: SchoolAction,
    cookie = s.cookie,
    revision?: number,
    key = randomUUID(),
  ) {
    const value = revision ?? (await snapshot(s, cookie)).revision;
    return f.request(
      `${base(s)}/commands`,
      'POST',
      { operationKey: key, revision: value, action },
      cookie,
    );
  }
  async function enabledSchool() {
    const s = await f.createSchool();
    const r = await f.request(`/api/v1/platform/institutions/${s.data.id}/modules`, 'PUT', {
      enabledModules: ['academics', 'admissions', 'attendance', 'fees'],
    });
    expect(r.status).toBe(200);
    return s;
  }
  async function assignTeacher(s: School) {
    const t = await f.addStaff(s.data.id, 'teacher');
    const state = await snapshot(s);
    const offering = state.state.offerings.find((o) => o.id === s.offering.id);
    if (!offering) throw new Error('Synthetic offering missing');
    expect(
      (await command(s, { type: 'offering-save', offering: { ...offering, teacher: t.id } }))
        .status,
    ).toBe(200);
    return t;
  }
  return { f, base, snapshot, command, enabledSchool, assignTeacher };
}
