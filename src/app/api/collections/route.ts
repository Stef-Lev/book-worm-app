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

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();
  await connectDB();
  const collections = await Collection.find({ userId })
    .sort({ name: 1 })
    .lean();
  return Response.json({ collections: collections.map(toCollectionJson) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const body: unknown = await request.json().catch(() => null);
  const name = readCollectionName(body);
  if (!name) {
    return jsonError("Collection names must be 1–50 characters.", 400);
  }

  await connectDB();
  try {
    const collection = await Collection.create({ userId, name });
    return Response.json(
      { collection: toCollectionJson(collection) },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return jsonError("You already have a collection with that name.", 409);
    }
    throw error;
  }
}
