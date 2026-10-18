"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, isLocale } from "@/i18n/config";
import { COOKIE_MAX_AGE, THEMES, THEME_COOKIE, isTheme } from "@/lib/preferences";
import styles from "./preferences-switcher.module.css";
import type { PreferencesSwitcherProps } from "./preferences-switcher.types";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export default function PreferencesSwitcher({ theme }: PreferencesSwitcherProps) {
  const t = useTranslations("preferences");
  const locale = useLocale();
  const router = useRouter();
  const [currentTheme, setCurrentTheme] = useState(theme);

  function changeLocale(value: string) {
    if (!isLocale(value)) return;
    setCookie(LOCALE_COOKIE, value);
    document.documentElement.lang = value;
    router.refresh();
  }

  function changeTheme(value: string) {
    if (!isTheme(value)) return;
    setCookie(THEME_COOKIE, value);
    setCurrentTheme(value);
    if (value === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = value;
  }

  return (
    <div className={styles.switcher}>
      <label className={styles.field}>
        <span className={styles.label}>{t("language")}</span>
        <select value={locale} onChange={(e) => changeLocale(e.target.value)} className={styles.select}>
          {LOCALES.map((l) => (
            <option key={l} value={l}>
              {LOCALE_LABELS[l]}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>{t("theme")}</span>
        <select
          value={currentTheme}
          onChange={(e) => changeTheme(e.target.value)}
          className={styles.select}
        >
          {THEMES.map((theme) => (
            <option key={theme} value={theme}>
              {t(theme)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
