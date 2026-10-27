export type LibraryUrlFilters = {
  q?: string;
  status?: string;
  author?: string;
  category?: string;
  collection?: string;
  sort?: string;
};

export type BookLibraryProps = {
  mode: "library" | "search";
  initialQuery?: string;
  initialFilters?: LibraryUrlFilters;
};
