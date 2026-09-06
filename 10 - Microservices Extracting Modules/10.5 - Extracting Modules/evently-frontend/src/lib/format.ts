const DAY = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});

const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const TIME = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const SHORT_DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const LONG_DATE_TIME = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC',
});

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDay(value: string | Date): string {
  return DAY.format(toDate(value));
}

export function formatDateTimeUtc(value: string | Date): string {
  return `${DATE_TIME.format(toDate(value))} UTC`;
}

export function formatShortDateTime(value: string | Date): string {
  return SHORT_DATE_TIME.format(toDate(value));
}

/** e.g. "Sep 20, 2026, 08:26 AM UTC" — for event cards / headers. */
export function formatLongDateTimeUtc(value: string | Date): string {
  return `${LONG_DATE_TIME.format(toDate(value))} UTC`;
}

export function formatTimeUtc(value: string | Date): string {
  return `${TIME.format(toDate(value))} UTC`;
}

export function formatEventWindow(startsAtUtc: string, endsAtUtc?: string | null): string {
  const start = formatDateTimeUtc(startsAtUtc);
  if (!endsAtUtc) return start;
  return `${start} → ${formatTimeUtc(endsAtUtc)}`;
}

export function formatMoney(amount: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatMoneyParts(amount: number, currency = 'EUR'): { value: string; currency: string } {
  return { value: amount.toFixed(2), currency };
}
