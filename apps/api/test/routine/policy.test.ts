import { describe, expect, it } from 'vitest';
import type { SchoolRoutine } from '@eduos/contracts';
import {
  emptyRoutine,
  validRoutinePeriods,
  missingRoutineSlots,
  conflictsWithRoutine,
} from '../../src/services/routine/policy.js';
function routine(className = 'Class 3 · A'): SchoolRoutine {
  return {
    ...emptyRoutine(),
    className,
    days: ['Sunday'],
    effective: '2027-01-01',
    published: true,
    version: 1,
    periods: [{ id: '1', start: '08:00', end: '08:40' }],
    lessons: [
      {
        id: 'Sunday-1',
        day: 'Sunday',
        period: '1',
        subject: 'Bangla',
        teacher: 'teacher-a',
        room: 'Room 1',
      },
    ],
  };
}
describe('actual routine publication policy', () => {
  it('requires configured, ordered, non-overlapping periods and filled slots', () => {
    expect(validRoutinePeriods(emptyRoutine())).toBe(false);
    const r = routine();
    expect(validRoutinePeriods(r)).toBe(true);
    expect(missingRoutineSlots({ ...r, lessons: [] })).toHaveLength(1);
    expect(
      validRoutinePeriods({
        ...r,
        periods: [...r.periods, { id: '2', start: '08:30', end: '09:00' }],
      }),
    ).toBe(false);
  });
  it('detects teacher overlap by actual time even when period IDs differ', () => {
    const r = routine();
    const other = {
      ...routine('Class 4 · A'),
      periods: [{ id: 'different', start: '08:20', end: '09:00' }],
      lessons: [
        {
          ...r.lessons[0],
          id: 'Sunday-other',
          day: 'Sunday',
          period: 'different',
          subject: 'Bangla',
          teacher: 'teacher-a',
          room: 'Room 2',
        },
      ],
    };
    expect(conflictsWithRoutine(r, [other]).map((c) => c.kind)).toEqual(['teacher']);
    expect(
      conflictsWithRoutine(r, [
        { ...other, periods: [{ id: 'different', start: '08:40', end: '09:20' }] },
      ]),
    ).toEqual([]);
  });
  it('checks shared rooms independently from teacher assignments', () => {
    const r = routine();
    const other = routine('Class 4 · A');
    other.lessons = other.lessons.map((l) => ({ ...l, teacher: 'teacher-b' }));
    expect(conflictsWithRoutine(r, [other]).map((c) => c.kind)).toEqual(['room']);
  });
  it('ignores superseded historical allocations while checking future published versions', () => {
    const target = { ...routine(), effective: '2027-04-01' };
    const old = routine('Class 4 · A');
    const replacement = {
      ...old,
      effective: '2027-03-01',
      version: 2,
      lessons: old.lessons.map((l) => ({ ...l, teacher: 'teacher-b', room: 'Room 2' })),
    };
    expect(conflictsWithRoutine(target, [old, replacement])).toEqual([]);
    expect(conflictsWithRoutine(target, [{ ...old, effective: '2027-05-01' }])).toHaveLength(1);
  });
});
