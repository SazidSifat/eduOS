import { test, expect } from '@playwright/test';

test('redirects a stubbed signed-in identity from login and root to the application access screen', async ({
  page,
}) => {
  await page.route('**/api/v1/me', (route) =>
    route.fulfill({
      json: { id: 'synthetic-user', name: 'Sample Teacher', email: 'teacher@example.test' },
    }),
  );
  await page.route('**/api/v1/memberships', (route) => route.fulfill({ json: [] }));
  await page.goto('/login');
  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(page.getByRole('heading', { name: 'No school access' })).toBeVisible();
  await expect(page.getByText(/Your account has no active school role/)).toBeVisible();
  await page.goto('/');
  await expect(page).toHaveURL(/\/app\/?$/);
});

test('keeps the auth shell visible while the session request is pending', async ({ page }) => {
  let release: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/v1/me', async (route) => {
    await pending;
    await route.continue();
  });
  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('main').getByText('Checking your session…')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign in to EduOS' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(0);
  } finally {
    release?.();
  }
  await expect(page.getByLabel('Email')).toBeVisible();
});

// Preserve the English workflow while the app also supports Bangla by default.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('eduos-language', 'en'));
});
