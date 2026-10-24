import { defineConfig } from 'drizzle-kit';
import { loadEnvFile } from 'node:process';
import { z } from 'zod';
loadEnvFile('../../.env');
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/*.ts',
  out: './migrations',
  dbCredentials: { url: z.url().parse(process.env.DATABASE_URL) },
  strict: true,
  verbose: true,
});
