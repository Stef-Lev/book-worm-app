import { Suspense } from "react";
import AnalyticsPage from "@/components/pages/analytics-page/analytics-page";
import type { AnalyticsPageProps } from "@/components/pages/analytics-page/analytics-page.types";
import RouteLoading from "@/components/route-loading/route-loading";

export default function Page({ searchParams }: AnalyticsPageProps) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <AnalyticsPage searchParams={searchParams} />
    </Suspense>
  );
}
