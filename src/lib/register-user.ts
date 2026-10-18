import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export type RegisterResult = { ok: true } | { ok: false; error: "invalidInput" | "emailTaken" };

export async function registerUser(input: {
  name: unknown;
  email: unknown;
  password: unknown;
}): Promise<RegisterResult> {
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").toLowerCase().trim();
  const password = String(input.password ?? "");

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
    return { ok: false, error: "invalidInput" };
  }

  await connectDB();
  if (await User.exists({ email })) return { ok: false, error: "emailTaken" };

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email, passwordHash });
  return { ok: true };
}
