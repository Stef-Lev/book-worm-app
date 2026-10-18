import { getTranslations } from "next-intl/server";
import styles from "./search-page.module.css";

export default async function SearchPage() {
  const t = await getTranslations("pages.search");

  return (
    <main className={styles.main}>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </main>
  );
}
