import { createServer, type Server } from 'node:http';
import { randomBytes } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { pickDate } from './date-picker.js';
import { createAdmissionsFixture } from '../apps/api/test/admissions-fixture.js';
const fixture = createAdmissionsFixture({
  adminUrl: 'http://localhost:5175',
  authBaseUrl: 'http://localhost:4311',
});
let server: Server;
let school: Awaited<ReturnType<typeof fixture.createSchool>>;
test.beforeAll(async () => {
  await fixture.setup();
  school = await fixture.createSchool();
  server = createServer((request, response) => {
    void (async () => {
      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers)) {
        if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
      const chunks: Buffer[] = [];
      for await (const chunk of request)
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      const body = Buffer.concat(chunks).toString('utf8');
      const result = await fixture.app.request(`http://localhost:4311${request.url ?? '/'}`, {
        method: request.method ?? 'GET',
        headers,
        ...(body ? { body } : {}),
      });
      response.statusCode = result.status;
      result.headers.forEach((value, key) => {
        if (key !== 'set-cookie') response.setHeader(key, value);
      });
      const cookies = result.headers.getSetCookie();
      if (cookies.length) response.setHeader('set-cookie', cookies);
      response.end(Buffer.from(await result.arrayBuffer()));
    })().catch(() => {
      response.statusCode = 500;
      response.end();
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(4311, '127.0.0.1', resolve);
  });
});
test.afterAll(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  await fixture.cleanup();
});
async function choose(page: Page, label: string, text: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: text, exact: true }).click();
}
async function basicDetails(page: Page, name: string) {
  await choose(page, 'Academic session and class', '2027 · Class 6');
  await page.getByLabel('Student full name').fill(name);
  await page.getByLabel('Primary guardian name').fill('Synthetic Guardian');
  await page.getByLabel('Relationship to student').fill('Father');
  await page.getByLabel('Contact phone').fill('01700000000');
  await page.getByLabel('Address / locality').fill('Synthetic school test area');
}
async function fullDetails(page: Page) {
  await pickDate(page, 'Date of birth', '2015-03-10');
  await page.getByLabel('Student nationality').fill('Bangladeshi');
  await page.getByLabel('Birth certificate number').fill(
    `2015${BigInt(`0x${randomBytes(6).toString('hex')}`)
      .toString()
      .padStart(13, '0')
      .slice(-13)}`,
  );
  await page.getByLabel('Father’s name').fill('Synthetic Father');
  await page.getByLabel('Parent / guardian NID').fill('1234567890');
  await page.getByLabel('Parent / guardian nationality').fill('Bangladeshi');
}
test('real school admission: follow-up, optional willing collection, conversion and responsive views', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(school.input.firstAdmin.email);
  await page.getByLabel('Password', { exact: true }).fill(school.input.firstAdmin.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admissions(?:\\?|$)`));
  await expect(page.getByText('Your workspace', { exact: true })).toHaveCount(0);
  for (const entry of ['/login', '/', '/workspace']) {
    await page.goto(entry);
    await expect(page).toHaveURL(new RegExp(`/admissions(?:\\?|$)`));
  }
  await page.goto(`/institutions/${school.data.id}/admissions`);
  await expect(page.getByRole('heading', { name: 'Follow-ups', exact: true })).toBeVisible();
  const navigation = page.getByRole('navigation', { name: 'School navigation' });
  await expect(
    navigation
      .locator('details')
      .filter({ has: page.locator('summary', { hasText: /^Admissions$/ }) })
      .getByRole('link'),
  ).toHaveCount(4);
  await navigation.locator('summary', { hasText: /^Settings$/ }).click();
  await navigation.getByRole('link', { name: 'Admissions settings', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/institutions/${school.data.id}/settings/admissions`));
  await page.goto(`/institutions/${school.data.id}/admissions/settings`);
  await expect(page).toHaveURL(new RegExp(`/institutions/${school.data.id}/settings/admissions`));
  await page.setViewportSize({ width: 1440, height: 1000 });
  const reminderFields = await Promise.all(
    ['Days before the call date', 'Advance reminder time', 'Reminder time on the call date'].map(
      (name) => page.getByLabel(name).boundingBox(),
    ),
  );
  const [daysField, advanceField, callField] = reminderFields;
  if (!daysField || !advanceField || !callField) throw new Error('Reminder fields must be visible');
  expect(Math.abs(daysField.y - advanceField.y)).toBeLessThan(2);
  expect(Math.abs(daysField.y - callField.y)).toBeLessThan(2);
  expect(callField.x).toBeGreaterThan(advanceField.x);
  const settingsSave = await page
    .getByRole('button', { name: 'Save admissions settings' })
    .boundingBox();
  const className = await page.getByLabel('Class name', { exact: true }).boundingBox();
  if (!settingsSave || !className) throw new Error('Settings footer must be visible');
  expect(settingsSave.y).toBeGreaterThan(className.y + className.height);
  const settingsWidth = await page
    .getByRole('form', { name: 'Admission settings', exact: true })
    .boundingBox();
  const settingsMain = await page.getByRole('main').boundingBox();
  if (!settingsWidth || !settingsMain) throw new Error('Settings form must be visible');
  expect(settingsWidth.width).toBeGreaterThan(settingsMain.width - 100);
  await page.screenshot({
    path: testInfo.outputPath('admission-settings-three-columns.png'),
    fullPage: true,
    animations: 'disabled',
  });
  const creditSwitch = page.getByRole('switch', {
    name: 'Credit the willing fee toward admission',
    exact: true,
  });
  await expect(creditSwitch).toHaveAttribute('data-slot', 'switch');
  await creditSwitch.focus();
  await page.keyboard.press('Space');
  await expect(creditSwitch).toHaveAttribute('aria-checked', 'false');
  await page.keyboard.press('Space');
  await expect(creditSwitch).toHaveAttribute('aria-checked', 'true');
  await page.getByLabel('Days before the call date').fill('2');
  await page.getByRole('button', { name: 'Save admissions settings' }).click();
  await expect
    .poll(async () => {
      return (await fixture.admissions.setup(school.adminId, school.data.id)).settings
        .reminderDaysBefore;
    })
    .toBe(2);
  await page.getByRole('link', { name: 'Follow-ups', exact: true }).click();
  await page.getByRole('link', { name: 'New record', exact: true }).click();
  await basicDetails(page, 'Synthetic Follow-up Student');
  const followUpDate = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
  await pickDate(page, 'Next follow-up date', followUpDate);
  await page.getByRole('button', { name: 'Save record', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Synthetic Follow-up Student', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Record call', exact: true }).click();
  await pickDate(
    page,
    'Next follow-up date',
    new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
  );
  await page
    .getByLabel('Conversation notes')
    .fill('Guardian requested another conversation after reviewing the class schedule.');
  await page.getByRole('button', { name: 'Save outcome', exact: true }).click();
  await expect(page.getByText('call needs time', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mark willing', exact: true }).click();
  await fullDetails(page);
  await expect(
    page.getByRole('switch', { name: 'Collect willing fee now', exact: true }),
  ).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('button', { name: 'Save record', exact: true }).click();
  await expect(page.getByText('No fees have been collected for this record.')).toBeVisible();
  await expect(page.getByText('No call scheduled', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Complete admission', exact: true }).click();
  await page.getByRole('switch', { name: 'Confirm cash received', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm admission', exact: true }).click();
  await expect(page.getByText('admitted', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Willing students', exact: true }).click();
  await page.getByRole('link', { name: 'New record', exact: true }).click();
  await choose(page, 'Entry stage', 'Willing to admit');
  await basicDetails(page, 'Synthetic Willing Student');
  await fullDetails(page);
  await page.getByRole('switch', { name: 'Collect willing fee now', exact: true }).click();
  await page.getByRole('button', { name: 'Save record', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Willing fee', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Complete admission', exact: true }).click();
  await page.getByRole('switch', { name: 'Confirm cash received', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm admission', exact: true }).click();
  await expect(page.getByRole('row')).toHaveCount(3);
  await page.screenshot({
    path: testInfo.outputPath('admission-details.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('link', { name: 'Admitted students', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Synthetic Willing Student', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Synthetic Follow-up Student', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: testInfo.outputPath('admissions-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(
    page.getByRole('link', { name: 'Synthetic Willing Student', exact: true }),
  ).toHaveCSS('color', 'rgb(237, 246, 239)');
  await page.screenshot({
    path: testInfo.outputPath('admissions-mobile-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('link', { name: 'New record', exact: true }).click();
  await expect(page.getByLabel('Student full name')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('admission-form-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('combobox', { name: 'Entry stage', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('option', { name: 'Direct admission', exact: true }).press('Enter');
  await basicDetails(page, 'Synthetic Direct Student');
  await fullDetails(page);
  await page.getByRole('switch', { name: 'Confirm cash received', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm admission', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Synthetic Direct Student', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('admitted', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('opens the full form without a setup screen and saves missing setup inline', async ({
  page,
}, testInfo) => {
  const unconfigured = await fixture.createUnconfiguredSchool();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(unconfigured.input.firstAdmin.email);
  await page.getByLabel('Password', { exact: true }).fill(unconfigured.input.firstAdmin.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/admissions/);
  await page.goto(`/institutions/${unconfigured.data.id}/admissions`);
  await page.getByRole('link', { name: 'New record', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'New admission record', exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Student full name')).toBeVisible();
  await expect(page.getByText('Admissions setup needed', { exact: true })).toHaveCount(0);
  const form = await page
    .getByRole('form', { name: 'Admission record', exact: true })
    .boundingBox();
  const main = await page.getByRole('main').boundingBox();
  if (!form || !main) throw new Error('Admission form must be visible');
  expect(form.width).toBeGreaterThan(main.width - 100);
  const student = await page.getByLabel('Student full name').boundingBox();
  const birthDate = await page.getByLabel('Date of birth').boundingBox();
  const source = await page.getByLabel('Lead source').boundingBox();
  if (!student || !birthDate || !source) throw new Error('Student fields must be visible');
  expect(Math.abs(student.y - birthDate.y)).toBeLessThan(2);
  expect(Math.abs(student.y - source.y)).toBeLessThan(2);
  const save = await page.getByRole('button', { name: 'Save record', exact: true }).boundingBox();
  const notes = await page.getByLabel('Notes', { exact: true }).boundingBox();
  if (!save || !notes) throw new Error('Admission footer must be visible');
  expect(save.y).toBeGreaterThan(notes.y + notes.height);
  await page.getByLabel('Student full name').fill('Synthetic Inline Setup Student');
  await page.screenshot({
    path: testInfo.outputPath('admission-form-three-columns.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Complete school setup', exact: true }).click();
  await page.getByLabel('Optional willing fee (BDT)', { exact: true }).fill('100');
  await page.getByLabel('Admission fee (BDT)', { exact: true }).fill('500');
  await page.getByRole('button', { name: 'Save admissions settings', exact: true }).click();
  await expect(page.getByRole('form', { name: 'Admission settings', exact: true })).toHaveCount(0);
  await page.getByLabel('Academic session', { exact: true }).fill('2027');
  await page.getByLabel('Class name', { exact: true }).fill('Class 6');
  await page.getByRole('button', { name: 'Add class offering', exact: true }).click();
  await expect(page.getByRole('region', { name: 'School setup', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Student full name')).toHaveValue('Synthetic Inline Setup Student');
  await basicDetails(page, 'Synthetic Inline Setup Student');
  await pickDate(
    page,
    'Next follow-up date',
    new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
  );
  await page.getByRole('button', { name: 'Save record', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Synthetic Inline Setup Student', exact: true }),
  ).toBeVisible();
});

test('date pickers support leap days, keyboard selection, clearing and mobile dark mode', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(school.input.firstAdmin.email);
  await page.getByLabel('Password', { exact: true }).fill(school.input.firstAdmin.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('link', { name: 'New record', exact: true }).click();
  const birthDate = page.getByLabel('Date of birth', { exact: false });
  await expect(birthDate).toHaveAttribute('data-slot', 'date-picker');
  await pickDate(page, 'Date of birth', '2024-02-29');
  await birthDate.click();
  const calendar = page.getByRole('dialog', { name: 'Choose a date', exact: true });
  await expect(calendar.locator('button[data-day="2024-02-29"]')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(calendar.locator('button[data-day="2024-02-28"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(calendar).toHaveCount(0);
  await expect(birthDate).toHaveText('28 Feb 2024');
  await expect(birthDate).toBeFocused();
  await birthDate.click();
  await calendar.getByRole('button', { name: 'Clear date', exact: true }).click();
  await expect(birthDate).toHaveText('Pick a date');
  await birthDate.click();
  await page.screenshot({
    path: testInfo.outputPath('date-picker-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.keyboard.press('Escape');
  await expect(birthDate).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await birthDate.click();
  const bounds = await calendar.boundingBox();
  if (!bounds) throw new Error('Date picker must be visible');
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('date-picker-mobile-dark.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.keyboard.press('Escape');
  await expect(birthDate).toBeFocused();
});
