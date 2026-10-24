import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: ['packages/*/src/**/*.test.ts', 'apps/api/src/**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/dist/**', '**/*.integration.test.ts'],
        },
      },
      { test: { name: 'admin', environment: 'jsdom', include: ['apps/admin/**/*.test.tsx'] } },
    ],
  },
});
