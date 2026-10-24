import { z } from 'zod';
import {
  institutionModuleKeys,
  institutionModuleSchema,
  institutionStatusSchema,
  institutionTypeSchema,
} from './institution.js';
export const platformRoleSchema = z.enum(['platform_owner', 'platform_manager']);
export const subscriptionStatusSchema = z.enum(['trial', 'active', 'past_due', 'cancelled']);
export const subscriptionBillingCycleSchema = z.enum(['monthly', 'annual']);
export const platformPermissionSchema = z.enum([
  'platform.access.read',
  'platform.operators.manage',
  'platform.institutions.read',
  'platform.institutions.create',
  'platform.institutions.manage',
  'platform.subscriptions.manage',
]);
export const platformAccessSchema = z.object({
  userId: z.uuid(),
  role: platformRoleSchema,
  permissions: z.array(platformPermissionSchema),
});
export const platformOperatorStateSchema = z.strictObject({
  role: platformRoleSchema,
  active: z.boolean(),
});
export const platformOperatorSchema = platformOperatorStateSchema.extend({ userId: z.uuid() });
export const platformOperatorsSchema = z.object({
  items: z.array(platformOperatorSchema),
  limit: z.number().int(),
  offset: z.number().int(),
});
export const platformInstitutionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  timezone: z.string(),
  type: institutionTypeSchema.nullable(),
  status: institutionStatusSchema,
  statusReason: z.string().nullable(),
  enabledModules: z.array(institutionModuleSchema),
});
export const platformInstitutionAdminSchema = z.strictObject({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(12).max(128).meta({ format: 'password', writeOnly: true }),
});
export const platformInstitutionCreateSchema = z.strictObject({
  name: z.string().trim().min(3).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(70)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.'),
  type: institutionTypeSchema,
  firstAdmin: platformInstitutionAdminSchema,
  timezone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .default('Asia/Dhaka')
    .refine((value) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, 'Enter a valid IANA time zone.'),
});
export const platformInstitutionStatusSchema = z
  .strictObject({
    status: institutionStatusSchema,
    reason: z.string().trim().max(500).optional(),
  })
  .superRefine((value, context) => {
    if (value.status !== 'active' && (!value.reason || value.reason.length < 5))
      context.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Add a reason of at least five characters.',
      });
    if (
      value.status === 'active' &&
      value.reason &&
      value.reason.length > 0 &&
      value.reason.length < 5
    )
      context.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Use at least five characters or clear the reason.',
      });
  });
export const platformInstitutionModulesSchema = z.strictObject({
  enabledModules: z
    .array(institutionModuleSchema)
    .max(institutionModuleKeys.length)
    .refine((values) => new Set(values).size === values.length, 'Choose each module at most once.'),
});
export const platformInstitutionSubscriptionInputSchema = z.strictObject({
  planName: z.string().trim().min(2).max(100),
  status: subscriptionStatusSchema,
  billingCycle: subscriptionBillingCycleSchema,
  amountTaka: z.number().int().min(0).max(100_000_000),
  periodEndsAt: z.iso.date().nullable(),
});
export const platformInstitutionSubscriptionSchema =
  platformInstitutionSubscriptionInputSchema.extend({
    institutionId: z.uuid(),
    updatedAt: z.iso.datetime(),
  });
export const platformSubscriptionsSchema = z.object({
  items: z.array(
    z.object({
      institution: z.object({
        id: z.uuid(),
        name: z.string(),
        slug: z.string(),
        type: institutionTypeSchema.nullable(),
      }),
      subscription: platformInstitutionSubscriptionSchema.nullable(),
    }),
  ),
  limit: z.number().int(),
  offset: z.number().int(),
});
export const platformInstitutionsSchema = z.object({
  items: z.array(platformInstitutionSchema),
  limit: z.number().int(),
  offset: z.number().int(),
});
