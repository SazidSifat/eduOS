import { z } from 'zod';
export * from './platform.js';
export const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), requestId: z.string() }),
});
export const healthSchema = z.object({ status: z.literal('ok'), service: z.literal('eduos-api') });
export const readySchema = z.object({ status: z.literal('ready') });
export const loginSchema = z.object({ email: z.email(), password: z.string().min(12).max(128) });
export const institutionIdSchema = z.uuid();
export const roleSchema = z.enum([
  'admin',
  'principal',
  'admission_officer',
  'accountant',
  'teacher',
]);
export const permissionSchema = z.enum([
  'workspace.read',
  'memberships.read',
  'memberships.manage',
]);
export const roleDefinitionSchema = z.object({
  key: roleSchema,
  name: z.string(),
  permissions: z.array(permissionSchema),
});
export const rolesSchema = z.array(roleDefinitionSchema);
export const accessSchema = z.object({
  institutionId: institutionIdSchema,
  userId: z.uuid(),
  role: roleSchema,
  permissions: z.array(permissionSchema),
});
export const membershipStateSchema = z.strictObject({
  role: roleSchema.nullable(),
  active: z.boolean(),
});
export const memberSchema = membershipStateSchema.extend({ userId: z.uuid() });
export const memberListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100000).default(0),
});
export const membersSchema = z.object({
  items: z.array(memberSchema),
  limit: z.number().int(),
  offset: z.number().int(),
});
export const identitySchema = z.object({ id: z.string(), name: z.string(), email: z.email() });
export const membershipSchema = z.object({
  institutionId: institutionIdSchema,
  name: z.string(),
  role: roleSchema.nullable(),
});
export const workspaceSchema = z.object({
  institutionId: institutionIdSchema,
  name: z.string(),
  timezone: z.string(),
});
export const membershipsSchema = z.array(membershipSchema);
export type Identity = z.infer<typeof identitySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type Membership = z.infer<typeof membershipSchema>;
