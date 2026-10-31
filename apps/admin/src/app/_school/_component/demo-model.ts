import type {
  SchoolState,
  SchoolCandidate,
  SchoolFee,
  SchoolRoutine,
  SchoolRegister,
} from '@eduos/contracts';
export type DemoState = Omit<SchoolState, 'corrections'> & { corrections: Correction[] };
export type Candidate = SchoolCandidate;
export type FeeItem = SchoolFee;
export type CandidateState = Candidate['state'];
export type CallRecord = Candidate['calls'][number];
export type Charge = DemoState['charges'][number];
export type Payment = DemoState['payments'][number];
export type Schedule = DemoState['schedules'][number];
export type Expense = DemoState['expenses'][number];
export type AttendanceMark = 'Present' | 'Absent' | 'Late' | 'Unmarked';
export interface RosterStudent {
  id: string;
  name: string;
  roll: string;
}
export type Register = SchoolRegister;
export type Correction = Omit<SchoolState['corrections'][number], 'proposed'> & {
  proposed: AttendanceMark;
};
export type Lesson = SchoolRoutine['lessons'][number];
export type RoutinePeriod = SchoolRoutine['periods'][number];
export type Routine = SchoolRoutine;
export type Member = DemoState['members'][number];
export type Offering = DemoState['offerings'][number];
export type DemoAction =
  | {
      type: 'candidate-save';
      candidate: Candidate;
      admission?: { fees: FeeItem[]; cashConfirmed: boolean };
      collectWillingFee?: boolean;
    }
  | { type: 'call'; candidateId: string; outcome: string; note: string; nextCall: string }
  | {
      type: 'candidate-state';
      candidateId: string;
      state: CandidateState;
      nextCall: string;
      note?: string;
    }
  | { type: 'admit'; candidateId: string; fees: FeeItem[]; cashConfirmed: boolean }
  | { type: 'willing-payment'; candidateId: string; amount: number }
  | {
      type: 'collect';
      candidateId: string;
      allocations: { chargeId: string; amount: number }[];
      date: string;
    }
  | { type: 'reverse'; paymentId: string; reason: string }
  | { type: 'schedule-stop'; id: string }
  | { type: 'expense-save'; expense: Expense }
  | { type: 'expense-review'; id: string; approved: boolean; note: string }
  | { type: 'expense-pay'; id: string }
  | { type: 'register-select'; classId: string; date: string }
  | { type: 'attendance-mark'; studentId: string; mark: AttendanceMark }
  | { type: 'attendance-bulk' }
  | { type: 'attendance-save' }
  | { type: 'attendance-submit' }
  | { type: 'correction-request'; correction: Correction }
  | { type: 'correction-review'; id: string; approved: boolean }
  | {
      type: 'routine-configure';
      classId?: string;
      days: string[];
      effective: string;
      periods: RoutinePeriod[];
      className: string;
    }
  | { type: 'lesson-save'; lesson: Lesson }
  | { type: 'routine-resolve' }
  | { type: 'routine-publish'; note: string }
  | { type: 'settings-save'; values: Record<string, string> }
  | { type: 'member-update'; id: string; role: Member['role']; active: boolean }
  | { type: 'member-save'; member: Member }
  | { type: 'offering-save'; offering: Offering }
  | {
      type: 'enrollment-dates';
      enrollmentId: string;
      startsOn: string | null;
      endsOn: string | null;
      reason: string;
    }
  | { type: 'category-add'; category: string }
  | { type: 'fee-defaults'; fees: FeeItem[] }
  | { type: 'reset' };
