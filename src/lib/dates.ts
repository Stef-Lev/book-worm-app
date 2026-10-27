import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarYears,
} from "date-fns";
import type { Locale } from "@/i18n/config";

/** Formats a date as `YYYY-MM-DD` (UTC), the format used by date inputs and the API. */
export function toDateOnly(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Relative label for a date: "today", "yesterday", "3 days ago", "last month"...
 * Wording comes from Intl, so it follows the locale. Pass `now` for tests.
 */
export function relativeDate(
  date: Date,
  locale: Locale,
  now: Date = new Date(),
): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const days = differenceInCalendarDays(date, now);
  if (Math.abs(days) < 7) return rtf.format(days, "day");

  const months = differenceInCalendarMonths(date, now);
  if (months === 0) return rtf.format(Math.trunc(days / 7), "week");

  const years = differenceInCalendarYears(date, now);
  if (Math.abs(months) < 12) return rtf.format(months, "month");
  return rtf.format(years, "year");
}
