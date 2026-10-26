"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import IconButton from "@/components/icon-button/icon-button";
import { LOCALE_COOKIE, LOCALE_LABELS } from "@/i18n/config";
import { COOKIE_MAX_AGE, THEME_COOKIE } from "@/lib/preferences";
import { cn } from "@/lib/cn";
import styles from "./preferences-switcher.module.css";
import type { PreferencesSwitcherProps } from "./preferences-switcher.types";

function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSystemDark() {
  return false;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export default function PreferencesSwitcher({
  theme,
}: PreferencesSwitcherProps) {
  const t = useTranslations("preferences");
  const locale = useLocale();
  const router = useRouter();
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [isPending, startTransition] = useTransition();
  const systemDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemDark,
    getServerSystemDark,
  );
  const isDark =
    currentTheme === "dark" || (currentTheme === "system" && systemDark);
  const nextLocale = locale === "en" ? "el" : "en";
  const nextTheme = isDark ? "light" : "dark";
  const languageTitle = t("switchLanguage", {
    language: LOCALE_LABELS[nextLocale],
  });

  function toggleLocale() {
    setCookie(LOCALE_COOKIE, nextLocale);
    document.documentElement.lang = nextLocale;
    startTransition(() => router.refresh());
  }

  function toggleTheme() {
    setCookie(THEME_COOKIE, nextTheme);
    setCurrentTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

  return (
    <div className={styles.switcher}>
      <IconButton
        label={languageTitle}
        onClick={toggleLocale}
        disabled={isPending}
        aria-busy={isPending}
      >
        <span
          className={cn(
            styles.flag,
            locale === "el" ? styles.greece : styles.england,
          )}
          aria-hidden="true"
        />
      </IconButton>
      <IconButton
        label={t("darkMode")}
        onClick={toggleTheme}
        aria-pressed={isDark}
        title={t("switchTheme", { theme: t(nextTheme) })}
      >
        {isDark ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
      </IconButton>
    </div>
  );
}
