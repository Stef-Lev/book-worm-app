import type { BookCollection } from "@/components/book-entry/book-entry.types";

/** Dropdown options for collections, led by an "empty" option. */
export function toCollectionOptions(
  collections: BookCollection[],
  emptyLabel: string,
) {
  return [
    { value: "", label: emptyLabel },
    ...collections.map((collection) => ({
      value: collection.id,
      label: collection.name,
    })),
  ];
}
