import { z } from 'zod';
import { eq, type DatabaseTransaction } from '@eduos/database';
import { schoolConfiguration } from '@eduos/database/schema';
import {
  admissionFeeItemsSchema,
  admissionSettingsInputSchema,
  type SchoolAction,
} from '@eduos/contracts';
import { requireSchool, type SchoolAccess } from './policy.js';
import { type SchoolConfiguration } from '../../models/school.model.js';
import { admissionFees, saveSchoolAdmissionSettings } from '../admissions/school-admissions.js';
import { invalidRequest } from '../../lib/errors.js';
const yesNo = z.enum(['yes', 'no']);
const money = z
  .string()
  .regex(/^\d+(?:\.\d{1,2})?$/)
  .refine((v) => Number(v) <= 1000000);
const label = z.string().trim().min(1).max(160);
const settingsSchema = z
  .strictObject({
    name: label,
    code: z.string(),
    address: z.string().trim().min(1).max(500),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/),
    medium: z.enum(['Bangla medium', 'English version', 'English medium']),
    timezone: z.string(),
    currency: z.literal('BDT'),
    session: label,
    start: z.iso.date(),
    end: z.iso.date(),
    reminderDays: z.enum(['1', '2', '3']),
    reminderTime: z.iso.time({ precision: -1 }),
    willingFee: money,
    creditWilling: yesNo,
    cutoff: z.iso.time({ precision: -1 }),
    defaultStatus: z.literal('Unmarked'),
    correctionRole: z.enum(['Admin / Principal', 'Principal']),
    reasonRequired: z.literal('yes'),
    lateIncluded: yesNo,
    weeklyClosure: z.string().max(160),
    holidayName: z.string().max(160),
    holidayDate: z.iso.date().or(z.literal('')),
    expenseThreshold: money,
    expenseReviewer: z.enum(['Admin / Principal', 'Principal']),
    evidence: z.enum(['Required', 'Optional']),
  })
  .partial();
export async function runSchoolSettings(
  tx: DatabaseTransaction,
  access: SchoolAccess,
  config: SchoolConfiguration,
  action: SchoolAction,
) {
  requireSchool(access, 'school.settings');
  if (action.type === 'category-add') {
    requireSchool(access, 'expenses.review', 'fees');
    if (config.categories.some((c) => c.toLowerCase() === action.category.toLowerCase()))
      invalidRequest();
    await tx
      .update(schoolConfiguration)
      .set({ categories: [...config.categories, action.category] })
      .where(eq(schoolConfiguration.institutionId, access.school.id));
  } else if (action.type === 'fee-defaults') {
    requireSchool(access, 'admissions.settings', 'fees');
    if (!admissionFeeItemsSchema.safeParse(admissionFees(action.fees)).success) invalidRequest();
    await tx
      .update(schoolConfiguration)
      .set({ feeDefaults: action.fees })
      .where(eq(schoolConfiguration.institutionId, access.school.id));
  } else if (action.type === 'settings-save') {
    const parsed = settingsSchema.safeParse(action.values);
    if (!parsed.success) invalidRequest();
    const values = parsed.data;
    if (
      (values.code && values.code !== access.school.code) ||
      (values.timezone && values.timezone !== access.school.timezone)
    )
      invalidRequest();
    const merged = { ...config.settings, ...values };
    if (merged.start && merged.end && merged.start > merged.end) invalidRequest();
    if (['reminderDays', 'reminderTime', 'willingFee', 'creditWilling'].some((k) => k in values)) {
      if (
        !admissionSettingsInputSchema.partial().safeParse({
          reminderDaysBefore: Number(merged.reminderDays),
          beforeTime: merged.reminderTime,
          onDateTime: merged.reminderTime,
          willingFeeMinor: Math.round(Number(merged.willingFee) * 100),
          creditWillingFee: merged.creditWilling === 'yes',
        }).success
      )
        invalidRequest();
      await saveSchoolAdmissionSettings(tx, access, action.values);
    }
    await tx
      .update(schoolConfiguration)
      .set({ settings: merged })
      .where(eq(schoolConfiguration.institutionId, access.school.id));
  } else invalidRequest();
}
