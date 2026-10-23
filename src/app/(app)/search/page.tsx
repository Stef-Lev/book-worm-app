import SearchPage from "@/components/pages/search-page/search-page";

type PageProps = { searchParams: Promise<{ q?: string | string[] }> };

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  return <SearchPage initialQuery={initialQuery} />;
}
