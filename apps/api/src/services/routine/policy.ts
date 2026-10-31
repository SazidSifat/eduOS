import type { SchoolRoutine } from '@eduos/contracts';
export const emptyRoutine = (): SchoolRoutine => ({
  lessons: [],
  days: [],
  periods: [],
  className: '',
  effective: '',
  published: false,
  version: 0,
  note: '',
});
export function validRoutinePeriods(r: SchoolRoutine) {
  return (
    r.days.length > 0 &&
    new Set(r.days).size === r.days.length &&
    r.periods.length > 0 &&
    new Set(r.periods.map((p) => p.id)).size === r.periods.length &&
    r.periods.every((p, i) => p.start < p.end && (!i || (r.periods[i - 1]?.end ?? '') <= p.start))
  );
}
export function missingRoutineSlots(r: SchoolRoutine) {
  return r.days.flatMap((day) =>
    r.periods.filter((p) => !r.lessons.some((l) => l.day === day && l.period === p.id)),
  );
}
export function conflictsWithRoutine(r: SchoolRoutine, others: SchoolRoutine[]) {
  const groups = new Map<string, SchoolRoutine[]>();
  for (const other of others.filter(
    (o) => o.published && (!r.session || !o.session || r.session === o.session),
  )) {
    const key = other.classId ?? other.className;
    groups.set(key, [...(groups.get(key) ?? []), other]);
  }
  const relevant = [...groups.values()].flatMap((versions) => {
    const sorted = versions.toSorted(
      (a, b) => b.effective.localeCompare(a.effective) || b.version - a.version,
    );
    const active = sorted.find((o) => o.effective <= r.effective);
    return [...(active ? [active] : []), ...sorted.filter((o) => o.effective > r.effective)];
  });
  return r.lessons.flatMap((l) => {
    const period = r.periods.find((p) => p.id === l.period);
    if (!period) return [];
    return relevant.flatMap((other) =>
      other.lessons
        .filter((o) => {
          const t = other.periods.find((p) => p.id === o.period);
          return (
            t &&
            o.day === l.day &&
            t.start < period.end &&
            t.end > period.start &&
            (l.teacher === o.teacher || l.room === o.room)
          );
        })
        .map((o) => ({
          lessonId: l.id,
          kind: l.teacher === o.teacher ? 'teacher' : 'room',
          title:
            l.teacher === o.teacher ? 'Teacher is already assigned' : 'Room is already assigned',
          detail: `${l.day} ${period.start}–${period.end} overlaps ${other.className}.`,
        })),
    );
  });
}
