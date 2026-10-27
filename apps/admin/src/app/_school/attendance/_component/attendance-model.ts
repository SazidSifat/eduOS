import type { AttendanceMark, DemoState, Register } from '../../_component/demo-model';
export const markOptions: AttendanceMark[] = ['Present', 'Absent', 'Late'];
export function markCounts(register: Register) {
  const counts: Record<AttendanceMark, number> = { Present: 0, Absent: 0, Late: 0, Unmarked: 0 };
  for (const mark of Object.values(register.marks)) counts[mark]++;
  return counts;
}
export function currentRegister(state: DemoState) {
  return state.registers.find((r) => r.id === state.selectedRegister);
}
