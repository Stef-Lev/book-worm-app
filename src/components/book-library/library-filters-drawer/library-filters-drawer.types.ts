import type { DropdownOption } from "@/components/dropdown/dropdown.types";
import type { LibraryFilterKey } from "@/lib/library";

export type LibraryFilterValues = Record<LibraryFilterKey, string>;

export type LibraryFilterSection = {
  key: LibraryFilterKey;
  label: string;
  options: readonly DropdownOption[];
};

export type LibraryFiltersDrawerProps = {
  values: LibraryFilterValues;
  defaults: LibraryFilterValues;
  sections: readonly LibraryFilterSection[];
  onApply: (values: LibraryFilterValues) => void;
  disabled?: boolean;
};
