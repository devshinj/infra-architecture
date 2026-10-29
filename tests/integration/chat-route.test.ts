import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { db } from "@/db/client";
import { diagramVersions } from "@/db/schema";
import { POST } from "@/app/api/diagrams/[id]/chat/route";
import { setChatDepsForTest } from "@/server/chat/deps";
import type { ChatEvent } from "@/server/chat/events";
import type { ChatDeps } from "@/server/chat/pipeline";
import type { ClefClient } from "@/server/llm/clef";
import type { QwenClient } from "@/server/llm/qwen";

import { makeOwnedDiagram } from "./helpers";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
import { auth } from "@/auth";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;

const clef: ClefClient = {
  async decide() {
    throw new Error("unused");
  },
  async classifyIntent() {
    return { intent: "structure_change", confidence: 0.9 };
  },
};

const LINES = [
  JSON.stringify({ op: "say", text: "그리는 중" }),
  JSON.stringify({ op: "add_node", id: "web-1", kind: "web_server", label: "WEB#1", parent: null }),
].join("\n");

function qwenOf(text: string, gate?: Promise<void>): QwenClient {
  return {
    async streamCompletion(_m, { signal, onDelta }) {
      if (gate) await gate;
      for (let i = 0; i < text.length; i += 20) {
        if (signal.aborted) throw new DOMException("aborted", "AbortError");
        onDelta(text.slice(i, i + 20));
        await new Promise((r) => setImmediate(r));
      }
      return { text, finishReason: "stop" };
    },
  };
}

function req(id: string, body: unknown, signal?: AbortSignal) {
  return new Request(`http://localhost/api/diagrams/${id}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}
const call = (id: string, body: unknown, signal?: AbortSignal) =>
  POST(req(id, body, signal), { params: Promise.resolve({ id }) });

async function readEvents(res: Response): Promise<ChatEvent[]> {
  const text = await res.text();
  return text.split("\n").filter(Boolean).map((l) => JSON.parse(l) as ChatEvent);
}

beforeEach(() => {
  setChatDepsForTest({ qwen: qwenOf(LINES), clef });
});
afterEach(() => {
  setChatDepsForTest(null);
  authMock.mockReset();
});

describe("POST /api/diagrams/:id/chat", () => {
  test("streams ndjson events in order and ends with done", async () => {
    const ids = await makeOwnedDiagram();
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    const res = await call(ids.diagramId, { text: "웹서버 그려줘" });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/x-ndjson; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-accel-buffering")).toBe("no");
    const events = await readEvents(res);
    expect(events[0]!.t).toBe("start");
    expect(events.map((e) => e.t)).toContain("cmd");
    expect(events.at(-1)).toMatchObject({ t: "done", status: "complete", applied: 1 });
  });

  test("401 without session, 404 for another user's diagram, 400 for bad text", async () => {
    const ids = await makeOwnedDiagram();
    const other = await makeOwnedDiagram();
    authMock.mockResolvedValue(null);
    const r401 = await call(ids.diagramId, { text: "x" });
    expect(r401.status).toBe(401);
    expect(await r401.json()).toEqual({ error: "로그인이 필요해요." });

    authMock.mockResolvedValue({ user: { id: other.userId } });
    const r404 = await call(ids.diagramId, { text: "x" });
    expect(r404.status).toBe(404);
    expect(await r404.json()).toEqual({ error: "구성도를 찾을 수 없어요." });

    authMock.mockResolvedValue({ user: { id: ids.userId } });
    for (const body of [{ text: "" }, { text: "a".repeat(4001) }, {}, { text: 3 }]) {
      const r = await call(ids.diagramId, body);
      expect(r.status).toBe(400);
      expect(await r.json()).toEqual({ error: "메시지를 1~4000자로 입력해 주세요." });
    }
    const bad = await POST(
      new Request("http://localhost/x", { method: "POST", body: "{nope" }),
      { params: Promise.resolve({ id: ids.diagramId }) },
    );
    expect(bad.status).toBe(400);
  });

  test("409 when a turn is already running", async () => {
    const ids = await makeOwnedDiagram();
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    setChatDepsForTest({ qwen: qwenOf(LINES, gate), clef });
    const first = await call(ids.diagramId, { text: "하나" });
    expect(first.status).toBe(200);
    const second = await call(ids.diagramId, { text: "둘" });
    expect(second.status).toBe(409);
    expect(await second.json()).toEqual({ error: "다른 응답을 처리하고 있어요. 끝난 뒤 다시 보내 주세요." });
    release();
    const events = await readEvents(first);
    expect(events.at(-1)!.t).toBe("done");
  });

  test("client disconnect aborts the turn", async () => {
    const ids = await makeOwnedDiagram();
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    const long = Array.from({ length: 200 }, (_, i) =>
      JSON.stringify({ op: "add_node", id: `n-${i}`, kind: "web_server", label: `N${i}`, parent: null }),
    ).join("\n");
    setChatDepsForTest({ qwen: qwenOf(long), clef });
    const ac = new AbortController();
    const res = await call(ids.diagramId, { text: "많이" }, ac.signal);
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let seen = "";
    while (!seen.includes('"t":"cmd"')) {
      const { value, done } = await reader.read();
      if (done) break;
      seen += dec.decode(value);
    }
    ac.abort();
    await reader.cancel().catch(() => {});
    await vi.waitFor(
      async () => {
        const vs = await db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, ids.diagramId));
        expect(vs.map((v) => v.status)).toContain("aborted");
      },
      { timeout: 5000 },
    );
  });
});
