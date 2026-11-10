import { createHash, randomBytes } from "node:crypto";

import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { mcpKeys } from "@/db/schema";

import { NotFoundError, ValidationError } from "./projects";

export const MCP_KEY_LIMITS = { name: 40, perUser: 10 } as const;

const KEY_PREFIX = "isk_";
// isk_ + 32바이트를 base64url 로 쓴 43자
const KEY_PATTERN = /^isk_[A-Za-z0-9_-]{43}$/;

export function hashKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** 새 키를 만든다. 원문은 이 반환값으로만 한 번 볼 수 있고 저장하지 않는다. */
export async function createMcpKey(
  userId: string,
  name: string,
): Promise<{ id: string; key: string; prefix: string }> {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new ValidationError("키 이름을 적어 주세요.");
  if (trimmed.length > MCP_KEY_LIMITS.name) {
    throw new ValidationError(`키 이름은 ${MCP_KEY_LIMITS.name}자까지 적을 수 있어요.`);
  }

  const key = KEY_PREFIX + randomBytes(32).toString("base64url");
  const prefix = key.slice(0, 8);

  return db.transaction(async (tx) => {
    const [{ n }] = await tx
      .select({ n: count() })
      .from(mcpKeys)
      .where(eq(mcpKeys.userId, userId));
    if (n >= MCP_KEY_LIMITS.perUser) {
      throw new ValidationError(`키는 ${MCP_KEY_LIMITS.perUser}개까지 만들 수 있어요.`);
    }
    const [row] = await tx
      .insert(mcpKeys)
      .values({ userId, name: trimmed, prefix, hash: hashKey(key) })
      .returning({ id: mcpKeys.id });
    return { id: row.id, key, prefix };
  });
}

export async function listMcpKeys(userId: string): Promise<
  { id: string; name: string; prefix: string; createdAt: Date; lastUsedAt: Date | null }[]
> {
  return db
    .select({
      id: mcpKeys.id,
      name: mcpKeys.name,
      prefix: mcpKeys.prefix,
      createdAt: mcpKeys.createdAt,
      lastUsedAt: mcpKeys.lastUsedAt,
    })
    .from(mcpKeys)
    .where(eq(mcpKeys.userId, userId))
    .orderBy(desc(mcpKeys.createdAt));
}

export async function deleteMcpKey(userId: string, id: string): Promise<void> {
  const deleted = await db
    .delete(mcpKeys)
    .where(and(eq(mcpKeys.id, id), eq(mcpKeys.userId, userId)))
    .returning({ id: mcpKeys.id });
  if (deleted.length === 0) throw new NotFoundError();
}

/** 키 원문으로 계정을 찾는다. 형식이 아니면 DB 를 보지 않고 null. */
export async function verifyMcpKey(raw: string): Promise<string | null> {
  if (!KEY_PATTERN.test(raw)) return null;
  const [row] = await db
    .update(mcpKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(mcpKeys.hash, hashKey(raw)))
    .returning({ userId: mcpKeys.userId });
  return row?.userId ?? null;
}
