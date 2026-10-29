# BookShark Integration for Greek Book Search

## Overview

The book-worm-app now supports searching for Greek books using **BookShark**, a specialized book metadata service for Greek language books. The implementation uses a hybrid intelligent search strategy that optimally leverages both Open Library and BookShark.

## Changes Made

### 1. New BookShark Library (`src/lib/bookshark.ts`)

- **`searchBookshark(query: string)`**: Searches BookShark API for books
  - Automatically detects ISBN format and searches by ISBN for exact matches
  - Falls back to title search for general queries
  - Gracefully handles API failures (returns empty results if BookShark is unavailable)

- **`isGreekIsbn(isbn: string)`**: Intelligent ISBN-based country detection ⭐
  - Detects Greek ISBNs by analyzing ISBN country codes
  - ISBN-10: Greece prefix is `960` (e.g., `960-14-1157-7`)
  - ISBN-13: Greece prefixes are `978960` or `97910` (e.g., `978-960-14-1157-6`)
  - Returns `true` for Greek ISBNs, `false` otherwise
  - Used to prioritize BookShark before even checking text content

- **`isProbablyGreekSearch(query: string)`**: Intelligent language detection
  - Analyzes text for Greek characters (Unicode range 0x370–0x3FF)
  - If >50% of words contain Greek characters, classifies as Greek search
  - Used as secondary detection method when ISBN is not available

### 2. Updated Book Sources (`src/lib/book-source.ts`)

- Added `Bookshark = "bookshark"` to the `BookSource` enum
- Maintains compatibility with existing `GoogleBooks`, `OpenLibrary`, and `Manual` sources

### 3. Hybrid Search API (`src/app/api/books/search/route.ts`)

The search endpoint now implements intelligent multi-source search with **ISBN-first detection**:

```
User Search Query
  ├─ Detect if Valid ISBN
  │  ├─ YES → Check ISBN country code
  │  │  ├─ Greek ISBN (960 or 978960) → BookShark primary ⭐
  │  │  └─ Other ISBN → Open Library primary
  │  │
  │  └─ NO (text search)
  │     ├─ Detect Language (Greek characters or not)
  │     ├─ Greek Detected → BookShark primary
  │     └─ Non-Greek → Open Library primary
  │
  └─ Search both sources in parallel, deduplicate, merge
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

## ISBN-Based Country Detection

### How It Works

ISBNs contain standardized country/publisher information:

| Country | ISBN-10 Prefix | ISBN-13 Prefix | Examples |
|---------|---|---|---|
| **Greece** 🇬🇷 | `960` | `978-960`, `979-10` | `960-14-1157-7`, `978-960-14-1157-6` |
| **USA** 🇺🇸 | `0` | `978-0`, `979-8` | `0-306-40615-2`, `978-0-306-40615-9` |
| **UK** 🇬🇧 | `1` | `978-1` | `1-491-95374-6`, `978-1-491-95374-9` |
| **Germany** 🇩🇪 | `3` | `978-3` | `3-16-148410-1`, `978-3-16-148410-2` |
| **France** 🇫🇷 | `2` | `978-2` | `2-07-036822-2`, `978-2-07-036822-0` |

### Detection Algorithm

```typescript
// ISBN-10: Check if starts with 960 (Greece)
if (normalized.length === 10) {
  return /^960\d{7}$/.test(normalized);  // 960 + 7 digits
}

// ISBN-13: Check if starts with 978960 or 97910 (Greece)
if (normalized.length === 13) {
  return /^978960/.test(normalized) || /^97910/.test(normalized);
}
```

### Test Results ✓

```
✓ "960-14-1157-7" → Greek ISBN-10 → BookShark priority
✓ "978-960-14-1157-6" → Greek ISBN-13 → BookShark priority
✓ "9789601411576" → Greek ISBN-13 (no hyphens) → BookShark priority
✓ "0-306-40615-2" → English ISBN-10 → Open Library priority
✓ "978-0-306-40615-9" → English ISBN-13 → Open Library priority
✓ "3-16-148410-1" → German ISBN-10 → Open Library priority
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

**ISBN-based Detection (Most Reliable):**
```
✓ "960-14-1157-7" → Greek (ISBN-10, starts with 960)
✓ "978-960-14-1157-6" → Greek (ISBN-13, starts with 978-960)
✓ "0-306-40615-2" → English (ISBN-10, starts with 0)
✓ "978-0-306-40615-9" → English (ISBN-13, starts with 978-0)
```

**Text-based Detection (Fallback):**
```
✓ "The Hobbit" → English (no Greek characters)
✓ "Σημεία και τέρατα" → Greek (Greek characters detected)
✓ "Ποίηση" → Greek (Greek characters detected)
✓ "Ο Λόρδος των Δαχτυλιδίων" → Greek (>50% Greek words)
```

## Future Enhancements

1. **Optional API Key Support**: Add environment variable for BookShark API key to increase daily limits
2. **Search Filtering**: Allow users to filter by source (Greek only, English only, all)
3. **Author/Publisher Search**: Expand BookShark search to use author/publisher parameters
4. **Eager Loading**: Use BookShark's eager loading feature for richer author/publisher data
5. **Caching Strategy**: Implement persistent cache for frequently searched books
6. **ISBN Database**: Consider adding comprehensive ISBN country database for other languages (German, French, Spanish, etc.)

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

### ISBN Not Recognized as Greek

Double-check the ISBN format:
- Greek ISBN-10 must start with `960`
- Greek ISBN-13 must start with `978960` or `97910`
- Verify at: https://en.wikipedia.org/wiki/International_Standard_Book_Number#ISBN-10_check_digit_calculation

## Performance

- **Parallel Requests**: Both sources are queried in parallel using `Promise.allSettled()`
- **Timeout**: 5-second timeout per API to ensure responsive UI
- **Caching**: Results cached for 1 hour using Next.js `cacheLife("hours")`
- **Deduplication**: O(n) complexity with Set-based lookup
- **ISBN Detection**: O(1) regex-based check before any API calls

## Backward Compatibility

✅ All existing functionality preserved:
- Manual book entry still works
- Open Library searches still work
- Existing library data unaffected
- No database migrations needed
- ISBN detection is transparent to the user

