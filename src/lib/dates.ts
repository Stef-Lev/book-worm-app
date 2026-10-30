/** Formats a date as `YYYY-MM-DD` (UTC), the format used by date inputs and the API. */
export function toDateOnly(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
