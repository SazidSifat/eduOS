import { loginSchema } from '@eduos/contracts';
import type { Database } from '@eduos/database';
import { account, user } from '@eduos/database/schema';
import { z } from 'zod';

export const provisionUserSchema = loginSchema.extend({ name: z.string().min(1).max(100) });
type ProvisionUserInput = z.infer<typeof provisionUserSchema>;

// Internal CLI operation. The caller must enforce the development-only boundary.
export async function provisionDevelopmentUser(
  db: Database,
  input: ProvisionUserInput,
  hashPassword: (password: string) => Promise<string>,
): Promise<'created' | 'existing'> {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(user)
      .values({ id: crypto.randomUUID(), name: input.name, email: input.email.toLowerCase() })
      .onConflictDoNothing({ target: user.email })
      .returning({ id: user.id });
    // A repeat invocation must never become an implicit credential reset or privilege grant.
    if (!created) return 'existing';

    await tx.insert(account).values({
      id: crypto.randomUUID(),
      accountId: created.id,
      userId: created.id,
      providerId: 'credential',
      password: await hashPassword(input.password),
    });
    return 'created';
  });
}
