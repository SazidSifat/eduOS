import { randomBytes, randomUUID } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { z } from 'zod';
import { createDatabase, type DatabaseConnection } from './client/index.js';
import { migrateDatabase } from './migrations.js';
import { studentEnrollment } from './schema/academics.js';
import { enrollmentDateChange } from './schema/enrollment-history.js';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !/^eduos_test(?:_[a-z0-9]+)?$/.test(new URL(testUrl).pathname.slice(1)))
  throw new Error('Enrollment migration checks require a dedicated eduos_test database.');
const administrator = new Pool({
  connectionString: testUrl,
  max: 1,
  connectionTimeoutMillis: 3000,
});
const databaseName = `eduos_test_dates${randomBytes(6).toString('hex')}`;
const institutionId = randomUUID();
const studentId = randomUUID();
const offeringId = randomUUID();
const enrollmentId = randomUUID();
let created = false;
let connection: DatabaseConnection | undefined;
let previousMigrations: string | undefined;

beforeAll(async () => {
  await administrator.query(`CREATE DATABASE "${databaseName}"`);
  created = true;
  const url = new URL(testUrl);
  url.pathname = `/${databaseName}`;
  connection = createDatabase(url.toString());
  const folder = fileURLToPath(new URL('../migrations', import.meta.url));
  const journal = z
    .object({
      entries: z.array(
        z
          .object({
            idx: z.number().int(),
            tag: z.string().regex(/^\d{4}_[a-z0-9_]+$/),
          })
          .passthrough(),
      ),
    })
    .passthrough()
    .parse(JSON.parse(await readFile(join(folder, 'meta/_journal.json'), 'utf8')));
  const target = journal.entries.find((entry) => entry.tag === '0009_enrollment_dates');
  if (!target) throw new Error('Enrollment dates migration missing');
  const entries = journal.entries.filter((entry) => entry.idx < target.idx);
  previousMigrations = await mkdtemp(join(tmpdir(), 'eduos-before-dates-'));
  await mkdir(join(previousMigrations, 'meta'));
  for (const entry of entries)
    await copyFile(join(folder, `${entry.tag}.sql`), join(previousMigrations, `${entry.tag}.sql`));
  await writeFile(
    join(previousMigrations, 'meta/_journal.json'),
    JSON.stringify({ ...journal, entries }),
  );
  await migrate(connection.db, { migrationsFolder: previousMigrations });
  await connection.pool.query('INSERT INTO institution (id, name, slug) VALUES ($1, $2, $3)', [
    institutionId,
    'Synthetic legacy school',
    `dates-${institutionId}`,
  ]);
  await connection.pool.query(
    'INSERT INTO student (id, institution_id, name, profile) VALUES ($1, $2, $3, $4)',
    [studentId, institutionId, 'Synthetic legacy student', '{}'],
  );
  await connection.pool.query(
    'INSERT INTO academic_offering (id, institution_id, session, class_name) VALUES ($1, $2, $3, $4)',
    [offeringId, institutionId, '2026', 'Class 6'],
  );
  await connection.pool.query(
    'INSERT INTO student_enrollment (id, institution_id, student_id, offering_id, session, section) VALUES ($1, $2, $3, $4, $5, $6)',
    [enrollmentId, institutionId, studentId, offeringId, '2026', 'A'],
  );
});

afterAll(async () => {
  try {
    await connection?.close();
    // Only this suite's freshly created child database is removed.
    if (created) await administrator.query(`DROP DATABASE "${databaseName}"`);
  } finally {
    await administrator.end();
    if (previousMigrations) await rm(previousMigrations, { recursive: true, force: true });
  }
});

it('upgrades and reapplies without inventing dates or altering existing enrollment identity', async () => {
  if (!connection) throw new Error('Synthetic migration database missing');
  await migrateDatabase(connection.db);
  const expected = [
    {
      id: enrollmentId,
      institutionId,
      studentId,
      offeringId,
      session: '2026',
      section: 'A',
      startsOn: null,
      endsOn: null,
    },
  ];
  expect(await connection.db.select().from(studentEnrollment)).toEqual(expected);
  expect(await connection.db.select().from(enrollmentDateChange)).toEqual([]);
  await migrateDatabase(connection.db);
  expect(await connection.db.select().from(studentEnrollment)).toEqual(expected);
});
