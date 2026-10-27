import type {
  AttendanceMark,
  Candidate,
  DemoState,
  Expense,
  FeeItem,
  RosterStudent,
} from './demo-model';
import { initialRoutine, resolveRoutine } from '../routine/_component/routine-model';

export const DEMO_TODAY = '2026-10-26';
export const money = (amount: number) =>
  `BDT ${(amount / 100).toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
export const names = [
  'Ayesha Rahman',
  'Arif Hasan',
  'Nafisa Sultana',
  'Tahmid Islam',
  'Samia Akter',
  'Rafi Ahmed',
  'Mehedi Hasan',
  'Maliha Akter',
  'Abrar Hossain',
  'Nusrat Jahan',
  'Samiul Islam',
  'Faria Rahman',
  'Raihan Ahmed',
  'Jannatul Ferdous',
  'Tanvir Hasan',
  'Sadia Afrin',
  'Muntasir Rahman',
  'Nabila Islam',
  'Fahim Chowdhury',
  'Lamisa Akter',
  'Rifat Hossain',
  'Sumaiya Karim',
  'Adnan Kabir',
  'Mim Sultana',
  'Sakib Ahmed',
  'Nafisa Ahmed',
  'Tamim Islam',
  'Raisa Khan',
  'Mahin Rahman',
  'Safiya Noor',
  'Yasin Arafat',
  'Anika Tasnim',
  'Hasib Islam',
  'Zara Rahman',
  'Siyam Hasan',
  'Afra Islam',
  'Rudra Das',
  'Srija Roy',
  'Nayeem Karim',
  'Sanjida Akter',
];
export const classes = [
  { id: '3-a', label: 'Class 3 · A', count: 36 },
  { id: '4-a', label: 'Class 4 · A', count: 40 },
  { id: '5-b', label: 'Class 5 · B', count: 32 },
];
export function roster(classId: string): RosterStudent[] {
  const count = classes.find((c) => c.id === classId)?.count ?? 36;
  return names
    .slice(0, count)
    .map((name, i) => ({ id: `${classId}-${i + 1}`, name, roll: String(i + 1).padStart(2, '0') }));
}
export const defaultFees: FeeItem[] = [
  {
    id: 'admission',
    label: 'Admission fee',
    type: 'admission',
    amount: 300000,
    start: '',
    end: '',
  },
  { id: 'session', label: 'Session fee', type: 'session', amount: 120000, start: '', end: '' },
  {
    id: 'monthly',
    label: 'Monthly tuition',
    type: 'monthly',
    amount: 80000,
    start: DEMO_TODAY,
    end: '',
  },
  { id: 'library', label: 'Library fee', type: 'other', amount: 30000, start: '', end: '' },
];
function candidates(): Candidate[] {
  return names.slice(0, 18).map((name, i) => ({
    id: `ADM-2026-${String(128 + i).padStart(4, '0')}`,
    name,
    guardian:
      [
        'Farhana Rahman',
        'Mahmud Hasan',
        'Jannatul Sultana',
        'Imran Islam',
        'Salma Akter',
        'Kamal Ahmed',
      ][i % 6] ?? 'Farhana Rahman',
    phone: `01XXX XXX ${201 + i}`,
    className: `Class ${3 + (i % 4)} · A`,
    session: '2026',
    officer: i % 2 ? 'Sadia Karim' : 'Nusrat Ahmed',
    state: i < 6 ? 'follow_up' : i < 10 ? 'willing' : i < 16 ? 'admitted' : 'closed',
    nextCall: i === 0 ? '2026-10-25' : i < 4 ? DEMO_TODAY : '2026-10-28',
    notes: 'Guardian would like to visit the school before confirming.',
    dob: '2018-03-14',
    father: 'Shahid Rahman',
    mother: 'Farhana Rahman',
    address: 'Mirpur, Dhaka',
    certificate: 'SYN-CERT-0826',
    nid: 'SYN-NID-4102',
    relationship: 'Mother',
    nationality: 'Bangladeshi',
    previousSchool: 'Shapla Preparatory School',
    source: 'School visit',
    exceptionReason: '',
    willingPaid: i === 6 ? 50000 : 0,
    admittedOn: i >= 10 && i < 16 ? DEMO_TODAY : '',
    fees: defaultFees.map((f) => ({ ...f })),
    calls: [
      {
        date: '2026-10-24',
        outcome: 'Needs more time',
        note: 'Guardian requested a classroom visit.',
      },
      {
        date: '2026-10-20',
        outcome: 'Record created',
        note: 'Enquiry received during the school open day.',
      },
    ],
  }));
}
function expenses(): Expense[] {
  const rows = [
    ['October electricity bill', 'Utilities', 'DESCO', 845000, false, 'approved'],
    ['Classroom stationery', 'Supplies', 'Shapla Stationery', 120000, false, 'approved'],
    [
      'Science display materials',
      'Teaching materials',
      'School supply store',
      280000,
      false,
      'pending',
    ],
    ['Classroom fan repair', 'Maintenance', 'Mirpur Electrical', 360000, true, 'approved'],
    ['October internet', 'Utilities', 'School ISP', 200000, true, 'approved'],
    ['Library shelving repair', 'Maintenance', 'School workshop', 480000, true, 'approved'],
    ['Classroom workbooks', 'Teaching materials', 'Shapla Book House', 1840000, true, 'approved'],
    [
      'School facility maintenance',
      'Maintenance',
      'School maintenance team',
      2720000,
      true,
      'approved',
    ],
  ] satisfies [string, string, string, number, boolean, Expense['status']][];
  return rows.map(([description, category, payee, amount, paid, status], i) => ({
    id: `EXP-2026-${String(42 - i).padStart(4, '0')}`,
    description,
    category,
    payee,
    amount,
    paid,
    status,
    date: DEMO_TODAY,
    reference: `SYN-INV-${42 - i}`,
    attachment: 'synthetic-school-bill.pdf',
    notes: 'School operating expense.',
    reviewNote: '',
    history: ['Rashed Islam recorded this expense.'],
    voucher: paid ? `PV-2026-${96 - i}` : '',
  }));
}
export function initialState(): DemoState {
  const list = candidates();
  const admitted = list.filter((c) => c.state === 'admitted');
  return {
    candidates: list,
    charges: admitted.flatMap((c) => [
      {
        id: `${c.id}-tuition`,
        candidateId: c.id,
        label: 'Monthly tuition',
        period: 'October 2026',
        due: '2026-10-10',
        amount: 80000,
        paid: 0,
      },
      {
        id: `${c.id}-exam`,
        candidateId: c.id,
        label: 'Examination fee',
        period: 'Annual assessment',
        due: '2026-10-20',
        amount: 50000,
        paid: 0,
      },
      {
        id: `${c.id}-library`,
        candidateId: c.id,
        label: 'Library fee',
        period: 'Session 2026',
        due: '2026-10-31',
        amount: 30000,
        paid: 0,
      },
    ]),
    payments: [],
    schedules: admitted.map((c) => ({
      id: `schedule-${c.id}`,
      candidateId: c.id,
      label: 'Monthly tuition',
      amount: 80000,
      next: '2026-11-26',
      end: '',
      active: true,
    })),
    expenses: expenses(),
    registers: [
      ...classes.map((c) => ({
        id: `${DEMO_TODAY}|${c.id}`,
        classId: c.id,
        date: DEMO_TODAY,
        submitted: c.id === '4-a',
        saved: true,
        marks: Object.fromEntries(
          roster(c.id).map((student, i): [string, AttendanceMark] => [
            student.id,
            c.id === '5-b' || (c.id === '3-a' && [2, 3].includes(i))
              ? 'Unmarked'
              : [1, 17, 28].includes(i)
                ? 'Absent'
                : [4, 12].includes(i)
                  ? 'Late'
                  : 'Present',
          ]),
        ),
      })),
      ...['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-25'].map((date) => ({
        id: `${date}|3-a`,
        classId: '3-a',
        date,
        submitted: true,
        saved: true,
        marks: Object.fromEntries(
          roster('3-a').map((student, i): [string, AttendanceMark] => [
            student.id,
            i === 1 && date !== '2026-10-19' ? 'Absent' : i === 4 ? 'Late' : 'Present',
          ]),
        ),
      })),
    ],
    selectedRegister: `${DEMO_TODAY}|3-a`,
    corrections: [],
    routine: initialRoutine(),
    routineHistory: [
      { ...resolveRoutine(initialRoutine()), published: true, version: 1, effective: '2026-01-01' },
    ],
    settings: {
      name: 'Shapla Model School',
      code: 'SCH-042',
      address: 'Mirpur, Dhaka',
      phone: '01XXX XXX 420',
      medium: 'Bangla medium',
      timezone: 'Asia/Dhaka',
      currency: 'BDT',
      session: '2026',
      start: '2026-01-01',
      end: '2026-12-31',
      reminderDays: '1',
      reminderTime: '09:00',
      willingFee: '500',
      creditWilling: 'yes',
      cutoff: '09:30',
      defaultStatus: 'Unmarked',
      correctionRole: 'Admin / Principal',
      expenseThreshold: '5000',
      evidence: 'Required',
      category: 'Utilities',
      weeklyClosure: 'Friday, Saturday',
    },
    members: [
      { id: 'member-1', name: 'Nusrat Ahmed', role: 'Admin', active: true },
      { id: 'member-2', name: 'Mahmud Hasan', role: 'Principal', active: true },
      { id: 'member-3', name: 'Sadia Karim', role: 'Admission Officer', active: true },
      { id: 'member-4', name: 'Rashed Islam', role: 'Accountant', active: true },
      { id: 'member-5', name: 'Farhana Akter', role: 'Teacher', active: true },
    ],
    offerings: Array.from({ length: 10 }, (_, i) => ({
      id: `class-${i + 1}`,
      className: `Class ${i + 1}`,
      session: '2026',
      sections: i < 2 ? 'A, B' : 'A',
      capacity: '36',
      teacher: i % 2 ? 'Sadia Karim' : 'Farhana Akter',
      active: true,
    })),
    categories: [
      'Utilities',
      'Supplies',
      'Maintenance',
      'Teaching materials',
      'School events',
      'Other expenses',
    ],
    feeDefaults: defaultFees.map((f) => ({ ...f })),
  };
}
