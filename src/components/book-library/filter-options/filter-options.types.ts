import type { LibraryFilterSection } from "@/components/book-library/library-filters-drawer/library-filters-drawer.types";

export type FilterOptionsProps = {
  section: LibraryFilterSection;
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  hideLabel?: boolean;
};
