import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { db } from "@/db/client";
import { mcpKeys, users } from "@/db/schema";
import {
  MCP_KEY_LIMITS,
  createMcpKey,
  deleteMcpKey,
  hashKey,
  listMcpKeys,
  verifyMcpKey,
} from "@/server/mcpKeys";
import { NotFoundError, ValidationError } from "@/server/projects";

async function makeUser(): Promise<string> {
  const tag = randomUUID().slice(0, 8);
  const [user] = await db
    .insert(users)
    .values({ username: `u-${tag}`, email: `${tag}@example.com`, passwordHash: "x" })
    .returning({ id: users.id });
  return user.id;
}

describe("mcpKeys", () => {
  it("만든 키 원문은 DB 어디에도 없고 해시와 앞 8자만 남는다", async () => {
    const userId = await makeUser();
    const { id, key, prefix } = await createMcpKey(userId, "  내 노트북  ");
    expect(key.startsWith("isk_")).toBe(true);
    expect(key).toHaveLength(47);
    expect(prefix).toBe(key.slice(0, 8));

    const [row] = await db.select().from(mcpKeys).where(eq(mcpKeys.id, id));
    expect(row.hash).toBe(hashKey(key));
    expect(row.prefix).toBe(key.slice(0, 8));
    expect(row.name).toBe("내 노트북");
    expect(Object.values(row).some((v) => v === key)).toBe(false);
  });

  it("verifyMcpKey 는 userId 를 주고 lastUsedAt 을 채운다", async () => {
    const userId = await makeUser();
    const { key } = await createMcpKey(userId, "k");
    expect((await listMcpKeys(userId))[0].lastUsedAt).toBeNull();
    expect(await verifyMcpKey(key)).toBe(userId);
    expect((await listMcpKeys(userId))[0].lastUsedAt).toBeInstanceOf(Date);
  });

  it("deleted key is rejected", async () => {
    const userId = await makeUser();
    const { id, key } = await createMcpKey(userId, "k");
    await deleteMcpKey(userId, id);
    expect(await verifyMcpKey(key)).toBeNull();
  });

  it("다른 계정의 키·없는 키를 지우면 NotFoundError", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const { id } = await createMcpKey(owner, "k");
    await expect(deleteMcpKey(other, id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteMcpKey(owner, randomUUID())).rejects.toBeInstanceOf(NotFoundError);
    expect(await listMcpKeys(owner)).toHaveLength(1);
  });

  it("목록은 최근 만든 순이고 내 키만 나온다", async () => {
    const userId = await makeUser();
    const other = await makeUser();
    await createMcpKey(userId, "첫째");
    await createMcpKey(userId, "둘째");
    await createMcpKey(other, "남의 것");
    const list = await listMcpKeys(userId);
    expect(list.map((k) => k.name)).toEqual(["둘째", "첫째"]);
  });

  it("11번째 키와 빈·너무 긴 이름은 ValidationError", async () => {
    const userId = await makeUser();
    await expect(createMcpKey(userId, "   ")).rejects.toThrow("키 이름을 적어 주세요.");
    await expect(createMcpKey(userId, "a".repeat(MCP_KEY_LIMITS.name + 1))).rejects.toBeInstanceOf(
      ValidationError,
    );
    for (let i = 0; i < MCP_KEY_LIMITS.perUser; i++) await createMcpKey(userId, `k${i}`);
    await expect(createMcpKey(userId, "넘침")).rejects.toThrow("키는 10개까지 만들 수 있어요.");
  });

  it("형식이 아닌 값은 null", async () => {
    expect(await verifyMcpKey("isk_bogus")).toBeNull();
    expect(await verifyMcpKey("")).toBeNull();
    expect(await verifyMcpKey("Bearer x")).toBeNull();
    expect(await verifyMcpKey(`isk_${"A".repeat(43)}`)).toBeNull();
  });
});
