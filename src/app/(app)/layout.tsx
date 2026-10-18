import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppHeader from "@/components/app-header/app-header";
import { getTheme } from "@/lib/get-theme";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <AppHeader userName={session.user.name ?? ""} theme={await getTheme()} />
      {children}
    </>
  );
}
