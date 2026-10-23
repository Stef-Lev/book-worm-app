import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import { SHELVES } from "@/models/UserBook";
import UserBook from "@/models/UserBook";

type RouteContext = { params: Promise<{ id: string }> };

function getUserId(value: string) {
  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
}

function parseDate(value: unknown) {
  if (value === "" || value === null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? undefined
    : date;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id ? getUserId(session.user.id) : null;
  if (!userId) return Response.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Book not found." }, { status: 404 });
  }

  const body: unknown = await request.json();
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid book details." }, { status: 400 });
  }
  const updates = body as Record<string, unknown>;
  const set: Record<string, unknown> = {};
  if (updates.status !== undefined) {
    if (!SHELVES.includes(updates.status as (typeof SHELVES)[number])) {
      return Response.json({ error: "Select a valid shelf." }, { status: 400 });
    }
    set.status = updates.status;
  }
  if (updates.rating !== undefined) {
    const rating = updates.rating;
    if (
      rating !== null &&
      (typeof rating !== "number" ||
        rating < 1 ||
        rating > 5 ||
        rating * 2 !== Math.floor(rating * 2))
    ) {
      return Response.json({ error: "Rating must be from 1 to 5 in half-star steps." }, { status: 400 });
    }
    set.rating = rating;
  }
  if (updates.review !== undefined) {
    if (typeof updates.review !== "string" || updates.review.length > 5000) {
      return Response.json({ error: "Review must be 5,000 characters or fewer." }, { status: 400 });
    }
    set.review = updates.review.trim();
  }
  for (const field of ["startedAt", "finishedAt"] as const) {
    if (updates[field] !== undefined) {
      const date = parseDate(updates[field]);
      if (date === undefined) {
        return Response.json({ error: "Enter a valid date." }, { status: 400 });
      }
      set[field] = date;
    }
  }
  if (updates.collectionIds !== undefined) {
    const ids = updates.collectionIds;
    if (
      !Array.isArray(ids) ||
      ids.length > 20 ||
      !ids.every((value) => typeof value === "string" && mongoose.Types.ObjectId.isValid(value)) ||
      new Set(ids).size !== ids.length
    ) {
      return Response.json({ error: "Select valid collections." }, { status: 400 });
    }
    if (
      ids.length &&
      (await Collection.countDocuments({
        _id: { $in: ids },
        userId,
      })) !== new Set(ids).size
    ) {
      return Response.json({ error: "One or more collections could not be found." }, { status: 400 });
    }
    set.collectionIds = ids;
  }
  if (!Object.keys(set).length) {
    return Response.json({ error: "No changes provided." }, { status: 400 });
  }

  await connectDB();
  const entry = await UserBook.findOne({ _id: id, userId });
  if (!entry) return Response.json({ error: "Book not found." }, { status: 404 });

  const statusChanged = set.status !== undefined && set.status !== entry.status;
  if (
    statusChanged &&
    set.status === "currently-reading" &&
    !entry.startedAt &&
    !set.startedAt
  ) {
    set.startedAt = new Date();
  }
  if (
    statusChanged &&
    set.status === "read" &&
    !entry.finishedAt &&
    !set.finishedAt
  ) {
    set.finishedAt = new Date();
  }
  Object.assign(entry, set);
  await entry.save();
  return Response.json({ success: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id ? getUserId(session.user.id) : null;
  if (!userId) return Response.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Book not found." }, { status: 404 });
  }
  await connectDB();
  const deleted = await UserBook.findOneAndDelete({ _id: id, userId });
  if (!deleted) return Response.json({ error: "Book not found." }, { status: 404 });
  return Response.json({ success: true });
}
