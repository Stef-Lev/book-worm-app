import mongoose from "mongoose";
import {
  getSessionUserId,
  isDuplicateKeyError,
  jsonError,
  readCollectionName,
  toCollectionJson,
  unauthorized,
} from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import UserBook from "@/models/UserBook";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Collection not found.", 404);
  }

  const body: unknown = await request.json().catch(() => null);
  const name = readCollectionName(body);
  if (!name) {
    return jsonError("Collection names must be 1–50 characters.", 400);
  }

  await connectDB();
  try {
    const collection = await Collection.findOneAndUpdate(
      { _id: id, userId },
      { $set: { name } },
      { returnDocument: "after", runValidators: true },
    );
    if (!collection) return jsonError("Collection not found.", 404);
    return Response.json({ collection: toCollectionJson(collection) });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return jsonError("You already have a collection with that name.", 409);
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonError("Collection not found.", 404);
  }

  await connectDB();
  const deleted = await Collection.findOneAndDelete({ _id: id, userId });
  if (!deleted) return jsonError("Collection not found.", 404);
  await UserBook.updateMany(
    { userId },
    { $pull: { collectionIds: deleted._id } },
  );
  return Response.json({ success: true });
}
