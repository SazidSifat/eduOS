import { test, expect } from '@playwright/test';
test('connects to the API, protects the workspace and switches themes', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A clear space for your school.' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Connected to EduOS');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByRole('link', { name: 'Open workspace' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Email')).toBeVisible();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
});
