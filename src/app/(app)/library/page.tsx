import { Suspense } from "react";
import LibraryPage from "@/components/pages/library-page/library-page";
import type { LibraryPageProps } from "@/components/pages/library-page/library-page.types";
import RouteLoading from "@/components/route-loading/route-loading";

export default function Page({ searchParams }: LibraryPageProps) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <LibraryPage searchParams={searchParams} />
    </Suspense>
  );
}
