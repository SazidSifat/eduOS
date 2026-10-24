import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5173', colorScheme: 'light', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @eduos/api dev',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter @eduos/admin dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
