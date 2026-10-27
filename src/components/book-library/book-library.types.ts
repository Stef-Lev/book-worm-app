import type { LibraryMode } from "@/lib/library";

export type LibraryUrlFilters = {
  q?: string;
  status?: string;
  author?: string;
  category?: string;
  collection?: string;
  sort?: string;
};

export type BookLibraryProps = {
  mode: LibraryMode;
  initialQuery?: string;
  initialFilters?: LibraryUrlFilters;
};
