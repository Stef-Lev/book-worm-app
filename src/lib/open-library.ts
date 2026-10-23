export type CatalogBook = {
  source: "open-library";
  externalId: string;
  isbn?: string;
  title: string;
  authors: string[];
  pageCount: number;
  publishedDate?: string;
  categories: string[];
  coverUrl?: string;
};

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  isbn?: string[];
  number_of_pages_median?: number;
  first_publish_year?: number;
  subject?: string[];
  cover_i?: number;
};

type OpenLibraryResponse = { docs?: OpenLibraryDoc[] };

export async function searchOpenLibrary(query: string): Promise<CatalogBook[]> {
  const params = new URLSearchParams({ limit: "15" });
  if (/^[0-9Xx -]{10,17}$/.test(query)) {
    params.set("isbn", query.replace(/[\s-]/g, ""));
  } else {
    params.set("q", query);
  }

  const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
    headers: { "User-Agent": "Bookworm/1.0 (book catalog search)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Open Library search failed with status ${response.status}`);
  }

  const data = (await response.json()) as OpenLibraryResponse;
  return (data.docs ?? []).flatMap((doc) => {
    if (!doc.key || !doc.title) return [];
    return [{
      source: "open-library" as const,
      externalId: doc.key,
      isbn: doc.isbn?.[0],
      title: doc.title,
      authors: doc.author_name ?? [],
      pageCount: doc.number_of_pages_median ?? 0,
      publishedDate: doc.first_publish_year?.toString(),
      categories: doc.subject?.slice(0, 5) ?? [],
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : undefined,
    }];
  });
}
