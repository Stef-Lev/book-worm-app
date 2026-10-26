import Link from "next/link";
import { getTranslations } from "next-intl/server";
import AuthPageShell from "@/components/auth-page-shell/auth-page-shell";
import RegisterForm from "@/components/pages/register-page/register-form/register-form";

export default async function RegisterPage() {
  const t = await getTranslations("pages.register");
  const auth = await getTranslations("auth");

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      footer={
        <>
          {auth("haveAccount")} <Link href="/login">{auth("loginTitle")}</Link>
        </>
      }
    >
      <RegisterForm />
    </AuthPageShell>
  );
}
