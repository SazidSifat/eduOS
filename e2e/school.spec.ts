import { pickDate } from './date-picker.js';
import type { Server } from 'node:http';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { createAdmissionsFixture } from '../apps/api/test/admissions-fixture.js';
import { startFixtureServer } from './fixture-server.js';
import { schoolSnapshotSchema } from '../packages/contracts/src/school-model.js';
const f = createAdmissionsFixture({
  adminUrl: 'http://localhost:5176',
  authBaseUrl: 'http://localhost:4321',
});
let server: Server;
let school: Awaited<ReturnType<typeof f.createSchool>>;
let candidateId: string;
let expenseId = '';
test.beforeAll(async () => {
  await f.setup();
  school = await f.createSchool();
  await f.request(`/api/v1/platform/institutions/${school.data.id}/modules`, 'PUT', {
    enabledModules: ['academics', 'admissions', 'attendance', 'fees'],
  });
  const teacher = await f.addStaff(school.data.id, 'teacher');
  const snapshot = await f.school.snapshot(school.adminId, school.data.id);
  const offering = snapshot.state.offerings.find((o) => o.id === school.offering.id);
  if (!offering) throw new Error('Synthetic class missing');
  await f.school.command(school.adminId, school.data.id, {
    operationKey: crypto.randomUUID(),
    revision: snapshot.revision,
    action: { type: 'offering-save', offering: { ...offering, teacher: teacher.id } },
  });
  const student = await f.createCandidate(school, f.input(school, 'admitted'));
  candidateId = student.candidate.id;
  server = await startFixtureServer((request) => f.app.fetch(request), 4321);
});
test.afterAll(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  await f.cleanup();
});
async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(school.input.firstAdmin.email);
  await page.getByLabel('Password', { exact: true }).fill(school.input.firstAdmin.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/admissions/);
  await expect(page.getByRole('heading', { name: 'Follow-ups', exact: true })).toBeVisible();
}
function pages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? pages(join(dir, e.name)) : e.name === 'page.tsx' ? [join(dir, e.name)] : [],
  );
}
test('every former demo page loads with authenticated API data and no demo reset', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/attendance');
  await expect(page).toHaveURL(/\/login/);
  await login(page);
  const routes = pages('apps/admin/src/app/_school').flatMap((file) => {
    const route = readFileSync(file, 'utf8').match(/createFileRoute\('([^']+)'\)/)?.[1];
    return route && !route.includes('$') ? [route.replace('/_school', '').replace(/\/$/, '')] : [];
  });
  for (const route of routes) {
    await page.goto(`${route}?institutionId=${school.data.id}`);
    await expect(page.getByRole('navigation', { name: 'School navigation' })).toBeVisible();
    await expect(page.locator('.demo-page').getByRole('heading').first()).toBeVisible();
    await expect(page.getByText('School data could not be loaded.', { exact: false })).toHaveCount(
      0,
    );
    await expect(page.getByRole('button', { name: 'Reset demo' })).toHaveCount(0);
  }
  await page.goto(`/admissions/${candidateId}?institutionId=${school.data.id}`);
  await expect(page.getByRole('heading', { name: 'Admission confirmed' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/admissions?institutionId=${school.data.id}`);
  await page.getByRole('button', { name: 'Open school navigation' }).click();
  await expect(page.getByRole('navigation', { name: 'School navigation' })).toBeVisible();
  await page.screenshot({ path: '/tmp/eduos-live-school-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('intake and attendance persist through API saves and reloads', async ({ page }) => {
  await login(page);
  await page.goto(`/admissions/new?institutionId=${school.data.id}`);
  await page.getByLabel('Student name', { exact: false }).fill('Synthetic Browser Enquiry');
  await page.getByRole('combobox', { name: 'Academic session', exact: false }).click();
  await page.getByRole('option', { name: '2027', exact: true }).click();
  await page.getByLabel('Primary guardian', { exact: false }).fill('Synthetic Browser Guardian');
  await page.getByLabel('Guardian phone', { exact: false }).fill('01700000000');
  await page.getByLabel('Residential address', { exact: false }).fill('Synthetic school locality');
  await page.getByRole('button', { name: 'Save follow-up', exact: true }).click();
  await expect(page).toHaveURL(/\/admissions\/[0-9a-f-]{36}/);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Synthetic Browser Enquiry', exact: true }),
  ).toBeVisible();
  await page.goto(`/attendance?institutionId=${school.data.id}`);
  await page.getByRole('button', { name: 'Present', exact: true }).first().click();
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(
    page.getByText('Attendance draft saved to the school record.', { exact: false }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Present', exact: true }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('link', { name: 'Review register', exact: true }).click();
  await page.getByRole('button', { name: 'Submit attendance', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Attendance submitted', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Attendance submitted', exact: true }),
  ).toBeVisible();
});
test('expense evidence, approval and payment use durable records', async ({ page }) => {
  await login(page);
  const base = `/api/v1/institutions/${school.data.id}/school`;
  const response = await f.request(base, 'GET', undefined, school.cookie);
  const snapshot = schoolSnapshotSchema.parse(await response.json());
  const r = await f.request(
    `${base}/commands`,
    'POST',
    {
      operationKey: crypto.randomUUID(),
      revision: snapshot.revision,
      action: { type: 'category-add', category: 'Utilities' },
    },
    school.cookie,
  );
  expect(r.status).toBe(200);
  await page.goto(`/expenses/new?institutionId=${school.data.id}`);
  await page.getByLabel('Description', { exact: false }).fill('Synthetic browser electricity');
  await page.getByLabel('Amount (BDT)', { exact: false }).fill('1250');
  await page.getByLabel('Payee', { exact: false }).fill('Synthetic utility provider');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'synthetic-bill.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nSynthetic browser document'),
  });
  await expect(page.getByText('synthetic-bill.pdf', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Submit for approval', exact: true }).click();
  await expect(page).toHaveURL(/\/expenses\/[0-9a-f-]{36}/);
  expenseId = new URL(page.url()).pathname.split('/')[2] ?? '';
  await page.reload();
  await expect(page.getByRole('link', { name: 'Download evidence', exact: true })).toBeVisible();
  await page.getByLabel('Reviewer note', { exact: false }).fill('Synthetic browser approval');
  await page.getByRole('button', { name: 'Approve expense', exact: true }).click();
  await expect(page.getByText('approved', { exact: true }).first()).toBeVisible();
  await page.goto(`/expenses/${expenseId}/payment?institutionId=${school.data.id}`);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Confirm payment', exact: true }).click();
  await expect(page.getByText('Paid ·', { exact: false }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText('Paid ·', { exact: false }).first()).toBeVisible();
});

test('routine configuration, lesson assignment and publication persist', async ({ page }) => {
  await login(page);
  await page.goto(`/routine/new?institutionId=${school.data.id}`);
  await page.getByLabel('Sunday', { exact: true }).check();
  await page.getByRole('button', { name: 'Add period', exact: true }).click();
  await expect(page.getByText('Period 1', { exact: true })).toBeVisible();
  await pickDate(page, 'Effective from', '2027-01-01');
  await page.getByRole('button', { name: 'Continue to lesson builder', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Class routine', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Add lesson, Sunday period 1', exact: true }).click();
  await page.getByLabel('Subject', { exact: false }).fill('Bangla');
  await page.getByLabel('Room', { exact: false }).fill('Synthetic Room A');
  await page.getByRole('button', { name: 'Save lesson & review', exact: true }).click();
  await expect(page.getByText('Ready to publish', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Publish version \d+$/ }).click();
  await expect(page.getByRole('heading', { name: 'Teacher routine', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Bangla', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: '/tmp/eduos-live-school-desktop.png', fullPage: true });
});

test('attendance uses dated enrollments and keeps the submitted roster after dates expand', async ({
  page,
}) => {
  const input = f.input(school, 'admitted');
  const detail = await f.createCandidate(school, {
    ...input,
    profile: { ...input.profile, studentName: 'Synthetic Late Enrollment' },
  });
  let view = await f.school.snapshot(school.adminId, school.data.id);
  const student = view.students.find((s) => s.id === detail.candidate.studentId);
  if (!student) throw new Error('Synthetic dated enrollment missing');
  const dates = {
    type: 'enrollment-dates',
    enrollmentId: student.enrollmentId,
    startsOn: '2026-01-15',
    endsOn: '2026-01-20',
    reason: 'Synthetic verified dates',
  } as const;
  await f.school.command(school.adminId, school.data.id, {
    operationKey: crypto.randomUUID(),
    revision: view.revision,
    action: dates,
  });
  await login(page);
  await page.goto(`/attendance?institutionId=${school.data.id}`);
  await pickDate(page, 'Register date', '2026-01-14');
  const table = page.getByRole('table', { name: 'Daily class attendance' });
  await expect(table.getByText('Synthetic Late Enrollment', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mark unmarked present', exact: true }).click();
  await page.getByRole('link', { name: 'Review register', exact: true }).click();
  await page.getByRole('button', { name: 'Submit attendance', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Attendance submitted', exact: true }),
  ).toBeVisible();

  // Expanding the dates must not insert this student into an already submitted register.
  view = await f.school.snapshot(school.adminId, school.data.id);
  await f.school.command(school.adminId, school.data.id, {
    operationKey: crypto.randomUUID(),
    revision: view.revision,
    action: { ...dates, startsOn: '2026-01-14' },
  });
  await page.reload();
  await page.goto(`/attendance?institutionId=${school.data.id}`);
  await pickDate(page, 'Register date', '2026-01-14');
  await expect(table.getByText('Synthetic Late Enrollment', { exact: false })).toHaveCount(0);
  await pickDate(page, 'Register date', '2026-01-15');
  await expect(table.getByText('Synthetic Late Enrollment', { exact: false })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.locator('.demo-roster-cards').getByText('Synthetic Late Enrollment', { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: '/tmp/eduos-dated-attendance-mobile.png', fullPage: true });
});

test('academic settings saves, clears and audits enrollment dates', async ({ page }) => {
  const input = f.input(school, 'admitted');
  await f.createCandidate(school, {
    ...input,
    profile: { ...input.profile, studentName: 'Synthetic Enrollment Editor' },
  });
  await page.context().addCookies(
    school.cookie.split('; ').map((cookie) => {
      const separator = cookie.indexOf('=');
      return {
        name: cookie.slice(0, separator),
        value: cookie.slice(separator + 1),
        url: 'http://localhost:5176',
        httpOnly: true,
        sameSite: 'Lax' as const,
      };
    }),
  );
  await page.goto(`/settings/academics?institutionId=${school.data.id}`);
  await page.getByRole('combobox', { name: 'Student enrollment', exact: true }).click();
  await page.getByRole('option', { name: /Synthetic Enrollment Editor/ }).click();
  await page.getByRole('button', { name: 'Save enrollment dates', exact: true }).click();
  await expect(
    page.getByText('Reason for date change is required.', { exact: true }),
  ).toBeVisible();
  await pickDate(page, 'Enrollment start', '2026-01-13');
  await pickDate(page, 'Enrollment end', '2026-01-12');
  const reason = page.getByLabel('Reason for date change', { exact: false });
  await reason.fill('Synthetic register dates verified');
  await page.getByRole('button', { name: 'Save enrollment dates', exact: true }).click();
  await expect(
    page.getByText('The enrollment end must be on or after its start.', { exact: true }),
  ).toBeVisible();
  await expect(reason).toHaveValue('Synthetic register dates verified');
  await pickDate(page, 'Enrollment end', '2026-01-20');
  await page.getByRole('button', { name: 'Save enrollment dates', exact: true }).click();
  const history = page.getByRole('table', { name: 'Enrollment date changes', exact: true });
  await expect(
    history.getByText('Synthetic register dates verified', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Enrollment start', { exact: true })).toHaveText('13 Jan 2026');
  await expect(page.getByLabel('Enrollment end', { exact: true })).toHaveText('20 Jan 2026');
  await page.getByLabel('Enrollment end', { exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Choose a date', exact: true })
    .getByRole('button', { name: 'Clear date', exact: true })
    .click();
  await reason.fill('Synthetic end date returned to unknown');
  await page.getByRole('button', { name: 'Save enrollment dates', exact: true }).click();
  await expect(
    history.getByText('Synthetic end date returned to unknown', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    history.getByText('Synthetic end date returned to unknown', { exact: true }),
  ).toBeVisible();
  await expect(history.getByText('2026-01-13 / Unknown', { exact: true })).toBeVisible();
  await page
    .getByRole('heading', { name: 'Enrollment dates', exact: true })
    .scrollIntoViewIfNeeded();
  const editor = page.locator('section[aria-labelledby="enrollment-dates-heading"]');
  await editor.screenshot({ path: '/tmp/eduos-enrollment-editor-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('heading', { name: 'Enrollment dates', exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole('button', { name: 'Save enrollment dates', exact: true }),
  ).toBeVisible();
  await editor.screenshot({ path: '/tmp/eduos-enrollment-editor-mobile.png' });
  await page.getByRole('button', { name: 'Switch to dark theme', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save enrollment dates', exact: true })).toHaveCSS(
    'color',
    'rgb(16, 41, 30)',
  );
  await expect(page.getByLabel('Enrollment start', { exact: true })).toHaveCSS(
    'color',
    'rgb(237, 246, 239)',
  );
  await editor.screenshot({ path: '/tmp/eduos-enrollment-editor-mobile-dark.png' });
});
