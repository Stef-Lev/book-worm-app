import "server-only";
import { cookies } from "next/headers";
import { THEME_COOKIE, isTheme } from "@/lib/preferences";
import type { Theme } from "@/lib/preferences";

export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : "system";
}
