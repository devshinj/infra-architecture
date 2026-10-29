import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";
import { verifyCredentials } from "./server/auth/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "");
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;
        const user = await verifyCredentials(username, password);
        return user ? { id: user.id, name: user.username } : null;
      },
    }),
  ],
});
