import type { LibraryFilterKey } from "@/lib/library";
import type {
  LibraryFilterSection,
  LibraryFilterValues,
} from "@/components/book-library/library-filters-drawer/library-filters-drawer.types";

export type LibraryFiltersSidebarProps = {
  values: LibraryFilterValues;
  defaults: LibraryFilterValues;
  sections: readonly LibraryFilterSection[];
  onChange: (key: LibraryFilterKey, value: string) => void;
  onClear: () => void;
};
