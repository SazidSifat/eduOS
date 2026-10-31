// Keep the original day as the anchor: Jan 31 -> Feb 28 -> Mar 31.
export function nextMonthlyDate(anchor: string, current: string): string {
  const original = new Date(`${anchor}T00:00:00.000Z`);
  const due = new Date(`${current}T00:00:00.000Z`);
  const year = due.getUTCFullYear();
  const month = due.getUTCMonth() + 1;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(original.getUTCDate(), lastDay)))
    .toISOString()
    .slice(0, 10);
}
