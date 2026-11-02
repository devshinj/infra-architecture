import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { db } from "@/db/client";
import { chatSessions, diagrams, messages } from "@/db/schema";
import { createMessage, listMessages } from "@/server/chat/messages";
import { createSession, getSession, listSessions, SESSION_LIST_LIMIT, touchSession } from "@/server/chat/sessions";

import { makeDiagram } from "./helpers";

describe("chat sessions", () => {
  test("createSession trims title to 60 chars and folds whitespace", async () => {
    const d = await makeDiagram();
    const s = await createSession(d, "n1", "웹 서버", `  첫   질문\n이다 ${"가".repeat(80)}  `);
    expect(s.title.startsWith("첫 질문 이다 가")).toBe(true);
    expect(s.title).toHaveLength(60);
    expect(s).toMatchObject({ diagramId: d, nodeId: "n1", nodeLabel: "웹 서버" });
  });

  test("listSessions returns newest updated first and only for the diagram", async () => {
    const d = await makeDiagram();
    const other = await makeDiagram();
    const a = await createSession(d, "n1", "A", "a");
    const b = await createSession(d, "n2", "B", "b");
    await createSession(other, "n1", "A", "x");
    expect((await listSessions(d)).map((s) => s.id)).toEqual([b.id, a.id]);
    await touchSession(a.id);
    expect((await listSessions(d)).map((s) => s.id)).toEqual([a.id, b.id]);
  });

  test("title has no trailing space after the 60-codepoint cut", async () => {
    const d = await makeDiagram();
    const s = await createSession(d, "n1", "A", `${"가".repeat(59)} 나다라`);
    expect(s.title).toBe("가".repeat(59));
  });

  test("listSessions returns only the most recent SESSION_LIST_LIMIT", async () => {
    const d = await makeDiagram();
    expect(SESSION_LIST_LIMIT).toBe(50);
    const made = [];
    for (let i = 0; i < 55; i++) made.push(await createSession(d, "n1", "A", `q${i}`));
    const list = await listSessions(d);
    expect(list).toHaveLength(50);
    expect(list[0]!.id).toBe(made[54]!.id);
    expect(list.at(-1)!.id).toBe(made[5]!.id);
  });

  test("getSession returns null for another diagram's session", async () => {
    const d = await makeDiagram();
    const other = await makeDiagram();
    const s = await createSession(d, "n1", "A", "a");
    expect((await getSession(d, s.id))?.id).toBe(s.id);
    expect(await getSession(other, s.id)).toBeNull();
  });

  test("listMessages without session excludes session messages", async () => {
    const d = await makeDiagram();
    const s = await createSession(d, "n1", "A", "a");
    await createMessage(d, "user", "main");
    await createMessage(d, "user", "ask", {}, s.id);
    expect((await listMessages(d)).map((m) => m.content)).toEqual(["main"]);
  });

  test("listMessages with session returns only that session", async () => {
    const d = await makeDiagram();
    const s1 = await createSession(d, "n1", "A", "a");
    const s2 = await createSession(d, "n2", "B", "b");
    await createMessage(d, "user", "main");
    await createMessage(d, "user", "q1", {}, s1.id);
    await createMessage(d, "assistant", "a1", {}, s1.id);
    await createMessage(d, "user", "q2", {}, s2.id);
    expect((await listMessages(d, 100, s1.id)).map((m) => m.content)).toEqual(["q1", "a1"]);
  });

  test("deleting the diagram cascades sessions and their messages", async () => {
    const d = await makeDiagram();
    const s = await createSession(d, "n1", "A", "a");
    await createMessage(d, "user", "q", {}, s.id);
    await db.delete(diagrams).where(eq(diagrams.id, d));
    expect(await db.select().from(chatSessions).where(eq(chatSessions.id, s.id))).toHaveLength(0);
    expect(await db.select().from(messages).where(eq(messages.sessionId, s.id))).toHaveLength(0);
  });
});
