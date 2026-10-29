import { cacheLife } from "next/cache";
import { BookSource } from "@/lib/book-source";

export type CatalogBook = {
  source: BookSource.Bookshark;
  externalId: string;
  isbn?: string;
  title: string;
  authors: string[];
  pageCount: number;
  publishedDate?: string;
  categories: string[];
  coverUrl?: string;
};

type BooksharkAuthor = {
  name: string;
  b_id?: string;
};

type BooksharkCategory = {
  name: string;
  ddc?: string;
  b_id?: string;
};

type BooksharkDoc = {
  title?: string;
  subtitle?: string;
  author?: BooksharkAuthor[];
  publisher?: { name?: string; text?: string };
  isbn?: string;
  isbn_13?: string;
  publication_year?: string | number;
  pages?: string | number;
  physical_description?: {
    pages?: string | number;
  };
  category?: BooksharkCategory[];
  image?: string;
  b_id?: string;
};

type BooksharkResponse = { book?: BooksharkDoc[] };

/**
 * Detect if text contains Greek characters
 */
function isGreekText(text: string): boolean {
  // Greek Unicode range: 0x370–0x3FF
  return /[\u0370-\u03FF]/.test(text);
}

/**
 * Search BookShark for Greek books
 * BookShark is specialized for Greek language books and works without an API key
 * Gracefully degrades if BookShark is unavailable
 */
export async function searchBookshark(query: string): Promise<CatalogBook[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery || normalizedQuery.length < 2) {
    return [];
  }

  // Check if it looks like an ISBN
  const normalizedIsbn = normalizedQuery
    .replace(/^ISBN(?:-1[03])?\s*:?\s*/i, "")
    .replace(/[\s\u2010-\u2015-]/g, "")
    .toUpperCase();

  if (/^(?:\d{9}[\dX]|\d{13})$/.test(normalizedIsbn)) {
    return searchBooksharkByCached("isbn", normalizedIsbn);
  }

  // For text search, only prioritize if it's Greek
  // For non-Greek text, we'll still search but Open Library will be preferred
  return searchBooksharkByCached("query", normalizedQuery);
}

async function searchBooksharkByCached(
  type: "isbn" | "query",
  value: string,
): Promise<CatalogBook[]> {
  "use cache";
  cacheLife("hours");

  try {
    const params = new URLSearchParams();

    if (type === "isbn") {
      params.set("isbn", value);
    } else {
      // BookShark search supports title, author, publisher parameters
      // For simplicity, we'll search by title as it's the primary search field
      params.set("title", value);
    }

    const response = await fetch(
      `http://bookshark.bibliography.gr/api/v1/${type === "isbn" ? "book" : "search"}?${params.toString()}`,
      {
        headers: {
          "User-Agent": "BookWorm/1.0 (book catalog search)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      console.warn(
        `BookShark search failed with status ${response.status}`,
      );
      return [];
    }

    const data = (await response.json()) as BooksharkResponse;
    return (data.book ?? [])
      .map((doc) => {
        if (!doc.title || !doc.b_id) return null;

        const pageCount =
          (typeof doc.pages === "number"
            ? doc.pages
            : typeof doc.pages === "string"
              ? parseInt(doc.pages, 10)
              : null) ||
          (typeof doc.physical_description?.pages === "number"
            ? doc.physical_description.pages
            : typeof doc.physical_description?.pages === "string"
              ? parseInt(doc.physical_description.pages, 10)
              : null) ||
          0;

        return {
          source: BookSource.Bookshark,
          externalId: doc.b_id,
          isbn: doc.isbn || doc.isbn_13,
          title: doc.title,
          authors: (doc.author ?? [])
            .map((a) => a.name)
            .filter(Boolean),
          pageCount,
          publishedDate: doc.publication_year?.toString(),
          categories: (doc.category ?? [])
            .map((c) => c.name)
            .filter(Boolean)
            .slice(0, 5),
          coverUrl: doc.image,
        };
      })
      .filter((book) => book !== null) as CatalogBook[];
  } catch (error) {
    // Log the error but don't throw - let the search fallback to the other source
    console.warn("BookShark search request failed:", error);
    return [];
  }
}

/**
 * Determine if a search query is primarily Greek text
 */
export function isProbablyGreekSearch(query: string): boolean {
  const words = query.trim().split(/\s+/);
  if (words.length === 0) return false;

  // If more than half the words contain Greek characters, consider it Greek
  const greekWords = words.filter((word) => isGreekText(word)).length;
  return greekWords > words.length / 2;
}

