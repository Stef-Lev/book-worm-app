import { NextResponse } from "next/server";
import { registerUser } from "@/lib/register-user";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const result = await registerUser({
    name: body?.name,
    email: body?.email,
    password: body?.password,
  });

  if (result.ok) return NextResponse.json({ ok: true }, { status: 201 });
  if (result.error === "emailTaken") {
    return NextResponse.json({ error: "Email already registered." }, { status: 409 });
  }
  return NextResponse.json(
    { error: "Name, a valid email and a password of 8+ characters are required." },
    { status: 400 }
  );
}
