import { isEnumValue } from "@/lib/enums";

export enum Theme {
  System = "system",
  Light = "light",
  Dark = "dark",
}

export const THEME_COOKIE = "theme";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: string | undefined): value is Theme {
  return isEnumValue(Theme, value);
}
