import { afterEach, describe, expect, test, vi } from "vitest";

import { emptyState } from "@/domain/types";
import { POST as CHAT } from "@/app/api/diagrams/[id]/chat/route";
import { runAskTurn } from "@/server/chat/ask";
import { setChatDepsForTest } from "@/server/chat/deps";
import { SESSION_GONE_MESSAGE, type ChatEvent } from "@/server/chat/events";
import { listMessages } from "@/server/chat/messages";
import { runChatTurn, type ChatDeps } from "@/server/chat/pipeline";
import type { ClefClient } from "@/server/llm/clef";
import type { QwenClient } from "@/server/llm/qwen";
import { createVersion, listVersions } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
// 잠금 전 확인과 잠금 사이에 세션을 지우려고 getSession 을 감싼다(기본은 그대로 부른다).
vi.mock("@/server/chat/sessions", async (orig) => {
  const m = await orig<typeof import("@/server/chat/sessions")>();
  return { ...m, getSession: vi.fn(m.getSession) };
});
import { auth } from "@/auth";
import { createSession, deleteSession, getSession, listSessions } from "@/server/chat/sessions";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const getSessionMock = vi.mocked(getSession);
const realGetSession = (await vi.importActual<typeof import("@/server/chat/sessions")>("@/server/chat/sessions")).getSession;

const clef: ClefClient = {
  async decide() {
    throw new Error("unused");
  },
  async classifyIntent() {
    return { intent: "question", confidence: 0.9 };
  },
};
const qwen: QwenClient & { called: number } = {
  called: 0,
  async streamCompletion(_m, { onDelta }) {
    qwen.called++;
    onDelta("답");
    return { text: "답", finishReason: "stop" };
  },
};
const deps: ChatDeps = { qwen, clef };

/** 다음 getSession 한 번: 행을 읽어 돌려주되, 돌려주기 전에 세션을 지운다(확인은 통과, 잠금 안에서는 없음). */
const deleteAfterCheck = () =>
  getSessionMock.mockImplementationOnce(async (d, id) => {
    const row = await realGetSession(d, id);
    await deleteSession(d, id);
    return row;
  });

afterEach(() => {
  getSessionMock.mockReset();
  getSessionMock.mockImplementation(realGetSession);
  setChatDepsForTest(null);
  authMock.mockReset();
  qwen.called = 0;
});

describe("a session deleted between the check and the lock", () => {
  test("runChatTurn writes nothing and ends with session_gone", async () => {
    const ids = await makeOwnedDiagram();
    const s = await createSession(ids.diagramId, { kind: "diagram" }, "a");
    deleteAfterCheck();
    const events: ChatEvent[] = [];
    const r = await runChatTurn({ ...ids, text: "x", session: { id: s.id }, signal: new AbortController().signal, emit: (e) => events.push(e) }, deps);
    expect(r).toEqual({ status: "session_gone" });
    expect(events).toEqual([{ t: "error", message: SESSION_GONE_MESSAGE }]);
    expect(qwen.called).toBe(0);
    expect(await listMessages(ids.diagramId)).toHaveLength(0);
    expect(await listSessions(ids.diagramId)).toHaveLength(0);
    expect(await listVersions(ids.diagramId)).toHaveLength(0);
  });

  test("runAskTurn on an existing node session writes nothing and ends with session_gone", async () => {
    const ids = await makeOwnedDiagram();
    const st = emptyState();
    st.nodes["n1"] = { id: "n1", kind: "web_server", label: "WEB", parent: null, attrs: {} };
    await createVersion(ids.diagramId, st, { source: "import" });
    const s = await createSession(ids.diagramId, { kind: "node", nodeId: "n1", nodeLabel: "WEB" }, "q");
    deleteAfterCheck();
    const events: ChatEvent[] = [];
    const r = await runAskTurn({ ...ids, nodeId: "n1", sessionId: s.id, text: "왜?", signal: new AbortController().signal, emit: (e) => events.push(e) }, deps);
    expect(r).toEqual({ status: "session_gone" });
    expect(events).toEqual([{ t: "error", message: SESSION_GONE_MESSAGE }]);
    expect(qwen.called).toBe(0);
    expect(await listSessions(ids.diagramId)).toHaveLength(0);
  });

  test("the /chat route answers 404 before streaming", async () => {
    const ids = await makeOwnedDiagram();
    const s = await createSession(ids.diagramId, { kind: "diagram" }, "a");
    setChatDepsForTest(deps);
    authMock.mockResolvedValue({ user: { id: ids.userId } });
    // 첫 번째는 route 의 확인(그대로), 두 번째(runChatTurn 의 잠금 전 확인)가 지운다.
    getSessionMock.mockImplementationOnce(realGetSession);
    deleteAfterCheck();
    const res = await CHAT(
      new Request(`http://localhost/api/diagrams/${ids.diagramId}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "x", sessionId: s.id }),
      }),
      { params: Promise.resolve({ id: ids.diagramId }) },
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: SESSION_GONE_MESSAGE });
    expect(qwen.called).toBe(0);
  });
});
