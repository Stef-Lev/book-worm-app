import type { LibraryFilterKey } from "@/lib/library";
import type { LibraryFilterSection, LibraryFilterValues } from "@/components/book-library/library-filters-drawer/library-filters-drawer.types";

export type SelectedFiltersPillsProps = {
  values: LibraryFilterValues;
  defaults: LibraryFilterValues;
  sections: readonly LibraryFilterSection[];
  onRemoveFilter: (key: LibraryFilterKey) => void;
  onRemoveFilterValue?: (key: LibraryFilterKey, value: string) => void;
  onClearAll: () => void;
};
