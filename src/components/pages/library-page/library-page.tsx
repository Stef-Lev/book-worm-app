import BookLibrary from "@/components/book-library/book-library";
import type { LibraryUrlFilters } from "@/components/book-library/book-library.types";
import { LibraryMode } from "@/lib/library";
import type { LibraryPageProps } from "./library-page.types";

const filterKeys = [
  "q",
  "status",
  "author",
  "category",
  "collection",
  "sort",
] as const;

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const initialFilters: LibraryUrlFilters = {};
  for (const key of filterKeys) {
    const value = params[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first) initialFilters[key] = first;
  }
  return (
    <BookLibrary mode={LibraryMode.Library} initialFilters={initialFilters} />
  );
}
