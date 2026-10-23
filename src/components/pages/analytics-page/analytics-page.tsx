import { getTranslations } from "next-intl/server";
import { ChartNoAxesCombined } from "lucide-react";
import styles from "./analytics-page.module.css";

export default async function AnalyticsPage() {
  const t = await getTranslations("pages.analytics");

  return (
    <main className={styles.main}>
      <span className={styles.icon}><ChartNoAxesCombined aria-hidden="true" /></span>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </main>
  );
}
