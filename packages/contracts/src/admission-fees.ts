import { z } from 'zod';

export const admissionFeeItemSchema = z
  .strictObject({
    type: z.enum(['admission', 'session', 'monthly', 'other']),
    label: z.string().trim().min(1, 'Enter a fee name.').max(80),
    amountMinor: z.number().int().min(0).max(100000000),
    billingStartDate: z.iso.date().nullable(),
    billingEndDate: z.iso.date().nullable(),
  })
  .superRefine((item, ctx) => {
    if (item.type === 'monthly') {
      if (!item.billingStartDate)
        ctx.addIssue({
          code: 'custom',
          path: ['billingStartDate'],
          message: 'Choose the first billing date.',
        });
      if (item.amountMinor <= 0)
        ctx.addIssue({
          code: 'custom',
          path: ['amountMinor'],
          message: 'Monthly fees must be greater than zero.',
        });
      if (
        item.billingEndDate &&
        item.billingStartDate &&
        item.billingEndDate < item.billingStartDate
      )
        ctx.addIssue({
          code: 'custom',
          path: ['billingEndDate'],
          message: 'The last billing date must follow the first date.',
        });
    } else if (item.billingStartDate || item.billingEndDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['billingStartDate'],
        message: 'Billing dates apply only to monthly fees.',
      });
    }
  });
export const admissionFeeItemsSchema = z
  .array(admissionFeeItemSchema)
  .min(1)
  .max(20)
  .superRefine((items, ctx) => {
    if (items.reduce((total, item) => total + item.amountMinor, 0) > 100000000)
      ctx.addIssue({ code: 'custom', message: 'Total fees cannot exceed BDT 1,000,000.' });
    const names = new Set<string>();
    items.forEach((item, index) => {
      const name = item.label.toLocaleLowerCase('en');
      if (names.has(name))
        ctx.addIssue({
          code: 'custom',
          path: [index, 'label'],
          message: 'Use a different name for each fee.',
        });
      names.add(name);
    });
  });
export const monthlyFeeScheduleSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  amountMinor: z.number().int(),
  startDate: z.iso.date(),
  endDate: z.iso.date().nullable(),
  nextDueDate: z.iso.date(),
  active: z.boolean(),
});
export const monthlyFeeChargeSchema = z.object({
  id: z.uuid(),
  label: z.string(),
  dueDate: z.iso.date(),
  amountMinor: z.number().int(),
  receiptNumber: z.string().nullable(),
  paidAt: z.iso.datetime().nullable(),
});
export const monthlyBillingSchema = z.object({
  schedules: z.array(monthlyFeeScheduleSchema),
  charges: z.array(monthlyFeeChargeSchema),
  outstandingMinor: z.number().int(),
});
export const monthlyCollectionSchema = z.strictObject({ confirmCashReceived: z.literal(true) });
export const stopMonthlyBillingSchema = z.strictObject({ confirmStop: z.literal(true) });
export type AdmissionFeeItem = z.infer<typeof admissionFeeItemSchema>;
export type MonthlyBilling = z.infer<typeof monthlyBillingSchema>;
