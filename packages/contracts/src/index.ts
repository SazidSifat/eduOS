import { z } from 'zod';
export const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), requestId: z.string() }),
});
export const healthSchema = z.object({ status: z.literal('ok'), service: z.literal('eduos-api') });
export const readySchema = z.object({ status: z.literal('ready') });
export const loginSchema = z.object({ email: z.email(), password: z.string().min(12).max(128) });
export const institutionIdSchema = z.uuid();
export const identitySchema = z.object({ id: z.string(), name: z.string(), email: z.email() });
export const membershipSchema = z.object({ institutionId: institutionIdSchema, name: z.string() });
export const workspaceSchema = z.object({
  institutionId: institutionIdSchema,
  name: z.string(),
  timezone: z.string(),
});
export const membershipsSchema = z.array(membershipSchema);
export type Identity = z.infer<typeof identitySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type Membership = z.infer<typeof membershipSchema>;
