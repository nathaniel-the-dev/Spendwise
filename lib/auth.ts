import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { accounts, authenticators, sessions, users, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { authenticator } from "otplib";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
            totpCode: z.string().optional(),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        const { email, password, totpCode } = parsed.data;

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user?.hashedPassword) return null;

        const isValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isValid) return null;

        if (user.twoFactorEnabled) {
          if (!totpCode) throw new Error("2FA_REQUIRED");
          const isValid2FA = authenticator.verify({
            token: totpCode,
            secret: user.twoFactorSecret!,
          });
          if (!isValid2FA) return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
