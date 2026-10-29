export type BookDetailsDialogProps = {
  entry: {
    id: string;
    book: {
      title: string;
      authors: string[];
      isbn?: string;
      pageCount: number;
      coverUrl?: string;
    };
    bookOverrides?: {
      title?: string;
      authors?: string[];
      isbn?: string;
      pageCount?: number;
      coverUrl?: string;
    };
  };
  labels: {
    editBookDetails: string;
    title: string;
    authors: string;
    isbn: string;
    pageCount: string;
    coverUrl: string;
    addAuthor: string;
    pages: string;
    save: string;
    cancel: string;
    close: string;
  };
  onSave: (bookOverrides: Record<string, unknown>) => void;
  busy: boolean;
  asIconButton?: boolean;
};
