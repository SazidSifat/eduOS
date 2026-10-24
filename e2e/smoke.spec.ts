import { test, expect } from '@playwright/test';
test('opens sign-in directly, validates credentials and switches themes', async ({
  page,
}, testInfo) => {
  const session = page.waitForResponse((response) => response.url().endsWith('/api/v1/me'));
  await page.goto('/');
  expect((await session).status()).toBe(401);
  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.getByRole('heading', { name: 'Sign in to EduOS' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open workspace' })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath('login-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByLabel('Email')).toHaveCSS('background-color', 'rgb(25, 27, 25)');
  await page.screenshot({
    path: testInfo.outputPath('login-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
});

test('protects a direct workspace visit with a real session check', async ({ page }) => {
  await page.goto('/workspace');
  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.getByLabel('Email')).toBeVisible();
});

test('keeps sign-in usable on a narrow screen with reduced motion', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in to EduOS' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath('login-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('follows system appearance changes until a theme is explicitly chosen', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/login');
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('keeps a failed session check visible and allows a retry', async ({ page }) => {
  let failed = false;
  await page.route('**/api/v1/me', async (route) => {
    if (failed) return route.continue();
    failed = true;
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 'UNAVAILABLE', message: 'Try again.', requestId: 'synthetic-request' },
      }),
    });
  });
  await page.goto('/login');
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Something went wrong. Please try again.',
  );
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to EduOS' })).toBeVisible();
});
