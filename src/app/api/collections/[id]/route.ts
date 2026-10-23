import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";
import UserBook from "@/models/UserBook";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();
  const rawUserId = session?.user?.id;
  if (!rawUserId || !mongoose.Types.ObjectId.isValid(rawUserId)) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }
  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return Response.json({ error: "Collection not found." }, { status: 404 });
  }

  await connectDB();
  const userId = new mongoose.Types.ObjectId(rawUserId);
  const deleted = await Collection.findOneAndDelete({ _id: id, userId });
  if (!deleted) return Response.json({ error: "Collection not found." }, { status: 404 });
  await UserBook.updateMany({ userId }, { $pull: { collectionIds: deleted._id } });
  return Response.json({ success: true });
}
