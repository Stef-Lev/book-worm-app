import { getTranslations } from "next-intl/server";
import styles from "./library-page.module.css";

export default async function LibraryPage() {
  const t = await getTranslations("pages.library");

  return (
    <main className={styles.main}>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </main>
  );
}
