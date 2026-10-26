import Link from "@/components/navigation-link/navigation-link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import LogoutButton from "@/components/logout-button/logout-button";
import PreferencesSwitcher from "@/components/preferences-switcher/preferences-switcher";
import styles from "./app-header.module.css";
import type { AppHeaderProps } from "./app-header.types";

export default async function AppHeader({ theme }: AppHeaderProps) {
  const t = await getTranslations("nav");

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <Image
          src="/bookworm-logo.svg"
          alt=""
          width={56}
          height={56}
          className={styles.logoMark}
        />
        Bookworm
      </Link>
      <nav className={styles.nav}>
        <Link href="/library">{t("library")}</Link>
        <Link href="/search">{t("searchLabel")}</Link>
        <Link href="/analytics">{t("analytics")}</Link>
      </nav>
      <div className={styles.account}>
        <PreferencesSwitcher theme={theme} />
        <LogoutButton />
      </div>
    </header>
  );
}
