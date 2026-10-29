import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { db } from "@/db/client";
import { diagramVersions, messages, users } from "@/db/schema";
import { createMessage, listMessages } from "@/server/chat/messages";
import { getOwnedDiagram, NotFoundError } from "@/server/projects";
import { createVersion, restoreVersionWithMessage } from "@/server/versions";

import { fx } from "../fixtures/spike";
import { makeDiagram } from "./helpers";

const s1 = fx("s1");

describe("chat messages", () => {
  test("messages are listed oldest first and limited", async () => {
    const d = await makeDiagram();
    for (let i = 1; i <= 5; i++) await createMessage(d, i % 2 ? "user" : "assistant", `m${i}`, { intent: "x" });
    const all = await listMessages(d);
    expect(all.map((m) => m.content)).toEqual(["m1", "m2", "m3", "m4", "m5"]);
    expect(all[0]).toMatchObject({ role: "user", meta: { intent: "x" } });
    const last = await listMessages(d, 2);
    expect(last.map((m) => m.content)).toEqual(["m4", "m5"]);
  });

  test("version can link to the message that produced it; deleting the message keeps the version", async () => {
    const d = await makeDiagram();
    const msg = await createMessage(d, "user", "서버 추가");
    await createVersion(d, s1, { source: "ai", messageId: msg.id });
    const [v] = await db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, d));
    expect(v.messageId).toBe(msg.id);
    await db.delete(messages).where(eq(messages.id, msg.id));
    const [after] = await db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, d));
    expect(after.messageId).toBeNull();
    expect(after.number).toBe(1);
  });

  test("restore adds a system message", async () => {
    const d = await makeDiagram();
    await createVersion(d, s1, { source: "import" });
    await createVersion(d, s1, { source: "ai" });
    const r = await restoreVersionWithMessage(d, 1);
    expect(r.number).toBe(3);
    const list = await listMessages(d);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ role: "system", content: "v1로 되돌림 (새 버전 v3)" });
  });

  test("other user's diagram messages are not found", async () => {
    const d = await makeDiagram();
    const [other] = await db
      .insert(users)
      .values({ username: "other", email: "other@example.com", passwordHash: "x" })
      .returning({ id: users.id });
    await expect(getOwnedDiagram(other.id, d)).rejects.toBeInstanceOf(NotFoundError);
  });
});
