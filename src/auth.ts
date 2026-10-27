import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { TEST_USER, isTestLogin } from "@/lib/test-user";
import { findOrCreateGoogleUser, isGoogleAuthEnabled } from "@/lib/google-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    ...(isGoogleAuthEnabled ? [Google] : []),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        if (isTestLogin(email, password)) {
          return {
            id: TEST_USER.id,
            name: TEST_USER.name,
            email: TEST_USER.email,
          };
        }

        await connectDB();
        const user = await User.findOne({ email });
        if (
          !user?.passwordHash ||
          !(await bcrypt.compare(password, user.passwordHash))
        ) {
          return null;
        }

        return { id: user._id.toString(), name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider === "google") {
        return Boolean(profile?.email && profile.email_verified);
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        token.id = await findOrCreateGoogleUser({
          googleId: account.providerAccountId,
          email: profile.email,
          name: profile.name,
        });
      } else if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
