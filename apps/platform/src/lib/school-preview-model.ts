import { z } from 'zod';
import type { PreviewInstitution } from './preview-data.js';

export const schoolStatusSchema = z.enum(['active', 'frozen', 'inactive']);
export const planNames = {
  unassigned: 'Not assigned',
  essentials: 'School Essentials',
  plus: 'School Plus',
  custom: 'Custom',
};
export const subscriptionSchema = z
  .object({
    plan: z.enum(['unassigned', 'essentials', 'plus', 'custom']),
    billingCycle: z.enum(['monthly', 'annual']),
    status: z.enum(['not_configured', 'trial', 'active', 'overdue', 'cancelled']),
    amount: z.number().int().min(0).max(10000000),
    renewalDate: z.union([z.iso.date(), z.literal('')]),
  })
  .superRefine((value, context) => {
    if (value.plan === 'unassigned' && value.status !== 'not_configured')
      context.addIssue({
        code: 'custom',
        path: ['plan'],
        message: 'Choose a plan before setting a subscription status.',
      });
    if (['active', 'trial', 'overdue'].includes(value.status) && !value.renewalDate)
      context.addIssue({
        code: 'custom',
        path: ['renewalDate'],
        message: 'Enter the next renewal or review date.',
      });
  });
export const createSchoolSchema = z.object({
  name: z.string().trim().min(3, 'Enter the school name.').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(70)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.'),
  contactName: z.string().trim().min(2, 'Enter a contact name.').max(80),
  contactEmail: z.email('Enter a valid contact email.').max(254),
});
export const schoolStatusChangeSchema = z.object({
  status: schoolStatusSchema,
  reason: z.string().trim().min(5, 'Add a short reason for this change.').max(500),
});
export const schoolMessageSchema = z.object({
  schoolId: z.uuid('Choose a school.'),
  kind: z.enum(['notice', 'warning']),
  channel: z.enum(['email', 'in_app', 'both']),
  subject: z.string().trim().min(3, 'Enter a subject.').max(120),
  body: z.string().trim().min(5, 'Enter the message for the school.').max(2000),
});
export type SchoolStatus = z.infer<typeof schoolStatusSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type SchoolMessageInput = z.infer<typeof schoolMessageSchema>;
export type SchoolPreview = PreviewInstitution & {
  contactName: string;
  contactEmail: string;
  status: SchoolStatus;
  statusReason: string;
  subscription: Subscription;
};
export type SchoolMessage = SchoolMessageInput & {
  id: string;
  recipient: string;
  createdAt: string;
};
export type SchoolEvent = {
  id: string;
  schoolId: string;
  summary: string;
  detail: string;
  createdAt: string;
};
export type SchoolPreviewState = {
  schools: SchoolPreview[];
  messages: SchoolMessage[];
  events: SchoolEvent[];
};

export const subscriptionStatusName = (status: Subscription['status']) =>
  ({
    not_configured: 'Not configured',
    trial: 'Trial',
    active: 'Active',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  })[status];
export const money = (amount: number) => `BDT ${new Intl.NumberFormat('en-BD').format(amount)}`;
export const dateLabel = (value: string) =>
  value
    ? new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Dhaka',
      }).format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value))
    : 'Not set';
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);
