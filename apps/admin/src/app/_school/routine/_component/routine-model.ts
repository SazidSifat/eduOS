import type { Lesson, Routine, RoutinePeriod } from '../../_component/demo-model';

export const teachingDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
export const periods: RoutinePeriod[] = [
  { id: '1', start: '08:00', end: '08:40' },
  { id: '2', start: '08:40', end: '09:20' },
  { id: '3', start: '09:20', end: '10:00' },
  { id: '4', start: '10:20', end: '11:00' },
  { id: '5', start: '11:00', end: '11:40' },
  { id: '6', start: '11:40', end: '12:20' },
];
export const subjects = [
  { name: 'Bangla', teacher: 'Sharmin Begum' },
  { name: 'English', teacher: 'Sadia Karim' },
  { name: 'Mathematics', teacher: 'Farhana Akter' },
  { name: 'Science', teacher: 'Imran Hossain' },
  { name: 'Religion', teacher: 'Nazma Sultana' },
  { name: 'ICT', teacher: 'Rezaul Karim' },
];
export function initialRoutine(): Routine {
  const lessons: Lesson[] = [];
  for (const [d, day] of teachingDays.entries())
    for (const [p, period] of periods.entries()) {
      if (day === 'Monday' && ['4', '5'].includes(period.id)) continue;
      const subject = subjects[(p + d) % subjects.length];
      if (subject)
        lessons.push({
          id: `${day}-${period.id}`,
          day,
          period: period.id,
          subject: subject.name,
          teacher: subject.teacher,
          room: day === 'Thursday' && period.id === '6' ? 'Science room' : 'Classroom 3-A',
        });
    }
  return {
    lessons,
    days: [...teachingDays],
    periods: periods.map((p) => ({ ...p })),
    className: 'Class 3 · A',
    effective: '2026-11-01',
    published: false,
    version: 2,
    note: '',
  };
}
export interface RoutineConflict {
  lessonId: string;
  kind: 'teacher' | 'room';
  title: string;
  detail: string;
}
export function routineConflicts(routine: Routine): RoutineConflict[] {
  return routine.lessons.flatMap((lesson) => {
    const issues: RoutineConflict[] = [];
    if (lesson.day === 'Monday' && lesson.period === '4' && lesson.teacher === 'Farhana Akter')
      issues.push({
        lessonId: lesson.id,
        kind: 'teacher',
        title: 'Teacher conflict · Farhana Akter',
        detail:
          'Monday Period 4 overlaps Mathematics in Class 4 B. Move this lesson to the available Period 5.',
      });
    if (lesson.day === 'Thursday' && lesson.period === '6' && lesson.room === 'Science room')
      issues.push({
        lessonId: lesson.id,
        kind: 'room',
        title: 'Room conflict · Science room',
        detail: 'Thursday Period 6 is already booked by Class 5 B. Classroom 3-A is available.',
      });
    return issues;
  });
}
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
export function resolveRoutine(routine: Routine): Routine {
  let lessons = routine.lessons.map((l) =>
    l.day === 'Thursday' && l.period === '6' && l.room === 'Science room'
      ? { ...l, room: 'Classroom 3-A' }
      : l,
  );
  if (!lessons.some((l) => l.day === 'Monday' && l.period === '5'))
    lessons = lessons.map((l) =>
      l.day === 'Monday' && l.period === '4' && l.teacher === 'Farhana Akter'
        ? { ...l, id: 'Monday-5', period: '5' }
        : l,
    );
  for (const slot of unassignedSlots({ ...routine, lessons })) {
    const subject =
      slot.day === 'Monday' && slot.period === '4'
        ? subjects.find((s) => s.name === 'English')
        : subjects.find((s) => s.name === 'Mathematics');
    if (subject)
      lessons.push({
        id: `${slot.day}-${slot.period}`,
        ...slot,
        subject: subject.name,
        teacher: subject.teacher,
        room: 'Classroom 3-A',
      });
  }
  return { ...routine, lessons, published: false };
}
