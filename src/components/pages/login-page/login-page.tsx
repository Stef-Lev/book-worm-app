import Link from "next/link";
import { getTranslations } from "next-intl/server";
import AuthPageShell from "@/components/auth-page-shell/auth-page-shell";
import LoginForm from "@/components/pages/login-page/login-form/login-form";

export default async function LoginPage() {
  const t = await getTranslations("pages.login");
  const auth = await getTranslations("auth");

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      footer={
        <>
          {auth("noAccount")}{" "}
          <Link href="/register">{auth("registerTitle")}</Link>
        </>
      }
    >
      <LoginForm />
    </AuthPageShell>
  );
}
