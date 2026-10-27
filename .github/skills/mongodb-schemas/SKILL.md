---
name: mongodb-schemas
description: Reference MongoDB/Mongoose schemas and data-modeling rules for PaperSmell (User, global Book catalog, per-user UserBook tracker, indexes, query and aggregation examples). Use when creating or changing models in src/models, writing queries or API routes that touch the database, or computing statistics.
---

# PaperSmell MongoDB data model

Stack: Mongoose + TypeScript. Models live in `src/models/<Name>.ts`, connection in `src/lib/mongodb.ts`. Follow the pattern of the existing `src/models/User.ts`.

## Design principle
Separate the **global book catalog** from the **user's personal reading data**:
- `Book`: shared metadata (title, authors, cover, pages). One document per real book, no matter how many users track it.
- `UserBook`: one document per (user, book). Holds shelf, progress, dates, rating, review.
- Reference with `ObjectId` (normalize shared data); keep per-user values on `UserBook` (denormalize for fast shelf reads).
- Manually added books are also `Book` documents (`source: "manual"`) with `createdBy` set, so other users do not see private entries in search.

> `mvp-requirements` originally suggested a single per-user `Book`. This skill supersedes that: same fields, split across two collections.

## Model file pattern
```ts
import mongoose, { InferSchemaType, Model } from "mongoose";

const schema = new mongoose.Schema({ /* ... */ }, { timestamps: true });

export type XDoc = InferSchemaType<typeof schema>;

export default (mongoose.models.X as Model<XDoc>) ||
  mongoose.model<XDoc>("X", schema);
```
The `mongoose.models.X ||` guard is required, otherwise Next.js hot reload throws `OverwriteModelError`. Use `{ timestamps: true }` instead of hand-written `createdAt`/`updatedAt`.

## User (exists)
```ts
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);
```

## Book (global catalog)
```ts
export const BOOK_SOURCES = ["google-books", "open-library", "manual"] as const;

const bookSchema = new mongoose.Schema(
  {
    source: { type: String, enum: BOOK_SOURCES, required: true },
    externalId: { type: String, trim: true }, // provider id; absent for manual
    isbn: { type: String, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    authors: [{ type: String, trim: true }],
    description: { type: String },
    coverUrl: { type: String },
    pageCount: { type: Number, min: 0, default: 0 },
    publishedDate: { type: String }, // providers return "2019" or "2019-05-01"
    categories: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // set for manual books
  },
  { timestamps: true }
);

// Unique per provider; partial so manual books (no externalId) are not constrained
bookSchema.index(
  { source: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { externalId: { $type: "string" } } }
);
```
Flow when adding from search: find `Book` by `{ source, externalId }`; if missing, create it from the provider response; then create the `UserBook`.

## UserBook (core tracker)
```ts
export const SHELVES = ["to-read", "currently-reading", "read", "did-not-finish"] as const;

const userBookSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    status: { type: String, enum: SHELVES, default: "to-read" },
    currentPage: { type: Number, min: 0, default: 0 },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    rating: {
      type: Number,
      default: null,
      min: 0.5,
      max: 5,
      validate: {
        validator: (v: number | null) => v === null || v * 2 === Math.floor(v * 2),
        message: "Rating must be in 0.5 steps",
      },
    },
    review: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true } // createdAt = "date added"
);

userBookSchema.index({ userId: 1, bookId: 1 }, { unique: true }); // no duplicates in a library
userBookSchema.index({ userId: 1, status: 1 }); // shelf views
userBookSchema.index({ userId: 1, finishedAt: -1 }); // stats and calendar
```
Rules to enforce in the API (not only the schema):
- Always filter by the session `userId`; never trust a `userId` from the request body.
- Moving to `currently-reading` sets `startedAt` if empty; moving to `read` sets `finishedAt` if empty (both stay editable).
- `currentPage` must not exceed `Book.pageCount` when the page count is known.

## Query examples
```ts
// Shelf view
UserBook.find({ userId, status: "currently-reading" }).populate("bookId").lean();

// Library overview: counts per shelf (read % = read / total)
UserBook.aggregate([
  { $match: { userId } },
  { $group: { _id: "$status", count: { $sum: 1 } } },
]);

// Books per month
UserBook.aggregate([
  { $match: { userId, status: "read", finishedAt: { $ne: null } } },
  { $group: { _id: { y: { $year: "$finishedAt" }, m: { $month: "$finishedAt" } }, count: { $sum: 1 } } },
  { $sort: { "_id.y": 1, "_id.m": 1 } },
]);

// Total pages read, average rating
UserBook.aggregate([
  { $match: { userId, status: "read" } },
  { $lookup: { from: "books", localField: "bookId", foreignField: "_id", as: "book" } },
  { $unwind: "$book" },
  { $group: { _id: null, pages: { $sum: "$book.pageCount" }, avgRating: { $avg: "$rating" } } },
]);
```
`userId` inside `aggregate` is not auto-cast; wrap it with `new mongoose.Types.ObjectId(userId)`.

## Sorting and filtering the library
Sorting by title, author, category or page count needs `Book` fields: use `$lookup` + `$sort` in an aggregation. Sorting by rating, date added (`createdAt`) or `finishedAt` uses `UserBook` fields directly.
