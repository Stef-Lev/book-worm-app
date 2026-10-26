import type { BookCollection } from "@/components/book-entry/book-entry.types";

export type CollectionsDialogProps = {
  collections: BookCollection[];
  onChange: (collections: BookCollection[]) => void;
  onDeleted: (id: string) => void;
  disabled?: boolean;
};
