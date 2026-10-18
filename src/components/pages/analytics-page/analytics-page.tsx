import { getTranslations } from "next-intl/server";
import styles from "./analytics-page.module.css";

export default async function AnalyticsPage() {
  const t = await getTranslations("pages.analytics");

  return (
    <main className={styles.main}>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </main>
  );
}
