import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'apps/api/**/*.integration.test.ts',
      'packages/database/src/**/*.integration.test.ts',
    ],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
