import { z } from 'zod';
export const platformRoleSchema = z.enum(['platform_owner', 'platform_manager']);
export const platformPermissionSchema = z.enum([
  'platform.access.read',
  'platform.operators.manage',
  'platform.institutions.read',
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
export const platformInstitutionsSchema = z.object({
  items: z.array(
    z.object({ id: z.uuid(), name: z.string(), slug: z.string(), timezone: z.string() }),
  ),
  limit: z.number().int(),
  offset: z.number().int(),
});
