import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import type { CatalogBook } from "@/lib/open-library";
import Book from "@/models/Book";
import Collection from "@/models/Collection";
import { SHELVES } from "@/models/UserBook";
import UserBook from "@/models/UserBook";

function getUserId(value: string) {
  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
}

function isShelf(value: unknown): value is (typeof SHELVES)[number] {
  return typeof value === "string" && SHELVES.some((shelf) => shelf === value);
}

function isCatalogBook(value: unknown): value is CatalogBook {
  if (!value || typeof value !== "object") return false;
  const book = value as Record<string, unknown>;
  return (
    (book.source === "open-library" || book.source === "manual") &&
    typeof book.title === "string" &&
    book.title.trim().length > 0 &&
    book.title.length <= 300 &&
    (book.authors === undefined ||
      (Array.isArray(book.authors) &&
        book.authors.length <= 20 &&
        book.authors.every((author) => typeof author === "string" && author.length <= 200))) &&
    (book.categories === undefined ||
      (Array.isArray(book.categories) &&
        book.categories.length <= 20 &&
        book.categories.every((category) => typeof category === "string" && category.length <= 100))) &&
    (book.pageCount === undefined ||
      (typeof book.pageCount === "number" && Number.isInteger(book.pageCount) && book.pageCount >= 0)) &&
    (book.isbn === undefined || typeof book.isbn === "string") &&
    (book.externalId === undefined || typeof book.externalId === "string") &&
    (book.publishedDate === undefined ||
      (typeof book.publishedDate === "string" && book.publishedDate.length <= 40)) &&
    (book.coverUrl === undefined || typeof book.coverUrl === "string")
  );
}

function safeUrl(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ? getUserId(session.user.id) : null;
  if (!userId) return Response.json({ error: "Authentication required." }, { status: 401 });

  await connectDB();
  const [entries, collections] = await Promise.all([
    UserBook.find({ userId }).populate("bookId").sort({ updatedAt: -1 }).lean(),
    Collection.find({ userId }).sort({ name: 1 }).lean(),
  ]);

  return Response.json({
    entries: entries.map((entry) => {
      const book = entry.bookId as unknown as Record<string, unknown>;
      return {
        id: entry._id.toString(),
        status: entry.status,
        rating: entry.rating,
        review: entry.review ?? "",
        startedAt: entry.startedAt?.toISOString().slice(0, 10) ?? "",
        finishedAt: entry.finishedAt?.toISOString().slice(0, 10) ?? "",
        collectionIds: entry.collectionIds.map((id) => id.toString()),
        createdAt: entry.createdAt.toISOString(),
        book: {
          id: String(book._id),
          source: book.source,
          title: book.title,
          authors: book.authors,
          isbn: book.isbn,
          pageCount: book.pageCount,
          categories: book.categories,
          coverUrl: book.coverUrl,
          publishedDate: book.publishedDate,
        },
      };
    }),
    collections: collections.map((collection) => ({
      id: collection._id.toString(),
      name: collection.name,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id ? getUserId(session.user.id) : null;
  if (!userId) return Response.json({ error: "Authentication required." }, { status: 401 });

  const body: unknown = await request.json();
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid book details." }, { status: 400 });
  }
  const { book, status, collectionIds } = body as Record<string, unknown>;
  if (!isCatalogBook(book)) {
    return Response.json({ error: "A valid book title is required." }, { status: 400 });
  }
  const selectedStatus = status === undefined ? "to-read" : status;
  if (!isShelf(selectedStatus)) {
    return Response.json({ error: "Select a valid shelf." }, { status: 400 });
  }
  if (
    collectionIds !== undefined &&
    (!Array.isArray(collectionIds) ||
      collectionIds.length > 20 ||
      !collectionIds.every((id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) ||
      new Set(collectionIds).size !== collectionIds.length)
  ) {
    return Response.json({ error: "Select valid collections." }, { status: 400 });
  }
  if (book.coverUrl && !safeUrl(book.coverUrl)) {
    return Response.json({ error: "Enter a valid HTTP or HTTPS cover URL." }, { status: 400 });
  }

  await connectDB();
  const ownedCollections = (collectionIds as string[] | undefined) ?? [];
  if (
    ownedCollections.length &&
    (await Collection.countDocuments({
      _id: { $in: ownedCollections },
      userId,
    })) !== new Set(ownedCollections).size
  ) {
    return Response.json({ error: "One or more collections could not be found." }, { status: 400 });
  }

  let catalogBookId: mongoose.Types.ObjectId;
  if (book.source === "open-library") {
    if (typeof book.externalId !== "string" || book.externalId.length > 100) {
      return Response.json({ error: "The catalog result is invalid." }, { status: 400 });
    }
    const filter = { source: "open-library" as const, externalId: book.externalId };
    let catalogBook = await Book.findOne(filter);
    if (!catalogBook) {
      try {
        catalogBook = await Book.create({
          source: "open-library",
          externalId: book.externalId,
          isbn: book.isbn?.slice(0, 32),
          title: book.title.trim(),
          authors: book.authors ?? [],
          pageCount: book.pageCount ?? 0,
          publishedDate: book.publishedDate,
          categories: book.categories ?? [],
          coverUrl: safeUrl(book.coverUrl),
        });
      } catch (error) {
        if (!(error instanceof mongoose.mongo.MongoServerError) || error.code !== 11000) {
          throw error;
        }
        catalogBook = await Book.findOne(filter);
      }
    }
    if (!catalogBook) {
      throw new Error("Open Library book could not be saved.");
    }
    catalogBookId = catalogBook._id;
  } else {
    const catalogBook = await Book.create({
      source: "manual",
      createdBy: userId,
      isbn: typeof book.isbn === "string" ? book.isbn.slice(0, 32) : undefined,
      title: book.title.trim(),
      authors: book.authors ?? [],
      pageCount: book.pageCount ?? 0,
      publishedDate: book.publishedDate,
      categories: book.categories ?? [],
      coverUrl: safeUrl(book.coverUrl),
    });
    catalogBookId = catalogBook._id;
  }

  try {
    const entry = await UserBook.create({
      userId,
      bookId: catalogBookId,
      status: selectedStatus,
      startedAt: selectedStatus === "currently-reading" ? new Date() : null,
      finishedAt: selectedStatus === "read" ? new Date() : null,
      collectionIds: ownedCollections,
    });
    return Response.json({ id: entry._id.toString() }, { status: 201 });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      return Response.json({ error: "This book is already in your library." }, { status: 409 });
    }
    throw error;
  }
}
