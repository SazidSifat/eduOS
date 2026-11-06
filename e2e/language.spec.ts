import { test, expect } from '@playwright/test';

test('admin switches language immediately, preserves entered data and remembers the choice', async ({
  page,
}, testInfo) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'EduOS-এ লগইন করুন' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
  const email = page.getByLabel('ইমেইল');
  await expect(email).toHaveCSS('font-size', '16px');
  await email.fill('teacher@example.test');
  await page.getByRole('button', { name: 'লগইন', exact: true }).click();
  await expect(page.getByText('১২–১২৮ অক্ষর ব্যবহার করুন।')).toBeVisible();
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to EduOS' })).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveValue('teacher@example.test');
  await expect(page.getByText('Use 12–128 characters.')).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Sign in to EduOS' })).toBeVisible();
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'EduOS-এ লগইন করুন' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('admin-bangla-desktop.png'), fullPage: true });
});

test('larger Bangla controls fit a narrow screen in both themes', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'EduOS-এ লগইন করুন' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'লগইন', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'মূল অংশে যান' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('button', { name: 'গাঢ় থিম ব্যবহার করুন' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({
    path: testInfo.outputPath('admin-bangla-mobile-dark.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to EduOS' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
