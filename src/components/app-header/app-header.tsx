import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import LogoutButton from "@/components/logout-button/logout-button";
import PreferencesSwitcher from "@/components/preferences-switcher/preferences-switcher";
import styles from "./app-header.module.css";
import type { AppHeaderProps } from "./app-header.types";

export default async function AppHeader({ userName, theme }: AppHeaderProps) {
  const t = await getTranslations("nav");

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <span className={styles.logoMark}>
          <BookOpen aria-hidden="true" />
        </span>
        Bookworm
      </Link>
      <form action="/search" role="search" className={styles.search}>
        <Search className={styles.searchIcon} aria-hidden="true" />
        <input
          type="search"
          name="q"
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className={styles.input}
        />
      </form>
      <nav className={styles.nav}>
        <Link href="/library">{t("library")}</Link>
        <Link href="/analytics">{t("analytics")}</Link>
        <div className={styles.account}>
          <PreferencesSwitcher theme={theme} />
          <LogoutButton />
          <span className={styles.user} title={userName}>
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
      </nav>
    </header>
  );
}
