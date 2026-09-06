import { describe, expect, it } from 'vitest';
import { formatEventWindow, formatMoney, formatDay } from './format';

describe('format', () => {
  it('formats a UTC event window with an end time', () => {
    const out = formatEventWindow('2026-06-12T19:00:00Z', '2026-06-12T23:00:00Z');
    expect(out).toContain('12 Jun');
    expect(out).toContain('19:00 UTC');
    expect(out).toContain('→ 23:00 UTC');
  });

  it('formats a UTC event window without an end time', () => {
    const out = formatEventWindow('2026-06-12T19:00:00Z');
    expect(out).toContain('19:00 UTC');
    expect(out).not.toContain('→');
  });

  it('formats money with a currency', () => {
    expect(formatMoney(45, 'EUR')).toMatch(/45\.00/);
  });

  it('formats a day in UTC regardless of local zone', () => {
    // 23:30Z is still the 12th in UTC even where the local clock has rolled over.
    expect(formatDay('2026-06-12T23:30:00Z')).toContain('12 Jun');
  });
});
