import { Suspense } from "react";
import SearchPage from "@/components/pages/search-page/search-page";
import type { SearchPageProps } from "@/components/pages/search-page/search-page.types";
import RouteLoading from "@/components/route-loading/route-loading";

export default function Page({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <SearchPage searchParams={searchParams} />
    </Suspense>
  );
}
