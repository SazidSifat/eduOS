import { expect, type Page } from '@playwright/test';

export async function pickDate(page: Page, label: string, value: string) {
  const [year, month] = value.split('-');
  if (!year || !month) throw new Error('Use a date-only test value');
  await page.getByLabel(label, { exact: false }).click();
  const calendar = page.getByRole('dialog', { name: 'Choose a date', exact: true });
  await expect(calendar).toBeVisible();
  await calendar.getByRole('combobox', { name: 'Year', exact: true }).click();
  await page.getByRole('option', { name: year, exact: true }).click();
  await calendar.getByRole('combobox', { name: 'Month', exact: true }).click();
  const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(
    new Date(Number(year), Number(month) - 1, 1),
  );
  await page.getByRole('option', { name: monthName, exact: true }).click();
  await calendar.locator(`button[data-day="${value}"]`).click();
  await expect(calendar).toHaveCount(0);
  const display = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
  await expect(page.getByLabel(label, { exact: false })).toHaveText(display);
}
