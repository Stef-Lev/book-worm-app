import { LockKeyhole } from "lucide-react";
import { getTranslations } from "next-intl/server";
import StatusPage from "@/components/status-page/status-page";

export default async function UnauthorizedPage() {
  const t = await getTranslations("pages.unauthorized");

  return (
    <StatusPage
      code={401}
      title={t("title")}
      description={t("description")}
      icon={LockKeyhole}
      action={{ href: "/login", label: t("login") }}
    />
  );
}
