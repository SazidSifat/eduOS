export type CandidateState = 'follow_up' | 'willing' | 'admitted' | 'closed';
export interface FeeItem {
  id: string;
  label: string;
  type: 'admission' | 'session' | 'monthly' | 'other';
  amount: number;
  start: string;
  end: string;
}
export interface CallRecord {
  date: string;
  outcome: string;
  note: string;
}
export interface Candidate {
  id: string;
  name: string;
  guardian: string;
  phone: string;
  className: string;
  session: string;
  officer: string;
  state: CandidateState;
  nextCall: string;
  notes: string;
  dob: string;
  father: string;
  mother: string;
  address: string;
  certificate: string;
  nid: string;
  relationship: string;
  nationality: string;
  previousSchool: string;
  source: string;
  exceptionReason: string;
  willingPaid: number;
  admittedOn: string;
  calls: CallRecord[];
  fees: FeeItem[];
}
export interface Charge {
  id: string;
  candidateId: string;
  label: string;
  period: string;
  due: string;
  amount: number;
  paid: number;
}
export interface Payment {
  id: string;
  candidateId: string;
  amount: number;
  date: string;
  collector: string;
  kind: 'admission' | 'willing' | 'school';
  allocations: { chargeId: string; amount: number }[];
  reversed: string;
}
export interface Schedule {
  id: string;
  candidateId: string;
  label: string;
  amount: number;
  next: string;
  end: string;
  active: boolean;
}
export interface Expense {
  id: string;
  description: string;
  category: string;
  payee: string;
  reference: string;
  amount: number;
  date: string;
  status: 'draft' | 'pending' | 'approved' | 'returned';
  paid: boolean;
  attachment: string;
  notes: string;
  reviewNote: string;
  history: string[];
  voucher: string;
}
export type AttendanceMark = 'Present' | 'Absent' | 'Late' | 'Unmarked';
export interface RosterStudent {
  id: string;
  name: string;
  roll: string;
}
export interface Register {
  id: string;
  classId: string;
  date: string;
  marks: Record<string, AttendanceMark>;
  submitted: boolean;
  saved: boolean;
}
export interface Correction {
  id: string;
  registerId: string;
  studentId: string;
  original: AttendanceMark;
  proposed: AttendanceMark;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}
export interface Lesson {
  id: string;
  day: string;
  period: string;
  subject: string;
  teacher: string;
  room: string;
}
export interface RoutinePeriod {
  id: string;
  start: string;
  end: string;
}
export interface Routine {
  lessons: Lesson[];
  days: string[];
  periods: RoutinePeriod[];
  className: string;
  effective: string;
  published: boolean;
  version: number;
  note: string;
}
export interface Member {
  id: string;
  name: string;
  role: 'Admin' | 'Principal' | 'Admission Officer' | 'Accountant' | 'Teacher';
  active: boolean;
}
export interface Offering {
  id: string;
  className: string;
  session: string;
  sections: string;
  capacity: string;
  teacher: string;
  active: boolean;
}
export interface DemoState {
  candidates: Candidate[];
  charges: Charge[];
  payments: Payment[];
  schedules: Schedule[];
  expenses: Expense[];
  registers: Register[];
  corrections: Correction[];
  selectedRegister: string;
  routine: Routine;
  routineHistory: Routine[];
  settings: Record<string, string>;
  members: Member[];
  offerings: Offering[];
  categories: string[];
  feeDefaults: FeeItem[];
}
export type DemoAction =
  | { type: 'candidate-save'; candidate: Candidate }
  | { type: 'call'; candidateId: string; outcome: string; note: string; nextCall: string }
  | { type: 'candidate-state'; candidateId: string; state: CandidateState; nextCall: string }
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
  | { type: 'category-add'; category: string }
  | { type: 'fee-defaults'; fees: FeeItem[] }
  | { type: 'reset' };
