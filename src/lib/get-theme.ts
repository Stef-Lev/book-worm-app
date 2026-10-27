import "server-only";
import { cookies } from "next/headers";
import { THEME_COOKIE, Theme, isTheme } from "@/lib/preferences";

export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : Theme.System;
}
