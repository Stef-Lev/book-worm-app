import BookLibrary from "@/components/book-library/book-library";
import type { SearchPageProps } from "./search-page.types";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const initialQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  return <BookLibrary mode="search" initialQuery={initialQuery} />;
}
