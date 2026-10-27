"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { registerUser } from "@/lib/register-user";

export type AuthFormState = {
  error?: "invalidCredentials" | "invalidInput" | "emailTaken" | "generic";
};

async function signInWithCredentials(email: string, password: string): Promise<AuthFormState> {
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: err.type === "CredentialsSignin" ? "invalidCredentials" : "generic" };
    }
    // signIn signals a successful redirect by throwing
    throw err;
  }
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  return signInWithCredentials(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");

  const result = await registerUser({ name, email, password });
  if (!result.ok) return { error: result.error };

  return signInWithCredentials(String(email), String(password));
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
