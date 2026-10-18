import { getTranslations } from "next-intl/server";
import styles from "./home-page.module.css";

export default async function HomePage() {
  const t = await getTranslations("pages.home");

  return (
    <main className={styles.main}>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </main>
  );
}
