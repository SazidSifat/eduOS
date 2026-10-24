import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5174' });

test('shows the sample platform overview in light and dark without API calls', async ({
  page,
}, testInfo) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.method());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Platform overview' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeHidden();
  await expect(page.getByText('Design preview', { exact: true })).toBeVisible();
  await expect(page.getByText('Showing 5 of 8 sample institutions')).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('platform-overview-light.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({
    path: testInfo.outputPath('platform-overview-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(apiRequests).toHaveLength(0);
});

test('searches, sorts, paginates and opens institution profiles', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/institutions');
  await expect(page.getByRole('status')).toContainText('Showing 1–5 of 8');
  await page.getByRole('button', { name: 'Next institution page' }).click();
  await expect(page.getByRole('status')).toContainText('Showing 6–8 of 8');
  await page.getByRole('button', { name: 'Previous institution page' }).click();
  await page.getByLabel('Sort institutions').selectOption('descending');
  await expect(page.locator('tbody tr').first()).toContainText('Uttara Learning School');
  await page.getByLabel('Search institutions').fill('no matching school');
  await expect(page.getByRole('heading', { name: 'No matching institutions' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await page.getByLabel('Search institutions').fill('meghna');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('link', { name: 'View Meghna Model School', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Meghna Model School', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Copy account or institution ID' }).click();
  await expect(page.getByRole('status')).toHaveText('Copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    '10000000-0000-4000-8000-000000000001',
  );
});

test('filters operators and switches to the Manager presentation', async ({ page }, testInfo) => {
  await page.goto('/operators');
  await expect(page.locator('tbody tr')).toHaveCount(5);
  await page.screenshot({
    path: testInfo.outputPath('platform-team.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByLabel('Filter platform role').selectOption('platform_manager');
  await page.getByLabel('Filter operator status').selectOption('inactive');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody tr')).toContainText('Farhana Akter');
  await page.getByRole('link', { name: 'Review Farhana Akter', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Farhana Akter', exact: true })).toBeVisible();
  await page.getByLabel('Preview role').selectOption('platform_manager');
  await expect(page.getByRole('heading', { name: 'Super Admin access required' })).toBeVisible();
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Platform team', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText('farhana@example.test')).toHaveCount(0);
  await page.getByRole('link', { name: 'Browse institutions', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Institutions', exact: true })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(page.getByText('Your platform role', { exact: true })).toBeVisible();
  await expect(page.getByText('Active operators', { exact: true })).toHaveCount(0);
});

test('supports mobile navigation, keyboard focus and a narrow directory', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const navigation = page.getByRole('dialog', { name: 'Platform navigation' });
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link', { name: 'Institutions', exact: true }).click();
  await expect(navigation).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Institutions', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: testInfo.outputPath('platform-institutions-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.keyboard.press('Escape');
  await expect(navigation).not.toBeVisible();
});

test('handles invalid and unknown profile URLs without revealing records', async ({ page }) => {
  await page.goto('/institutions/not-an-id');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.goto('/operators/20000000-0000-4000-8000-000000000099');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});
