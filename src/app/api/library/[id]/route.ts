import mongoose from "mongoose";
import {
  getSessionUserId,
  isObjectIdList,
  jsonError,
  ownsCollections,
  unauthorized,
} from "@/lib/api";
import { toDateOnly } from "@/lib/dates";
import { connectDB } from "@/lib/mongodb";
import { Shelf, isShelf } from "@/lib/shelves";
import UserBook from "@/models/UserBook";

type RouteContext = { params: Promise<{ id: string }> };

function parseDate(value: unknown) {
  if (value === "" || value === null) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || toDateOnly(date) !== value
    ? undefined
    : date;
}

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Book not found.", 404);
  }

  const body: unknown = await request.json();
  if (!body || typeof body !== "object") {
    return jsonError("Invalid book details.", 400);
  }
  const updates = body as Record<string, unknown>;
  const set: Record<string, unknown> = {};
  if (updates.status !== undefined) {
    if (!isShelf(updates.status)) {
      return jsonError("Select a valid shelf.", 400);
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
      return jsonError("Rating must be from 1 to 5 in half-star steps.", 400);
    }
    set.rating = rating;
  }
  if (updates.review !== undefined) {
    if (typeof updates.review !== "string" || updates.review.length > 5000) {
      return jsonError("Review must be 5,000 characters or fewer.", 400);
    }
    set.review = updates.review.trim();
  }
  for (const field of ["startedAt", "finishedAt"] as const) {
    if (updates[field] !== undefined) {
      const date = parseDate(updates[field]);
      if (date === undefined) {
        return jsonError("Enter a valid date.", 400);
      }
      set[field] = date;
    }
  }
  if (updates.collectionIds !== undefined) {
    const ids = updates.collectionIds;
    if (!isObjectIdList(ids)) {
      return jsonError("Select valid collections.", 400);
    }
    set.collectionIds = ids;
  }
  if (!Object.keys(set).length) {
    return jsonError("No changes provided.", 400);
  }

  await connectDB();
  if (
    set.collectionIds &&
    !(await ownsCollections(set.collectionIds as string[], userId))
  ) {
    return jsonError("One or more collections could not be found.", 400);
  }
  const entry = await UserBook.findOne({ _id: id, userId });
  if (!entry) return jsonError("Book not found.", 404);

  const statusChanged = set.status !== undefined && set.status !== entry.status;
  if (
    statusChanged &&
    set.status === Shelf.CurrentlyReading &&
    !entry.startedAt &&
    !set.startedAt
  ) {
    set.startedAt = new Date();
  }
  if (
    statusChanged &&
    set.status === Shelf.Read &&
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
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Book not found.", 404);
  }
  await connectDB();
  const deleted = await UserBook.findOneAndDelete({ _id: id, userId });
  if (!deleted) return jsonError("Book not found.", 404);
  return Response.json({ success: true });
}
