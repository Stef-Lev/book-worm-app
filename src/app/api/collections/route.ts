import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Collection from "@/models/Collection";

function getUserId(value: string) {
  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ? getUserId(session.user.id) : null;
  if (!userId) return Response.json({ error: "Authentication required." }, { status: 401 });
  await connectDB();
  const collections = await Collection.find({ userId }).sort({ name: 1 }).lean();
  return Response.json({
    collections: collections.map(({ _id, name }) => ({ id: _id.toString(), name })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id ? getUserId(session.user.id) : null;
  if (!userId) return Response.json({ error: "Authentication required." }, { status: 401 });

  const body: unknown = await request.json();
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as Record<string, unknown>).name !== "string"
  ) {
    return Response.json({ error: "Enter a collection name." }, { status: 400 });
  }
  const name = ((body as Record<string, string>).name ?? "").trim();
  if (!name || name.length > 50) {
    return Response.json({ error: "Collection names must be 1–50 characters." }, { status: 400 });
  }

  await connectDB();
  try {
    const collection = await Collection.create({ userId, name });
    return Response.json(
      { collection: { id: collection._id.toString(), name: collection.name } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
      return Response.json({ error: "You already have a collection with that name." }, { status: 409 });
    }
    throw error;
  }
}
