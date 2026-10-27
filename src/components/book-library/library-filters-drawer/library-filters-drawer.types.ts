import type { DropdownOption } from "@/components/dropdown/dropdown.types";

export type LibraryFilterValues = {
  shelf: string;
  author: string;
  category: string;
  collection: string;
  sortBy: string;
};

export type LibraryFilterKey = keyof LibraryFilterValues;

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
