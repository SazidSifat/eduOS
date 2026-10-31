import { describe, expect, it } from 'vitest';
import type { SchoolSnapshot, SchoolRegister } from '@eduos/contracts';
import { datedRoster, reconcileDraftRoster } from './dated-roster';

const students: SchoolSnapshot['students'] = [
  {
    id: 'legacy',
    enrollmentId: 'e1',
    name: 'Synthetic Legacy',
    roll: '01',
    classId: 'class-a',
    startsOn: null,
    endsOn: null,
  },
  {
    id: 'dated',
    enrollmentId: 'e2',
    name: 'Synthetic Dated',
    roll: '02',
    classId: 'class-a',
    startsOn: '2026-01-10',
    endsOn: '2026-01-20',
  },
  {
    id: 'other',
    enrollmentId: 'e3',
    name: 'Synthetic Other',
    roll: '01',
    classId: 'class-b',
    startsOn: null,
    endsOn: null,
  },
];
describe('dated attendance roster', () => {
  it('retains eligible draft marks but requires saving a changed roster again', () => {
    const draft: SchoolRegister = {
      id: 'register',
      classId: 'class-a',
      date: '2026-01-15',
      marks: { legacy: 'Present' },
      submitted: false,
      saved: true,
    };
    expect(reconcileDraftRoster(draft, students)).toMatchObject({
      saved: false,
      marks: { legacy: 'Present', dated: 'Unmarked' },
    });
    expect(reconcileDraftRoster({ ...draft, submitted: true }, students)).toEqual({
      ...draft,
      submitted: true,
    });
  });
  it('preserves unknown dates and includes both known boundaries', () => {
    expect(datedRoster(students, 'class-a', '2026-01-09').map((s) => s.id)).toEqual(['legacy']);
    expect(datedRoster(students, 'class-a', '2026-01-10')).toHaveLength(2);
    expect(datedRoster(students, 'class-a', '2026-01-20')).toHaveLength(2);
    expect(datedRoster(students, 'class-a', '2026-01-21').map((s) => s.id)).toEqual(['legacy']);
  });
  it('uses submitted identities even after the enrollment date range expands', () => {
    const register: SchoolRegister = {
      id: 'register',
      classId: 'class-a',
      date: '2026-01-15',
      marks: { legacy: 'Present' },
      submitted: true,
      saved: true,
    };
    expect(datedRoster(students, 'class-a', register.date, register).map((s) => s.id)).toEqual([
      'legacy',
    ]);
    expect(
      datedRoster(students, 'class-a', register.date, { ...register, submitted: false }),
    ).toHaveLength(2);
  });
});
