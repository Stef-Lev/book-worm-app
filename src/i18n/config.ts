import { isEnumValue } from "@/lib/enums";

export enum Locale {
  En = "en",
  El = "el",
}

export const DEFAULT_LOCALE = Locale.En;
export const LOCALE_COOKIE = "locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  [Locale.En]: "English",
  [Locale.El]: "Ελληνικά",
};

export function isLocale(value: string | undefined): value is Locale {
  return isEnumValue(Locale, value);
}
