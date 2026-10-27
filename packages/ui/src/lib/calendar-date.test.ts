import { afterEach, describe, expect, it, vi } from 'vitest';
import { calendarDate, calendarValue } from './calendar-date.js';
afterEach(() => vi.unstubAllEnvs());
describe('date-only calendar values', () => {
  it.each(['UTC', 'Asia/Dhaka', 'America/Los_Angeles'])(
    'preserves selected calendar days in %s',
    (timezone) => {
      vi.stubEnv('TZ', timezone);
      for (const value of ['2015-03-10', '2024-02-29', '2026-01-01', '2026-12-31']) {
        const date = calendarDate(value);
        if (!date) throw new Error('Expected a valid calendar date');
        expect(calendarValue(date)).toBe(value);
      }
    },
  );
  it.each([
    '2025-02-29',
    '2026-02-30',
    '2026-13-01',
    '2026-01-00',
    '2026-1-2',
    '2026-01-01T00:00:00Z',
    '',
    null,
    undefined,
  ])('rejects invalid or non-date-only values: %s', (value) => {
    expect(calendarDate(value)).toBeUndefined();
  });
});
