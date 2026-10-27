import { BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import StatusPage from "@/components/status-page/status-page";

export default async function NotFoundPage() {
  const t = await getTranslations("pages.notFound");

  return (
    <StatusPage
      code={404}
      title={t("title")}
      description={t("description")}
      icon={BookOpen}
      action={{ href: "/", label: t("backHome") }}
    />
  );
}
