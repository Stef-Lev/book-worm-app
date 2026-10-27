---
name: mvp-requirements
description: Product context and MVP requirements for the PaperSmell book-tracking app (virtual library, shelves, search/barcode add, progress, calendar, ratings, statistics). Use when planning, building or prioritising any PaperSmell feature, data model, API or page.
---

# PaperSmell MVP requirements

PaperSmell is a book tracking app. **Phase: MVP, functionality over styling** (see `create-component` skill). Stack: Next.js (App Router, TypeScript), React, CSS Modules, MongoDB (Mongoose), Auth.js credentials auth, fully responsive. Each user only sees their own data.

Already done: project setup, auth foundation (`User` model, `/api/register`, Auth.js), style tokens. Pending: login/register pages, everything below.

## 1. Virtual library and shelves
- Each user has a virtual library of the books they own/track.
- Every book has exactly one status (shelf):
  - `to-read`
  - `currently-reading`
  - `read` (already read)
  - `did-not-finish`
- Users can move a book between shelves, and view the library filtered by shelf.

## 2. Adding books
1. **Search**: a search input that queries a free API (Google Books API or Open Library API; pick one, keep the provider behind a single `lib` function so it can be swapped). Results show cover, title, author(s), page count, categories; one click adds to a chosen shelf. Call the external API from a server route/action, not the client.
2. **Manual add**: a form for title, author(s), pages, categories, cover URL (optional) when the book is not found.
3. **Barcode scan** (nice-to-have, if feasible): scan the ISBN barcode with the phone camera (e.g. `BarcodeDetector` API or a library such as `@zxing/browser`), then look the ISBN up in the same API. Needs HTTPS/localhost and camera permission; fall back to manual ISBN input.

## 3. Reading progress
- For a `currently-reading` book the user records the page they stopped at (`currentPage`).
- Show progress as page X of Y and a percentage. Reaching the last page can offer to mark the book as `read`.

## 4. Reading calendar
- Each book can have a `startedAt` and `finishedAt` date (set automatically when moving to currently-reading / read, editable by the user).
- A calendar view shows which books were being read on which days/ranges.

## 5. Reviews
- Rating from 1 to 5 stars with half steps (1, 1.5, ... 5). Store as a number in 0.5 increments; validate on the server.
- Optional text review/notes.

## 6. Library overview, sorting and filtering
- Show what percentage of the whole library has been read (`read` books / all books), plus counts per shelf.
- Sort and filter the library by: category/genre, author, title, rating, date added, date finished, page count.

## 7. Statistics
- **Books per month** calculated automatically from `finishedAt` (also per year, and the average books per month).
- Other statistics: total books read, total pages read, average rating, average pages per book, average days to finish a book, most-read categories and authors, current streak/last-finished, did-not-finish count.

## Suggested data model (Mongoose)
See the `mongodb-schemas` skill for the full schemas (it splits this into a shared `Book` catalog and a per-user `UserBook`). Summary of fields:

`Book` (per user): `userId`, `title`, `authors[]`, `isbn`, `pageCount`, `categories[]`, `coverUrl`, `description`, `source` (`google-books` | `open-library` | `manual`), `externalId`, `status`, `currentPage`, `startedAt`, `finishedAt`, `rating` (0.5 to 5), `review`, timestamps. Index on `userId` plus `status`.

## Suggested build order
1. Login / register pages and route protection.
2. `Book` model, CRUD API, library page with shelves.
3. Search + add (API provider) and manual add.
4. Reading progress, dates, rating and review on a book detail page.
5. Sorting/filtering and read-percentage overview.
6. Statistics page (books per month etc.) and reading calendar.
7. Barcode scanning.

## Out of scope for now
Visual polish, social features, recommendations, import/export, multi-language.
