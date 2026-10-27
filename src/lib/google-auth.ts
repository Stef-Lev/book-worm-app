import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const isGoogleAuthEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

// Returns the Mongo user id for a Google account, linking it to an existing
// user with the same (Google-verified) email or creating a new user.
export async function findOrCreateGoogleUser(input: {
  googleId: string;
  email: string;
  name?: string | null;
}): Promise<string> {
  const email = input.email.toLowerCase().trim();
  await connectDB();

  const linked = await User.findOne({ googleId: input.googleId });
  if (linked) return linked._id.toString();

  const existing = await User.findOneAndUpdate(
    { email },
    { $set: { googleId: input.googleId } },
    { new: true },
  );
  if (existing) return existing._id.toString();

  const created = await User.create({
    name: input.name?.trim() || email.split("@")[0],
    email,
    googleId: input.googleId,
  });
  return created._id.toString();
}
