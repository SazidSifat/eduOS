import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';
import { hashPassword } from '@eduos/auth/server';
import { createDatabase, eq, inArray, migrateDatabase } from '@eduos/database';
import { account, membership, platformOperator, user } from '@eduos/database/schema';
import { provisionDevelopmentUser } from '../../src/services/identity/provision-user.js';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !/^eduos_test(?:_[a-z0-9]+)?$/.test(new URL(testUrl).pathname.slice(1)))
  throw new Error('TEST_DATABASE_URL must point to a dedicated eduos_test database.');
const connection = createDatabase(testUrl);
const addresses = new Set<string>();

function fixture() {
  const email = `provision-${randomUUID()}@example.test`;
  addresses.add(email);
  return { email, name: 'Provisioning Fixture', password: randomUUID() + randomUUID() };
}

beforeAll(() => migrateDatabase(connection.db));
afterEach(async () => {
  if (addresses.size) await connection.db.delete(user).where(inArray(user.email, [...addresses]));
  addresses.clear();
});
afterAll(() => connection.close());

it('creates identity and credentials without granting institution or platform access', async () => {
  const input = fixture();
  expect(await provisionDevelopmentUser(connection.db, input, hashPassword)).toBe('created');
  const [identity] = await connection.db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, input.email));
  if (!identity) throw new Error('Expected the provisioned identity');
  const credentials = await connection.db
    .select({ id: account.id })
    .from(account)
    .where(eq(account.userId, identity.id));
  expect(credentials).toHaveLength(1);
  expect(
    await connection.db.select().from(membership).where(eq(membership.userId, identity.id)),
  ).toHaveLength(0);
  expect(
    await connection.db
      .select()
      .from(platformOperator)
      .where(eq(platformOperator.userId, identity.id)),
  ).toHaveLength(0);
});

it('preserves an existing password, identity and profile when rerun with different input', async () => {
  const input = fixture();
  await provisionDevelopmentUser(connection.db, input, hashPassword);
  const [before] = await connection.db.select().from(user).where(eq(user.email, input.email));
  if (!before) throw new Error('Expected the original identity');
  const [credential] = await connection.db
    .select()
    .from(account)
    .where(eq(account.userId, before.id));
  if (!credential) throw new Error('Expected original credentials');
  const result = await provisionDevelopmentUser(
    connection.db,
    { ...input, name: 'Changed Fixture', password: randomUUID() + randomUUID() },
    async () => {
      throw new Error('Existing credentials must not be hashed or replaced');
    },
  );
  expect(result).toBe('existing');
  const [after] = await connection.db.select().from(user).where(eq(user.email, input.email));
  const [afterCredential] = await connection.db
    .select()
    .from(account)
    .where(eq(account.userId, before.id));
  expect(after?.id === before.id && after?.name === before.name).toBe(true);
  expect(
    afterCredential?.id === credential.id && afterCredential?.password === credential.password,
  ).toBe(true);
});

it('normalizes email before resolving an existing account', async () => {
  const input = fixture();
  await provisionDevelopmentUser(connection.db, input, hashPassword);
  expect(
    await provisionDevelopmentUser(
      connection.db,
      { ...input, email: input.email.toUpperCase() },
      hashPassword,
    ),
  ).toBe('existing');
  expect(
    await connection.db.select({ id: user.id }).from(user).where(eq(user.email, input.email)),
  ).toHaveLength(1);
});

it('serializes concurrent creation through the unique email constraint', async () => {
  const input = fixture();
  const results = await Promise.all(
    Array.from({ length: 4 }, () => provisionDevelopmentUser(connection.db, input, hashPassword)),
  );
  expect(results.filter((result) => result === 'created')).toHaveLength(1);
  expect(results.filter((result) => result === 'existing')).toHaveLength(3);
  const identities = await connection.db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, input.email));
  expect(identities).toHaveLength(1);
  const identity = identities[0];
  if (!identity) throw new Error('Expected one identity');
  expect(
    await connection.db
      .select({ id: account.id })
      .from(account)
      .where(eq(account.userId, identity.id)),
  ).toHaveLength(1);
});

it('rolls back the identity when credential creation fails', async () => {
  const input = fixture();
  await expect(
    provisionDevelopmentUser(connection.db, input, async () => {
      throw new Error('Synthetic hashing failure');
    }),
  ).rejects.toThrow('Synthetic hashing failure');
  expect(
    await connection.db.select({ id: user.id }).from(user).where(eq(user.email, input.email)),
  ).toHaveLength(0);
});

it('does not attach new credentials to an existing identity without a credential record', async () => {
  const input = fixture();
  const id = randomUUID();
  await connection.db.insert(user).values({ id, email: input.email, name: input.name });
  expect(await provisionDevelopmentUser(connection.db, input, hashPassword)).toBe('existing');
  expect(
    await connection.db.select({ id: account.id }).from(account).where(eq(account.userId, id)),
  ).toHaveLength(0);
});
