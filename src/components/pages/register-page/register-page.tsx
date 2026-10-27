import Link from "@/components/navigation-link/navigation-link";
import { getTranslations } from "next-intl/server";
import AuthPageShell from "@/components/auth-page-shell/auth-page-shell";
import { registerAction } from "@/actions/auth";
import AuthForm from "@/components/auth-form/auth-form";

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
      <AuthForm
        action={registerAction}
        submitLabel={auth("registerSubmit")}
        fields={[
          { label: auth("name"), name: "name", autoComplete: "name" },
          {
            label: auth("email"),
            type: "email",
            name: "email",
            autoComplete: "email",
          },
          {
            label: auth("password"),
            hint: auth("passwordHint"),
            type: "password",
            name: "password",
            minLength: 8,
            autoComplete: "new-password",
          },
        ]}
      />
    </AuthPageShell>
  );
}
