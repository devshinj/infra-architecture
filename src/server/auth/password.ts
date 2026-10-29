import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { users } from "@/db/schema";

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<{ id: string; username: string } | null> {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? { id: user.id, username: user.username } : null;
}
