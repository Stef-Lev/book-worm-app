import { auth } from "@/auth";
import { searchOpenLibrary } from "@/lib/open-library";
import { searchBookshark, isProbablyGreekSearch } from "@/lib/bookshark";
import type { CatalogBook as OpenLibraryBook } from "@/lib/open-library";
import type { CatalogBook as BooksharkBook } from "@/lib/bookshark";

type SearchResult = OpenLibraryBook | BooksharkBook;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > 120) {
    return Response.json({ error: "Enter at least 2 characters to search." }, { status: 400 });
  }

  try {
    const isGreek = isProbablyGreekSearch(query);

    // For Greek searches, prioritize BookShark; for others, prioritize Open Library
    // We search both in parallel and merge results, deduplicating by ISBN
    const [results1, results2] = isGreek
      ? await Promise.allSettled([
          searchBookshark(query),
          searchOpenLibrary(query),
        ])
      : await Promise.allSettled([
          searchOpenLibrary(query),
          searchBookshark(query),
        ]);

    const allResults: SearchResult[] = [];
    const seenIsbns = new Set<string>();
    const seenTitles = new Map<string, boolean>();

    // Add results from the primary source
    const primaryResults = results1.status === "fulfilled" ? results1.value : [];
    for (const book of primaryResults) {
      const isbn = book.isbn?.replace(/[\s-]/g, "").toUpperCase();
      const titleKey = book.title.toLowerCase().trim();

      if (isbn && seenIsbns.has(isbn)) continue;
      if (seenTitles.has(titleKey)) continue;

      if (isbn) seenIsbns.add(isbn);
      seenTitles.set(titleKey, true);
      allResults.push(book);
    }

    // Add results from the secondary source (if they don't duplicate)
    const secondaryResults = results2.status === "fulfilled" ? results2.value : [];
    for (const book of secondaryResults) {
      const isbn = book.isbn?.replace(/[\s-]/g, "").toUpperCase();
      const titleKey = book.title.toLowerCase().trim();

      if (isbn && seenIsbns.has(isbn)) continue;
      if (seenTitles.has(titleKey)) continue;

      if (isbn) seenIsbns.add(isbn);
      seenTitles.set(titleKey, true);
      allResults.push(book);
    }

    // Limit to 30 total results (15 from each source ideally)
    const limitedResults = allResults.slice(0, 30);

    return Response.json({ results: limitedResults });
  } catch (error) {
    console.error("Book catalog search failed:", error);
    return Response.json(
      { error: "The book catalog is temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}
