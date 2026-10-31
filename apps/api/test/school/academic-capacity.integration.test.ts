import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createSchoolFixture } from '../school-fixture.js';

const { f, snapshot, command, enabledSchool } = createSchoolFixture();
describe('academic section capacity', () => {
  beforeAll(() => f.setup());
  afterAll(() => f.cleanup());

  it('rejects capacity below enrollment and preserves the previous configuration', async () => {
    const school = await enabledSchool();
    await f.createCandidate(school, f.input(school, 'admitted'));
    await f.createCandidate(school, f.input(school, 'admitted'));
    const state = await snapshot(school);
    const offering = state.state.offerings.find((row) => row.id === school.offering.id);
    if (!offering) throw new Error('Synthetic offering missing');
    expect(
      (await command(school, { type: 'offering-save', offering: { ...offering, capacity: '1' } }))
        .status,
    ).toBe(409);
    const after = await snapshot(school);
    expect(after.revision).toBe(state.revision);
    expect(after.state.offerings.find((row) => row.id === offering.id)?.capacity).toBe(
      offering.capacity,
    );
    expect(
      (await command(school, { type: 'offering-save', offering: { ...offering, capacity: '2' } }))
        .status,
    ).toBe(200);
  });
});
