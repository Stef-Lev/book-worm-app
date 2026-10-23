import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import RegisterForm from "@/components/pages/register-page/register-form/register-form";
import styles from "./register-page.module.css";

export default async function RegisterPage() {
  const t = await getTranslations("pages.register");
  const auth = await getTranslations("auth");

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.brand}><BookOpen aria-hidden="true" />Bookworm</Link>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <RegisterForm />
      <p>
        {auth("haveAccount")} <Link href="/login">{auth("loginTitle")}</Link>
      </p>
    </main>
  );
}
