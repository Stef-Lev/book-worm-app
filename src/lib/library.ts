import { isEnumValue } from "@/lib/enums";
import { Shelf } from "@/lib/shelves";

export enum LibraryMode {
  Library = "library",
  Search = "search",
}

export enum LibrarySort {
  Title = "title",
  Author = "author",
  Rating = "rating",
  PageCount = "page-count",
  DateAdded = "date-added",
}

export enum LibraryFilterKey {
  SortBy = "sortBy",
  Shelf = "shelf",
  Author = "author",
  Category = "category",
  Collection = "collection",
}

/** Filters that narrow the list (everything except sorting). */
export type FacetKey = Exclude<LibraryFilterKey, LibraryFilterKey.SortBy>;

export const ALL_SHELVES = "all";
export type ShelfFilter = Shelf[] | string | string[];

export function toShelfFilter(value: unknown): ShelfFilter {
  return isEnumValue(Shelf, value) ? value : ALL_SHELVES;
}

export function toLibrarySort(value: unknown): LibrarySort {
  return isEnumValue(LibrarySort, value) ? value : LibrarySort.Title;
}
