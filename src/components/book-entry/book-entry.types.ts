export type Shelf = "to-read" | "currently-reading" | "read" | "did-not-finish";

export type BookEntryData = {
  id: string;
  status: Shelf;
  rating: number | null;
  review: string;
  startedAt: string;
  finishedAt: string;
  collectionIds: string[];
  createdAt: string;
  book: {
    id: string;
    source: string;
    title: string;
    authors: string[];
    isbn?: string;
    pageCount: number;
    categories: string[];
    coverUrl?: string;
    publishedDate?: string;
  };
};

export type BookCollection = { id: string; name: string };

export type BookEntryProps = {
  entry: BookEntryData;
  collections: BookCollection[];
  shelfNames: Record<Shelf, string>;
  labels: {
    author: string;
    noAuthor: string;
    rating: string;
    noRating: string;
    review: string;
    startedAt: string;
    finishedAt: string;
    collections: string;
    save: string;
    remove: string;
    saving: string;
    pages: string;
  };
  onChange: (id: string, changes: Partial<BookEntryData>) => void;
  onSave: (entry: BookEntryData) => void;
  onRemove: (entry: BookEntryData) => void;
  busy: boolean;
};
