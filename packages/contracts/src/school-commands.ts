import { z } from 'zod';
import {
  schoolCandidateSchema,
  schoolCorrectionSchema,
  schoolExpenseSchema,
  schoolFeeSchema,
  schoolLessonSchema,
  schoolMemberSchema,
  schoolOfferingSchema,
  schoolPeriodSchema,
  schoolMarkSchema,
} from './school-model.js';
const id = z.string().min(1).max(160);
const note = z.string().trim().min(1).max(1000);
const fees = z.array(schoolFeeSchema).min(1).max(20);
export const schoolActionSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('candidate-save'),
    candidate: schoolCandidateSchema,
    admission: z.strictObject({ fees, cashConfirmed: z.boolean() }).optional(),
    collectWillingFee: z.boolean().optional(),
  }),
  z.strictObject({
    type: z.literal('call'),
    candidateId: z.uuid(),
    outcome: z.enum(['Agreed', 'Needs more time', 'No answer', 'Not interested']),
    note,
    nextCall: z.iso.date().or(z.literal('')),
  }),
  z.strictObject({
    type: z.literal('candidate-state'),
    candidateId: z.uuid(),
    state: z.enum(['follow_up', 'willing', 'closed']),
    nextCall: z.iso.date().or(z.literal('')),
    note,
  }),
  z.strictObject({
    type: z.literal('admit'),
    candidateId: z.uuid(),
    fees,
    cashConfirmed: z.boolean(),
  }),
  z.strictObject({
    type: z.literal('willing-payment'),
    candidateId: z.uuid(),
    amount: z.number().int().positive().max(100000000),
  }),
  z.strictObject({
    type: z.literal('collect'),
    candidateId: z.uuid(),
    allocations: z
      .array(
        z.strictObject({ chargeId: z.uuid(), amount: z.number().int().positive().max(100000000) }),
      )
      .min(1)
      .max(100),
    date: z.iso.date(),
  }),
  z.strictObject({ type: z.literal('reverse'), paymentId: z.uuid(), reason: note }),
  z.strictObject({ type: z.literal('schedule-stop'), id: z.uuid() }),
  z.strictObject({ type: z.literal('expense-save'), expense: schoolExpenseSchema }),
  z.strictObject({ type: z.literal('expense-review'), id: z.uuid(), approved: z.boolean(), note }),
  z.strictObject({ type: z.literal('expense-pay'), id: z.uuid() }),
  z.strictObject({
    type: z.literal('attendance-save'),
    classId: id,
    date: z.iso.date(),
    marks: z.record(z.uuid(), schoolMarkSchema),
    submit: z.boolean(),
  }),
  z.strictObject({ type: z.literal('correction-request'), correction: schoolCorrectionSchema }),
  z.strictObject({ type: z.literal('correction-review'), id: z.uuid(), approved: z.boolean() }),
  z.strictObject({
    type: z.literal('routine-configure'),
    classId: z.string().max(160).optional(),
    days: z
      .array(z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']))
      .min(1)
      .max(7),
    effective: z.iso.date(),
    periods: z.array(schoolPeriodSchema).min(1).max(16),
    className: note,
  }),
  z.strictObject({ type: z.literal('lesson-save'), lesson: schoolLessonSchema }),
  z.strictObject({ type: z.literal('routine-publish'), note: z.string().trim().max(1000) }),
  z.strictObject({
    type: z.literal('settings-save'),
    values: z.record(z.string().max(80), z.string().max(1000)),
  }),
  z.strictObject({ type: z.literal('member-save'), member: schoolMemberSchema }),
  z.strictObject({
    type: z.literal('member-update'),
    id: z.string(),
    role: schoolMemberSchema.shape.role,
    active: z.boolean(),
  }),
  z.strictObject({ type: z.literal('offering-save'), offering: schoolOfferingSchema }),
  z.strictObject({
    type: z.literal('enrollment-dates'),
    enrollmentId: z.uuid(),
    startsOn: z.iso.date().nullable(),
    endsOn: z.iso.date().nullable(),
    reason: note,
  }),
  z.strictObject({ type: z.literal('category-add'), category: note }),
  z.strictObject({ type: z.literal('fee-defaults'), fees }),
]);
export const schoolCommandSchema = z.strictObject({
  operationKey: z.uuid(),
  revision: z.number().int().min(0),
  action: schoolActionSchema,
});
export const schoolCommandResultSchema = z.strictObject({
  ok: z.literal(true),
  id: z.string().optional(),
});
export const schoolEvidenceInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(160),
  mediaType: z.enum(['application/pdf', 'image/png', 'image/jpeg']),
  content: z
    .string()
    .min(1)
    .max(6990508)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/),
});
export const schoolEvidenceSchema = z.strictObject({ id: z.uuid(), name: z.string() });
export type SchoolAction = z.infer<typeof schoolActionSchema>;
export type SchoolCommand = z.infer<typeof schoolCommandSchema>;
