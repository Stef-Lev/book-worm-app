import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LoginForm from "@/components/pages/login-page/login-form/login-form";
import styles from "./login-page.module.css";

export default async function LoginPage() {
  const t = await getTranslations("pages.login");
  const auth = await getTranslations("auth");

  return (
    <main className={styles.main}>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <LoginForm />
      <p>
        {auth("noAccount")} <Link href="/register">{auth("registerTitle")}</Link>
      </p>
    </main>
  );
}
