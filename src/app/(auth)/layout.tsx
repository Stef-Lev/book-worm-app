import { redirect } from "next/navigation";
import { auth } from "@/auth";
import PreferencesSwitcher from "@/components/preferences-switcher/preferences-switcher";
import { getTheme } from "@/lib/get-theme";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <>
      <PreferencesSwitcher theme={await getTheme()} />
      {children}
    </>
  );
}
