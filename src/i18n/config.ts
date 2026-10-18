export const LOCALES = ["en", "el"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export const LOCALE_LABELS: Record<Locale, string> = { en: "English", el: "Ελληνικά" };

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.some((l) => l === value);
}
