/**
 * `<input type="datetime-local">` helpers. Every timestamp in Evently is UTC and
 * the forms are labelled "UTC", so we treat the input's wall-clock value as UTC
 * rather than the browser's local zone.
 */

export function toLocalInputValue(iso: string | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}

export function fromLocalInputValue(value: string): string {
  // Interpret the entered value as UTC.
  return new Date(`${value}:00Z`).toISOString();
}
