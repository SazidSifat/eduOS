import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5174' });
const schoolId = '10000000-0000-4000-8000-000000000001';

test('creates a sample school and links its profile into the directory', async ({ page }) => {
  await page.goto('/institutions');
  await page.getByRole('link', { name: 'Create school', exact: true }).click();
  await page.getByRole('button', { name: 'Create school', exact: true }).click();
  await expect(page.getByText('Enter the school name.')).toBeVisible();
  await page.getByLabel('School name').fill('Jamuna Preview School');
  await expect(page.getByLabel('School slug')).toHaveValue('jamuna-preview-school');
  await page.getByLabel('Contact name').fill('Rehana Sultana');
  await page.getByLabel('Contact email').fill('office@jamuna.example.test');
  await page.getByRole('button', { name: 'Create school', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Jamuna Preview School', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Not configured', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'All institutions', exact: true }).click();
  await page.getByLabel('Search institutions').fill('jamuna');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody tr')).toContainText('Jamuna Preview School');
});

test('freezes, deactivates and reactivates a sample school with reasons', async ({
  page,
}, testInfo) => {
  await page.goto(`/institutions/${schoolId}`);
  const controls = page.getByRole('region', { name: 'School controls' });
  await controls.getByRole('button', { name: 'Freeze school', exact: true }).click();
  await controls.getByRole('button', { name: 'Confirm freeze' }).click();
  await expect(controls.getByText('Add a short reason for this change.')).toBeVisible();
  await controls
    .getByLabel('Reason for change')
    .fill('School office requested a temporary access review.');
  await controls.getByRole('button', { name: 'Confirm freeze' }).click();
  await expect(controls.getByText('Frozen', { exact: true })).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath('school-frozen.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await controls.getByRole('button', { name: 'Deactivate school', exact: true }).click();
  await controls
    .getByLabel('Reason for change')
    .fill('School office confirmed that onboarding is paused.');
  await controls.getByRole('button', { name: 'Confirm deactivation' }).click();
  await expect(controls.getByText('Inactive', { exact: true })).toBeVisible();
  await controls.getByRole('button', { name: 'Reactivate school', exact: true }).click();
  await controls
    .getByLabel('Reason for change')
    .fill('School office confirmed that access can resume.');
  await controls.getByRole('button', { name: 'Confirm reactivation' }).click();
  await expect(controls.getByText('Active', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'School preview activity' })).toContainText(
    'School marked frozen',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(controls.getByRole('button', { name: 'Freeze school', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: testInfo.outputPath('school-profile-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
});

test('prepares warnings and notices without network delivery', async ({ page }, testInfo) => {
  const apiRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.method());
  });
  await page.goto(`/institutions/${schoolId}`);
  await page.getByRole('button', { name: 'Send warning', exact: true }).click();
  const composer = page.getByRole('form', { name: 'School message composer' });
  await composer.getByLabel('Subject').fill('School profile review required');
  await composer
    .getByLabel('Message', { exact: true })
    .fill('Please contact the platform office to review your school profile.');
  await composer.getByLabel('Channel').selectOption('both');
  await page.screenshot({
    path: testInfo.outputPath('school-warning-composer.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await composer.getByRole('button', { name: 'Save preview message' }).click();
  await expect(page.getByText('Preview message saved. Nothing was delivered.')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'School notice and warning history' }),
  ).toContainText('School profile review required');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'School messages', exact: true })
    .click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody tr')).toContainText('Warning');
  await page.getByRole('button', { name: 'New message' }).click();
  await page.getByRole('combobox', { name: 'School', exact: true }).selectOption(schoolId);
  await page.getByLabel('Subject').fill('School contact details review');
  await page
    .getByLabel('Message', { exact: true })
    .fill('Please confirm the contact email listed in your school profile.');
  await page.getByRole('button', { name: 'Save preview message' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  expect(apiRequests).toHaveLength(0);
});

test('edits a subscription and reflects the settings in the directory', async ({
  page,
}, testInfo) => {
  await page.goto(`/subscriptions/${schoolId}`);
  await page.getByRole('combobox', { name: 'Plan', exact: true }).selectOption('custom');
  await page.getByLabel('Billing cycle').selectOption('annual');
  await page.getByLabel('Amount (BDT)', { exact: true }).fill('48000');
  await page.getByLabel('Subscription status').selectOption('active');
  await page.getByLabel('Renewal / review date').fill('2027-10-24');
  await page.screenshot({
    path: testInfo.outputPath('school-subscription-settings.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Save subscription' }).click();
  await expect(page.getByText('Subscription updated in preview.')).toBeVisible();
  await page.getByRole('link', { name: 'All subscriptions', exact: true }).click();
  await page.getByLabel('Search subscriptions').fill('meghna');
  await expect(page.locator('tbody tr')).toContainText('Custom');
  await expect(page.locator('tbody tr')).toContainText('48,000');
  await expect(page.locator('tbody tr')).toContainText('24 Oct 2027');
  await page.screenshot({
    path: testInfo.outputPath('school-subscriptions.png'),
    fullPage: true,
    animations: 'disabled',
  });
});

test('keeps school-management controls out of the Manager preview', async ({ page }) => {
  await page.goto('/institutions');
  await page.getByLabel('Preview role').selectOption('platform_manager');
  await expect(page.getByRole('link', { name: 'Create school', exact: true })).toHaveCount(0);
  await page.getByRole('link', { name: 'View Meghna Model School', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Freeze school', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Notify school', exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Subscriptions', exact: true }),
  ).toHaveCount(0);
});
