import { z } from 'zod';
import { admissionFeeItemsSchema, monthlyBillingSchema } from './admission-fees.js';

const shortText = z.string().trim().min(1).max(160);
const optionalText = z.string().trim().max(160);
export const admissionStateSchema = z.enum(['follow_up', 'willing', 'admitted', 'closed']);
export const candidateProfileSchema = z.strictObject({
  studentName: shortText,
  guardianName: shortText,
  relationship: shortText,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, 'Enter a valid phone number.'),
  address: z.string().trim().min(1).max(500),
  dateOfBirth: z.iso.date().or(z.literal('')),
  birthCertificate: z
    .string()
    .trim()
    .regex(/^(?:[0-9]{17})?$/, 'Use 17 digits.'),
  nationality: optionalText,
  fatherName: optionalText,
  motherName: optionalText,
  guardianNid: z
    .string()
    .trim()
    .regex(/^(?:[0-9]{10}|[0-9]{13}|[0-9]{17})?$/, 'Use 10, 13 or 17 digits.'),
  guardianNationality: optionalText,
  previousSchool: optionalText,
  source: z.string().trim().max(160),
  notes: z.string().trim().max(2000),
  identityException: z.string().trim().max(500),
});
export const admissionSettingsInputSchema = z.strictObject({
  version: z.number().int().min(0),
  reminderDaysBefore: z.number().int().min(1).max(30),
  beforeTime: z.iso.time({ precision: -1 }),
  onDateTime: z.iso.time({ precision: -1 }),
  willingFeeMinor: z.number().int().min(0).max(100000000),
  admissionFeeMinor: z.number().int().min(0).max(100000000),
  creditWillingFee: z.boolean(),
});
export const admissionSettingsSchema = admissionSettingsInputSchema.extend({
  timezone: z.string(),
});
export const offeringInputSchema = z.strictObject({ session: shortText, className: shortText });
export const offeringSchema = offeringInputSchema.extend({ id: z.uuid() });
export const admissionSetupSchema = z.object({
  settings: admissionSettingsSchema,
  offerings: z.array(offeringSchema),
  assignees: z.array(z.object({ userId: z.uuid(), name: z.string() })),
});
export const candidateCreateSchema = z
  .strictObject({
    operationKey: z.uuid(),
    state: z.enum(['follow_up', 'willing', 'admitted']),
    offeringId: z.uuid(),
    assigneeId: z.uuid(),
    profile: candidateProfileSchema,
    followUpDate: z.iso.date().nullable(),
    collectWillingFee: z.boolean(),
    collectAdmissionFee: z.boolean(),
    admissionFees: admissionFeeItemsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.admissionFees && value.state !== 'admitted')
      ctx.addIssue({
        code: 'custom',
        path: ['admissionFees'],
        message: 'Configure fees when confirming admission.',
      });
    if (value.state === 'follow_up' && !value.followUpDate)
      ctx.addIssue({
        code: 'custom',
        path: ['followUpDate'],
        message: 'Choose the next call date.',
      });
    if (value.state !== 'follow_up' && value.followUpDate)
      ctx.addIssue({
        code: 'custom',
        path: ['followUpDate'],
        message: 'Only follow-up records have a call date.',
      });
    if (value.collectWillingFee && value.state !== 'willing')
      ctx.addIssue({
        code: 'custom',
        path: ['collectWillingFee'],
        message: 'Willing fees apply only to willing records.',
      });
    if (value.collectAdmissionFee && value.state !== 'admitted')
      ctx.addIssue({
        code: 'custom',
        path: ['collectAdmissionFee'],
        message: 'Admission fees apply only to admission.',
      });
  });
export const candidateActionSchema = z
  .strictObject({
    assigneeId: z.uuid().optional(),
    operationKey: z.uuid(),
    version: z.number().int().min(1),
    action: z.enum(['call', 'willing', 'admit', 'close', 'reopen', 'edit']),
    outcome: z.enum(['agreed', 'needs_time', 'no_answer', 'not_interested']).nullable(),
    followUpDate: z.iso.date().nullable(),
    note: z.string().trim().max(1000),
    profile: candidateProfileSchema.optional(),
    collectWillingFee: z.boolean(),
    collectAdmissionFee: z.boolean(),
    admissionFees: admissionFeeItemsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.admissionFees && value.action !== 'admit')
      ctx.addIssue({
        code: 'custom',
        path: ['admissionFees'],
        message: 'Configure fees when confirming admission.',
      });
  });
export const candidateListQuerySchema = z.object({
  offeringId: z.uuid().optional(),
  assigneeId: z.uuid().optional(),
  state: admissionStateSchema.default('follow_up'),
  search: z.string().trim().max(100).default(''),
  due: z.enum(['all', 'today', 'upcoming', 'overdue']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});
export const candidateSummarySchema = z.object({
  id: z.uuid(),
  state: admissionStateSchema,
  version: z.number().int(),
  studentName: z.string(),
  guardianName: z.string(),
  phone: z.string(),
  session: z.string(),
  className: z.string(),
  assigneeName: z.string(),
  followUpDate: z.iso.date().nullable(),
  admittedAt: z.iso.datetime().nullable(),
  studentId: z.uuid().nullable(),
  admissionNumber: z.string().nullable(),
  createdAt: z.iso.datetime(),
});
export const candidateListSchema = z.object({
  items: z.array(candidateSummarySchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});
export const receiptSchema = z.object({
  id: z.uuid(),
  number: z.string(),
  kind: z.enum(['willing', 'admission']),
  feeItems: admissionFeeItemsSchema,
  amountMinor: z.number().int(),
  creditMinor: z.number().int(),
  createdAt: z.iso.datetime(),
});
export const candidateDetailSchema = z.object({
  candidate: candidateSummarySchema,
  profile: candidateProfileSchema,
  offeringId: z.uuid(),
  assigneeId: z.uuid(),
  admissionFeeMinor: z.number().int(),
  willingFeeMinor: z.number().int(),
  creditWillingFee: z.boolean(),
  admissionFees: admissionFeeItemsSchema,
  monthlyBilling: monthlyBillingSchema,
  receipts: z.array(receiptSchema),
  history: z.array(
    z.object({
      id: z.uuid(),
      action: z.string(),
      note: z.string(),
      actorName: z.string(),
      createdAt: z.iso.datetime(),
    }),
  ),
});
export const admissionNotificationsSchema = z.array(
  z.object({
    id: z.uuid(),
    candidateId: z.uuid(),
    dueDate: z.iso.date(),
    kind: z.enum(['before', 'on_date']),
    read: z.boolean(),
    createdAt: z.iso.datetime(),
  }),
);
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;
export type CandidateCreate = z.infer<typeof candidateCreateSchema>;
export type CandidateAction = z.infer<typeof candidateActionSchema>;
export type CandidateDetail = z.infer<typeof candidateDetailSchema>;
export type AdmissionSettings = z.infer<typeof admissionSettingsInputSchema>;
export type CandidateListQuery = z.infer<typeof candidateListQuerySchema>;
