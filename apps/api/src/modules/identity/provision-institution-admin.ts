import { randomUUID } from 'node:crypto';
import { hashPassword } from '@eduos/auth/server';
import type { DatabaseTransaction } from '@eduos/database';
import { account, membership, user } from '@eduos/database/schema';
import { ProvisioningConflict } from '../../lib/errors.js';

// The platform caller owns authorization and the surrounding creation transaction.
export async function provisionInstitutionAdmin(
  tx: DatabaseTransaction,
  institutionId: string,
  input: { name: string; email: string; password: string },
) {
  const [created] = await tx
    .insert(user)
    .values({ id: randomUUID(), name: input.name, email: input.email.toLowerCase() })
    .onConflictDoNothing({ target: user.email })
    .returning({ id: user.id });
  if (!created) throw new ProvisioningConflict('ADMIN_EMAIL_TAKEN');
  await tx.insert(account).values({
    id: randomUUID(),
    accountId: created.id,
    userId: created.id,
    providerId: 'credential',
    password: await hashPassword(input.password),
  });
  await tx.insert(membership).values({
    institutionId,
    userId: created.id,
    role: 'admin',
    active: true,
  });
  return created.id;
}
