import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
export default defineConfig({
  testDir: '.',
  testMatch: 'school.spec.ts',
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 90000,
  use: {
    baseURL: 'http://localhost:5176',
    trace: 'off',
    colorScheme: 'light',
    channel:
      process.env.PLAYWRIGHT_CHANNEL ??
      (existsSync('/usr/bin/google-chrome') ? 'chrome' : 'chromium'),
    launchOptions: { args: ['--no-sandbox'] },
  },
  webServer: {
    command: 'pnpm --filter @eduos/admin dev --port 5176',
    url: 'http://localhost:5176',
    reuseExistingServer: false,
    env: {
      VITE_API_BASE_URL: 'http://localhost:4321',
      VITE_AUTH_BASE_URL: 'http://localhost:4321',
    },
  },
});
