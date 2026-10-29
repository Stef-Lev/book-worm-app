# BookShark Integration for Greek Book Search

## Overview

The book-worm-app now supports searching for Greek books using **BookShark**, a specialized book metadata service for Greek language books. The implementation uses a hybrid intelligent search strategy that optimally leverages both Open Library and BookShark.

## Changes Made

### 1. New BookShark Library (`src/lib/bookshark.ts`)

- **`searchBookshark(query: string)`**: Searches BookShark API for books
  - Automatically detects ISBN format and searches by ISBN for exact matches
  - Falls back to title search for general queries
  - Gracefully handles API failures (returns empty results if BookShark is unavailable)

- **`isProbablyGreekSearch(query: string)`**: Intelligent language detection
  - Analyzes text for Greek characters (Unicode range 0x370–0x3FF)
  - If >50% of words contain Greek characters, classifies as Greek search
  - Used to prioritize search order

### 2. Updated Book Sources (`src/lib/book-source.ts`)

- Added `Bookshark = "bookshark"` to the `BookSource` enum
- Maintains compatibility with existing `GoogleBooks`, `OpenLibrary`, and `Manual` sources

### 3. Hybrid Search API (`src/app/api/books/search/route.ts`)

The search endpoint now implements intelligent multi-source search:

```
User Search Query
  ├─ Detect Language (Greek or not)
  │
  ├─ Greek Detected:
  │  └─ Primary: BookShark (optimized for Greek)
  │     Fallback: Open Library (for translations/English editions)
  │
  └─ Non-Greek:
     └─ Primary: Open Library (comprehensive English catalog)
        Fallback: BookShark (might have translations)
```

**Deduplication Strategy:**
- Results are merged and deduplicated by ISBN and title
- Maximum 30 total results returned (combining both sources)
- Primary source results appear first in results

**Error Handling:**
- If BookShark is unavailable → returns Open Library results
- If Open Library is unavailable → returns BookShark results
- If both fail → returns 502 error to client

### 4. Search Results UI Fix (`src/components/book-library/book-library.tsx`)

**Fixed Issue:** Search results now properly clear when the search box is emptied

- Before: Clearing the search field left results displayed indefinitely
- After: Results automatically clear when query length becomes 0

Implementation:
```tsx
onChange={(event) => {
  const newValue = event.target.value;
  setQuery(newValue);
  // Clear results if the search box is emptied
  if (newValue.trim().length === 0) {
    setResults([]);
  }
}}
```

### 5. Updated Type Definitions

- Updated `NewBook` type in `src/lib/open-library.ts` to support both sources:
  ```ts
  source: BookSource.OpenLibrary | BookSource.Bookshark | BookSource.Manual
  ```

## API Details

### BookShark API (No Key Required)

- **Free Tier**: 2,500 requests/day (no API key needed)
- **With API Key**: 15,000 requests/day (optional signup at bookshark.bibliography.gr)
- **Timeout**: 5 seconds
- **Data Source**: biblionet.gr (Greek books database)

### Search Parameters

```http
GET http://bookshark.bibliography.gr/api/v1/search?title=query
GET http://bookshark.bibliography.gr/api/v1/book?isbn=978-960-14-1157-6
```

### Response Format

```json
{
  "book": [
    {
      "b_id": "123456",
      "title": "Ποίηση",
      "author": [{ "name": "Author Name", "b_id": "456" }],
      "isbn": "978-960-14-1157-6",
      "pages": "326",
      "image": "http://...",
      "category": [{ "name": "Poetry", "ddc": "890" }],
      "publication_year": "2020"
    }
  ]
}
```

## Testing

### Test Cases for Greek Detection

```
✓ "The Hobbit" → English (Open Library priority)
✓ "Σημεία και τέρατα" → Greek (BookShark priority)
✓ "Ποίηση" → Greek (BookShark priority)
✓ "Harry Potter" → English (Open Library priority)
✓ "Ο Λόρδος των Δαχτυλιδίων" → Greek (BookShark priority)
✓ "το hobbit στα ελληνικά" → Greek (>50% Greek words)
```

## Future Enhancements

1. **Optional API Key Support**: Add environment variable for BookShark API key to increase daily limits
2. **Search Filtering**: Allow users to filter by source (Greek only, English only, all)
3. **Author/Publisher Search**: Expand BookShark search to use author/publisher parameters
4. **Eager Loading**: Use BookShark's eager loading feature for richer author/publisher data
5. **Caching Strategy**: Implement persistent cache for frequently searched books

## Troubleshooting

### BookShark API Unavailable

If BookShark experiences downtime:
1. The search falls back to Open Library automatically
2. Greek books from other sources may appear in results
3. No error is shown to users (graceful degradation)

To monitor:
```bash
curl "http://bookshark.bibliography.gr/api/v1/book?isbn=978-960-14-1157-6"
```

### Empty Results for Greek Books

This may indicate:
1. The book isn't in biblionet.gr database (check biblionet.gr directly)
2. The ISBN might be formatted differently
3. BookShark API might be temporarily down (check endpoint)

## Performance

- **Parallel Requests**: Both sources are queried in parallel using `Promise.allSettled()`
- **Timeout**: 5-second timeout per API to ensure responsive UI
- **Caching**: Results cached for 1 hour using Next.js `cacheLife("hours")`
- **Deduplication**: O(n) complexity with Set-based lookup

## Backward Compatibility

✅ All existing functionality preserved:
- Manual book entry still works
- Open Library searches still work
- Existing library data unaffected
- No database migrations needed
