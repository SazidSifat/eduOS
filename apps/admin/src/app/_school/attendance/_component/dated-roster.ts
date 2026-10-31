import type { SchoolRegister, SchoolSnapshot } from '@eduos/contracts';

export function datedRoster(
  students: SchoolSnapshot['students'],
  classId: string,
  date?: string,
  register?: SchoolRegister,
) {
  return students.filter((student) => {
    if (student.classId !== classId) return false;
    // A submitted register defines its own historical roster, even if dates expand later.
    if (register?.submitted) return Object.hasOwn(register.marks, student.id);
    return (
      !date ||
      ((student.startsOn === null || student.startsOn <= date) &&
        (student.endsOn === null || student.endsOn >= date))
    );
  });
}

export function reconcileDraftRoster(
  register: SchoolRegister,
  students: SchoolSnapshot['students'],
) {
  if (register.submitted) return register;
  const eligible = datedRoster(students, register.classId, register.date);
  const unchanged =
    eligible.length === Object.keys(register.marks).length &&
    eligible.every((student) => Object.hasOwn(register.marks, student.id));
  return {
    ...register,
    saved: register.saved && unchanged,
    marks: Object.fromEntries(
      eligible.map((student) => [student.id, register.marks[student.id] ?? 'Unmarked']),
    ),
  };
}
