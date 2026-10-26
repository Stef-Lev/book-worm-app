import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import UserBook from "@/models/UserBook";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  const rawUserId = session?.user?.id;
  if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Collection not found." }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const name =
    body &&
    typeof body === "object" &&
    "name" in body &&
    typeof body.name === "string"
      ? body.name.trim()
      : "";
  if (!name || name.length > 50) {
    return Response.json(
      { error: "Collection names must be 1-50 characters." },
      { status: 400 },
    );
  }

  await connectDB();
  try {
    const collection = await Collection.findOneAndUpdate(
      { _id: id, userId: new mongoose.Types.ObjectId(rawUserId) },
      { $set: { name } },
      { returnDocument: "after", runValidators: true },
    );
    if (!collection) {
      return Response.json({ error: "Collection not found." }, { status: 404 });
    }
    return Response.json({
      collection: { id: collection._id.toString(), name: collection.name },
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      return Response.json(
        { error: "You already have a collection with that name." },
        { status: 409 },
      );
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  const rawUserId = session?.user?.id;
  if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Collection not found." }, { status: 404 });
  }

  await connectDB();
  const userId = new mongoose.Types.ObjectId(rawUserId);
  const deleted = await Collection.findOneAndDelete({ _id: id, userId });
  if (!deleted)
    return Response.json({ error: "Collection not found." }, { status: 404 });
  await UserBook.updateMany(
    { userId },
    { $pull: { collectionIds: deleted._id } },
  );
  return Response.json({ success: true });
}
