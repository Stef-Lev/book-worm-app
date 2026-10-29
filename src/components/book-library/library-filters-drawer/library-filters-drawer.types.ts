import type { DropdownOption } from "@/components/dropdown/dropdown.types";
import type { LibraryFilterKey } from "@/lib/library";

export type LibraryFilterValues = Record<LibraryFilterKey, string | string[]>;

export type LibraryFilterSection = {
  key: LibraryFilterKey;
  label: string;
  options: readonly DropdownOption[];
  multiSelect?: boolean;
};

export type LibraryFiltersDrawerProps = {
  values: LibraryFilterValues;
  defaults: LibraryFilterValues;
  sections: readonly LibraryFilterSection[];
  onApply: (values: LibraryFilterValues) => void;
  disabled?: boolean;
  resultCount?: number;
  getResultCount?: (filters: LibraryFilterValues) => number;
};
