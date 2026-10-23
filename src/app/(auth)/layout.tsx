import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import PreferencesSwitcher from "@/components/preferences-switcher/preferences-switcher";
import { getTheme } from "@/lib/get-theme";
import styles from "./layout.module.css";
import RouteLoading from "@/components/route-loading/route-loading";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AccountLayout>{children}</AccountLayout>
    </Suspense>
  );
}

async function AccountLayout({ children }: Pick<LayoutProps<"/">, "children">) {
  await connection();
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <>
      <div className={styles.preferences}>
        <PreferencesSwitcher theme={await getTheme()} />
      </div>
      {children}
    </>
  );
}
import { Suspense } from "react";
