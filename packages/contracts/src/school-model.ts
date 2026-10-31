import { z } from 'zod';
const text = z.string().trim().max(1000);
const label = z.string().trim().min(1).max(160);
const id = z.string().min(1).max(160);
const amount = z.number().int().min(0).max(100000000);
const date = z.iso.date().or(z.literal(''));
export const schoolFeeSchema = z
  .strictObject({
    id,
    label,
    type: z.enum(['admission', 'session', 'monthly', 'other']),
    amount,
    start: date,
    end: date,
  })
  .superRefine((v, c) => {
    if (v.type === 'monthly' && (!v.start || !v.amount || (v.end && v.end < v.start)))
      c.addIssue({
        code: 'custom',
        message: 'Monthly fees need a positive amount and valid billing dates.',
      });
  });
export const schoolCandidateSchema = z.strictObject({
  id: z.uuid(),
  name: label,
  guardian: label,
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Enter a valid guardian phone number.'),
  className: label,
  session: label,
  officer: label,
  state: z.enum(['follow_up', 'willing', 'admitted', 'closed']),
  nextCall: date,
  notes: z.string().max(2000),
  dob: date,
  father: text,
  mother: text,
  address: text,
  certificate: text,
  nid: text,
  relationship: text,
  nationality: text,
  previousSchool: text,
  source: text,
  exceptionReason: text,
  willingPaid: amount,
  admittedOn: date,
  calls: z.array(z.strictObject({ date, outcome: text, note: text })).max(100),
  fees: z.array(schoolFeeSchema).max(20),
  version: z.number().int().positive().optional(),
});
export const schoolChargeSchema = z.strictObject({
  id,
  candidateId: id,
  label,
  period: text,
  due: date,
  amount,
  paid: amount,
});
export const schoolPaymentSchema = z.strictObject({
  id,
  candidateId: id,
  amount,
  date,
  collector: text,
  kind: z.enum(['admission', 'willing', 'school']),
  allocations: z.array(z.strictObject({ chargeId: id, amount })).max(100),
  reversed: text,
});
export const schoolScheduleSchema = z.strictObject({
  id,
  candidateId: id,
  label,
  amount,
  next: date,
  end: date,
  active: z.boolean(),
});
export const schoolExpenseSchema = z.strictObject({
  id: z.uuid(),
  description: label,
  category: label,
  payee: label,
  reference: text,
  amount: amount.positive(),
  date: z.iso.date(),
  status: z.enum(['draft', 'pending', 'approved', 'returned']),
  paid: z.boolean(),
  attachment: z.uuid().or(z.literal('')),
  notes: text,
  reviewNote: text,
  history: z.array(z.string().max(1400)),
  voucher: text,
  paidOn: date.optional(),
  paidBy: text.optional(),
});
export const schoolMarkSchema = z.enum(['Present', 'Absent', 'Late', 'Unmarked']);
export const schoolRegisterSchema = z.strictObject({
  id,
  classId: id,
  date: z.iso.date(),
  marks: z.record(z.string(), schoolMarkSchema),
  submitted: z.boolean(),
  saved: z.boolean(),
});
export const schoolCorrectionSchema = z.strictObject({
  id: z.uuid(),
  registerId: id,
  studentId: z.uuid(),
  original: schoolMarkSchema,
  proposed: schoolMarkSchema.exclude(['Unmarked']),
  reason: label,
  status: z.enum(['pending', 'approved', 'rejected']),
});
export const schoolLessonSchema = z.strictObject({
  id,
  day: label,
  period: id,
  subject: label,
  teacher: id,
  room: label,
});
export const schoolPeriodSchema = z.strictObject({
  id,
  start: z.iso.time({ precision: -1 }),
  end: z.iso.time({ precision: -1 }),
});
export const schoolRoutineSchema = z.strictObject({
  lessons: z.array(schoolLessonSchema).max(100),
  days: z.array(label).max(7),
  periods: z.array(schoolPeriodSchema).max(16),
  className: text,
  classId: z.string().max(160).optional(),
  session: z.string().max(160).optional(),
  effective: date,
  published: z.boolean(),
  version: z.number().int().min(0),
  note: text,
});
export const schoolMemberSchema = z.strictObject({
  id,
  name: label,
  role: z.enum(['Admin', 'Principal', 'Admission Officer', 'Accountant', 'Teacher']),
  active: z.boolean(),
  email: z.email().optional(),
});
export const schoolOfferingSchema = z.strictObject({
  id: z.uuid(),
  className: label,
  session: label,
  sections: label,
  capacity: z.string().regex(/^[1-9][0-9]{0,3}$/),
  teacher: text,
  active: z.boolean(),
});
export const schoolStateSchema = z.strictObject({
  candidates: z.array(schoolCandidateSchema),
  charges: z.array(schoolChargeSchema),
  payments: z.array(schoolPaymentSchema),
  schedules: z.array(schoolScheduleSchema),
  expenses: z.array(schoolExpenseSchema),
  registers: z.array(schoolRegisterSchema),
  corrections: z.array(schoolCorrectionSchema),
  selectedRegister: z.string(),
  routine: schoolRoutineSchema,
  routineHistory: z.array(schoolRoutineSchema),
  settings: z.record(z.string(), z.string()),
  members: z.array(schoolMemberSchema),
  offerings: z.array(schoolOfferingSchema),
  categories: z.array(label),
  feeDefaults: z.array(schoolFeeSchema).max(20),
});
export const schoolSnapshotSchema = z.strictObject({
  institutionId: z.uuid(),
  revision: z.number().int().min(0),
  state: schoolStateSchema,
  identity: z.strictObject({ id: z.string(), name: z.string(), role: z.string() }),
  permissions: z.array(z.string()),
  modules: z.array(z.string()),
  today: z.iso.date(),
  routineConflicts: z.array(
    z.strictObject({
      lessonId: z.string(),
      kind: z.string(),
      title: z.string(),
      detail: z.string(),
    }),
  ),
  classes: z.array(z.strictObject({ id, label, count: z.number().int(), teacherId: z.string() })),
  students: z.array(
    z.strictObject({
      id: z.uuid(),
      name: label,
      roll: z.string(),
      classId: id,
      enrollmentId: z.uuid(),
      startsOn: z.iso.date().nullable(),
      endsOn: z.iso.date().nullable(),
    }),
  ),
});
export type SchoolState = z.infer<typeof schoolStateSchema>;
export type SchoolSnapshot = z.infer<typeof schoolSnapshotSchema>;
export type SchoolCandidate = z.infer<typeof schoolCandidateSchema>;
export type SchoolFee = z.infer<typeof schoolFeeSchema>;
export type SchoolExpense = z.infer<typeof schoolExpenseSchema>;
export type SchoolRoutine = z.infer<typeof schoolRoutineSchema>;
export type SchoolRegister = z.infer<typeof schoolRegisterSchema>;
