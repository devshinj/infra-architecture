import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { db } from "@/db/client";
import { infoChangeText, infoCounts } from "@/domain/infoCounts";
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

  test("saved commands are left out of listed messages unless asked for (only the chat pipeline needs them)", async () => {
    const d = await makeDiagram();
    const commands = [{ op: "add_node", id: "a", kind: "was", label: "a", parent: null }];
    await createMessage(d, "assistant", "추가합니다.", { intent: "structure_change", applied: 1, commands });
    const [plain] = await listMessages(d);
    expect(plain!.meta).toEqual({ intent: "structure_change", applied: 1 });
    const [full] = await listMessages(d, 100, null, { withCommands: true });
    expect(full!.meta.commands).toEqual(commands);
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
    expect(r.text).toBe("v1로 되돌림 (새 버전 v3)");
  });

  test("restore from history adds what changed in the info card to the system message", async () => {
    const d = await makeDiagram();
    const before = { ...s1, assumptions: { ...s1.assumptions, video_site: { key: "video_site", value: "알아서 정함", confirmed: false } } };
    await createVersion(d, s1, { source: "import" });
    await createVersion(d, before, { source: "ai" });
    const r = await restoreVersionWithMessage(d, 1, { describeChange: {} });
    const change = infoChangeText(infoCounts(before), infoCounts(s1));
    expect(change).toContain("미확정 가정");
    expect(r.text).toBe(`v1로 되돌림 (새 버전 v3)\n${change}`);
    const [m] = await listMessages(d);
    expect(m).toMatchObject({ role: "system", content: r.text });
    // 숫자가 하나도 안 바뀌면 그대로라고 한다.
    const same = await restoreVersionWithMessage(d, 1, { describeChange: {} });
    expect(same.text).toBe("v1로 되돌림 (새 버전 v4)\n구성 정보 숫자는 그대로예요");
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
