import { randomBytes, randomUUID } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createDatabase, type DatabaseConnection } from './client/index.js';
import { migrateDatabase } from './migrations.js';
import { institution, membership } from './schema/identity.js';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !/^eduos_test(?:_[a-z0-9]+)?$/.test(new URL(testUrl).pathname.slice(1)))
  throw new Error('Institution-code migration checks require a dedicated eduos_test database.');
const administrator = new Pool({
  connectionString: testUrl,
  max: 1,
  connectionTimeoutMillis: 3000,
});
const databaseName = `eduos_test_code${randomBytes(6).toString('hex')}`;
const legacyIds = [randomUUID(), randomUUID()];
const legacyAdminId = randomUUID();
let createdDatabase = false;
let connection: DatabaseConnection | undefined;
let previousMigrations: string | undefined;

function database() {
  if (!connection) throw new Error('Migration test database is not initialized.');
  return connection;
}

beforeAll(async () => {
  // This suite owns a new child test database; it never alters/resets the supplied database.
  await administrator.query(`CREATE DATABASE "${databaseName}"`);
  createdDatabase = true;
  const url = new URL(testUrl);
  url.pathname = `/${databaseName}`;
  connection = createDatabase(url.toString());
  const folder = fileURLToPath(new URL('../migrations', import.meta.url));
  const journal = z
    .object({
      entries: z.array(
        z
          .object({ idx: z.number().int(), tag: z.string().regex(/^\d{4}_[a-z0-9_]+$/) })
          .passthrough(),
      ),
    })
    .passthrough()
    .parse(JSON.parse(await readFile(join(folder, 'meta/_journal.json'), 'utf8')));
  const codeMigration = journal.entries.find((entry) => entry.tag === '0003_institution_code');
  if (!codeMigration) throw new Error('Institution-code migration is missing.');
  const entries = journal.entries.filter((entry) => entry.idx < codeMigration.idx);
  previousMigrations = await mkdtemp(join(tmpdir(), 'eduos-before-codes-'));
  await mkdir(join(previousMigrations, 'meta'));
  for (const entry of entries)
    await copyFile(join(folder, `${entry.tag}.sql`), join(previousMigrations, `${entry.tag}.sql`));
  await writeFile(
    join(previousMigrations, 'meta/_journal.json'),
    JSON.stringify({ ...journal, entries }),
  );
  await migrate(connection.db, { migrationsFolder: previousMigrations });
  for (const [index, id] of legacyIds.entries())
    await connection.pool.query('INSERT INTO institution (id, name, slug) VALUES ($1, $2, $3)', [
      id,
      `Synthetic legacy school ${index}`,
      `legacy-${id}`,
    ]);
  await connection.pool.query('INSERT INTO auth_user (id, name, email) VALUES ($1, $2, $3)', [
    legacyAdminId,
    'Synthetic legacy Admin',
    `${legacyAdminId}@example.test`,
  ]);
  await connection.pool.query(
    'INSERT INTO institution_membership (institution_id, user_id, role) VALUES ($1, $2, $3)',
    [legacyIds[0], legacyAdminId, 'admin'],
  );
  await migrateDatabase(connection.db);
});

afterAll(async () => {
  try {
    await connection?.close();
    // Only the generated child database created by this suite is removed.
    if (createdDatabase) await administrator.query(`DROP DATABASE "${databaseName}"`);
  } finally {
    await administrator.end();
    if (previousMigrations) await rm(previousMigrations, { recursive: true, force: true });
  }
});

describe('institution code migration and allocation', () => {
  it('backfills unique six-digit codes while preserving legacy institutions and memberships', async () => {
    const db = database();
    const before = await db.db
      .select()
      .from(institution)
      .where(inArray(institution.id, legacyIds))
      .orderBy(institution.id);
    expect(before).toHaveLength(2);
    expect(before.every((row) => /^[1-9]\d{5}$/.test(row.code))).toBe(true);
    expect(new Set(before.map((row) => row.code)).size).toBe(2);
    for (const [index, id] of legacyIds.entries())
      expect(before.find((row) => row.id === id)).toMatchObject({
        name: `Synthetic legacy school ${index}`,
        slug: `legacy-${id}`,
        status: 'active',
      });
    expect(await db.db.select().from(membership)).toMatchObject([
      { institutionId: legacyIds[0], userId: legacyAdminId, role: 'admin', active: true },
    ]);
    await migrateDatabase(db.db);
    const after = await db.db
      .select()
      .from(institution)
      .where(inArray(institution.id, legacyIds))
      .orderBy(institution.id);
    expect(after.map((row) => ({ id: row.id, code: row.code }))).toEqual(
      before.map((row) => ({ id: row.id, code: row.code })),
    );
  });

  it('allocates globally unique codes during concurrent inserts', async () => {
    const db = database();
    const codes = await Promise.all(
      Array.from({ length: 12 }, async (_, index) => {
        const [row] = await db.db
          .insert(institution)
          .values({
            name: 'Synthetic concurrent school',
            slug: `${databaseName.replaceAll('_', '-')}-${index}`,
          })
          .returning({ code: institution.code });
        if (!row) throw new Error('Code allocation returned no row.');
        return row.code;
      }),
    );
    expect(codes.every((code) => /^[1-9]\d{5}$/.test(code))).toBe(true);
    expect(new Set(codes).size).toBe(12);
  });

  it('rejects duplicate, malformed and null codes at the database boundary', async () => {
    const db = database();
    const [row] = await db.db.select({ code: institution.code }).from(institution).limit(1);
    if (!row) throw new Error('Code fixture is missing.');
    const insert = (code: string | null) =>
      db.pool.query('INSERT INTO institution (name, slug, code) VALUES ($1, $2, $3)', [
        'Synthetic constraint school',
        `constraint-${randomUUID()}`,
        code,
      ]);
    await expect(insert(row.code)).rejects.toMatchObject({ code: '23505' });
    await expect(insert('12345')).rejects.toMatchObject({ code: '23514' });
    await expect(insert('012345')).rejects.toMatchObject({ code: '23514' });
    await expect(insert(null)).rejects.toMatchObject({ code: '23502' });
  });

  it('stops at six digits without cycling or reusing earlier codes', async () => {
    const db = database();
    await db.pool.query("SELECT setval('institution_code_seq', 999998, false)");
    const insert = () =>
      db.pool.query<{ code: string }>(
        'INSERT INTO institution (name, slug) VALUES ($1, $2) RETURNING code',
        ['Synthetic capacity school', `capacity-${randomUUID()}`],
      );
    expect((await insert()).rows[0]?.code).toBe('999998');
    expect((await insert()).rows[0]?.code).toBe('999999');
    await expect(insert()).rejects.toMatchObject({ code: '2200H' });
  });
});
