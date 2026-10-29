import Link from "@/components/navigation-link/navigation-link";
import { getTranslations } from "next-intl/server";
import AuthPageShell from "@/components/auth-page-shell/auth-page-shell";
import { loginAction } from "@/actions/auth";
import AuthForm from "@/components/auth-form/auth-form";

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
      <AuthForm
        action={loginAction}
        submitLabel={auth("loginSubmit")}
        fields={[
          {
            label: auth("email"),
            type: "email",
            name: "email",
            autoComplete: "email",
          },
          {
            label: auth("password"),
            type: "password",
            name: "password",
            autoComplete: "current-password",
          },
        ]}
      />
    </AuthPageShell>
  );
}
