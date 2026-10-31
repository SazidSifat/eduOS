import type { Routine, RoutinePeriod } from '../../_component/demo-model';
export function unassignedSlots(routine: Routine) {
  return routine.days.flatMap((day) =>
    routine.periods
      .filter((period) => !routine.lessons.some((l) => l.day === day && l.period === period.id))
      .map((period) => ({ day, period: period.id })),
  );
}
export function validPeriods(items: RoutinePeriod[]) {
  return (
    items.length > 0 &&
    new Set(items.map((p) => p.id)).size === items.length &&
    items.every(
      (p, i) =>
        /^([01]\d|2[0-3]):[0-5]\d$/.test(p.start) &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(p.end) &&
        p.start < p.end &&
        (i === 0 || (items[i - 1]?.end ?? '') <= p.start),
    )
  );
}
