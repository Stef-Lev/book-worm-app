import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import PreferencesSwitcher from "@/components/preferences-switcher/preferences-switcher";
import { getTheme } from "@/lib/get-theme";
import ResetPasswordPage from "@/components/pages/reset-password-page/reset-password-page";
import RouteLoading from "@/components/route-loading/route-loading";
import styles from "@/app/(auth)/layout.module.css";

export default function ResetPasswordLayout() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AccountLayout />
    </Suspense>
  );
}

async function AccountLayout() {
  await connection();
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <>
      <div className={styles.preferences}>
        <PreferencesSwitcher theme={await getTheme()} />
      </div>
      <ResetPasswordPage />
    </>
  );
}
