import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/chat/deps", () => ({ defaultChatDeps: () => ({ qwen: null, clef: {} }) }));
vi.mock("@/server/chat/sessions", () => ({ getSession: vi.fn() }));
vi.mock("@/server/chat/ask", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/chat/ask")>()),
  runAskTurn: vi.fn(),
}));
vi.mock("@/server/projects", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/projects")>()),
  getOwnedDiagram: vi.fn(),
}));

import { POST } from "@/app/api/diagrams/[id]/ask/route";
import { auth } from "@/auth";
import { NODE_GONE_MESSAGE, runAskTurn } from "@/server/chat/ask";
import type { ChatEvent } from "@/server/chat/events";
import { getSession, type SessionRow } from "@/server/chat/sessions";
import { getOwnedDiagram, NotFoundError, ValidationError } from "@/server/projects";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const runMock = vi.mocked(runAskTurn);
const ownedMock = vi.mocked(getOwnedDiagram);
const sessionMock = vi.mocked(getSession);

const DIAGRAM = "11111111-1111-4111-8111-111111111111";
const SESSION = "22222222-2222-4222-8222-222222222222";
const BUSY = "다른 응답을 처리하고 있어요. 끝난 뒤 다시 보내 주세요.";
const BAD_BODY = "메시지를 1~4000자로 입력해 주세요.";
const NOT_FOUND = "구성도를 찾을 수 없어요.";

const row: SessionRow = {
  id: SESSION,
  diagramId: DIAGRAM,
  nodeId: "was-1",
  nodeLabel: "WAS#1",
  title: "t",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function call(body: unknown, contentType = "application/json") {
  const req = new Request(`http://localhost/api/diagrams/${DIAGRAM}/ask`, {
    method: "POST",
    headers: { "content-type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return POST(req, { params: Promise.resolve({ id: DIAGRAM }) });
}

function signedIn() {
  authMock.mockResolvedValue({ user: { id: "u1" } });
  ownedMock.mockResolvedValue({ id: DIAGRAM, name: "d", projectId: "p", projectName: "p", pinnedPositions: {} });
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("POST /api/diagrams/:id/ask", () => {
  test("401 without a session", async () => {
    authMock.mockResolvedValue(null);
    const res = await call({ nodeId: "was-1", text: "x" });
    expect(res.status).toBe(401);
  });

  test("400 for a bad body", async () => {
    signedIn();
    for (const body of [{ nodeId: "was-1", text: "  " }, { nodeId: "", text: "x" }, { nodeId: "a".repeat(201), text: "x" }, { text: "x" }, { nodeId: "was-1", text: "a".repeat(4001) }, { nodeId: "was-1", text: "x", sessionId: "nope" }]) {
      const res = await call(body);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: BAD_BODY });
    }
    expect((await call("{nope")).status).toBe(400);
    expect((await call({ nodeId: "was-1", text: "x" }, "text/plain")).status).toBe(400);
    expect(runMock).not.toHaveBeenCalled();
  });

  test("404 for another user's diagram or session", async () => {
    signedIn();
    ownedMock.mockRejectedValueOnce(new NotFoundError());
    const r1 = await call({ nodeId: "was-1", text: "x" });
    expect(r1.status).toBe(404);
    expect(await r1.json()).toEqual({ error: NOT_FOUND });

    sessionMock.mockResolvedValueOnce(null);
    const r2 = await call({ nodeId: "was-1", text: "x", sessionId: SESSION });
    expect(r2.status).toBe(404);
    expect(sessionMock).toHaveBeenCalledWith(DIAGRAM, SESSION);
    expect(runMock).not.toHaveBeenCalled();
  });

  test("400 when the session belongs to another node", async () => {
    signedIn();
    sessionMock.mockResolvedValueOnce(row);
    const res = await call({ nodeId: "db-1", text: "x", sessionId: SESSION });
    expect(res.status).toBe(400);
    expect(runMock).not.toHaveBeenCalled();
  });

  test("409 when busy or the node is gone", async () => {
    signedIn();
    runMock.mockImplementationOnce(async ({ emit }) => {
      emit({ t: "error", message: BUSY });
      return { status: "busy" };
    });
    const busy = await call({ nodeId: "was-1", text: "x" });
    expect(busy.status).toBe(409);
    expect(await busy.json()).toEqual({ error: BUSY });

    runMock.mockImplementationOnce(async ({ emit }) => {
      emit({ t: "error", message: NODE_GONE_MESSAGE });
      return { status: "gone" };
    });
    const gone = await call({ nodeId: "was-1", text: "x" });
    expect(gone.status).toBe(409);
    expect(await gone.json()).toEqual({ error: NODE_GONE_MESSAGE });
  });

  test("errors thrown by the turn map to 404 and 400", async () => {
    signedIn();
    runMock.mockRejectedValueOnce(new NotFoundError());
    expect((await call({ nodeId: "was-1", text: "x" })).status).toBe(404);
    runMock.mockRejectedValueOnce(new ValidationError("x"));
    expect((await call({ nodeId: "was-1", text: "x" })).status).toBe(400);
  });

  test("streams ndjson events for a running turn", async () => {
    signedIn();
    sessionMock.mockResolvedValueOnce(row);
    const done: ChatEvent = { t: "done", version: null, status: "complete", applied: 0, skipped: 0, missing: 0, nodes: 1, edges: 0, assistantMessageId: "m2" };
    runMock.mockImplementationOnce(async ({ emit }) => {
      emit({ t: "start", messageId: "m1", intent: "question" });
      emit({ t: "answer", delta: "답" });
      emit(done);
      return { status: "ok" };
    });
    const res = await call({ nodeId: "was-1", text: "  뭐야?  ", sessionId: SESSION });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/x-ndjson; charset=utf-8");
    const events = (await res.text()).split("\n").filter(Boolean).map((l) => JSON.parse(l) as ChatEvent);
    expect(events.map((e) => e.t)).toEqual(["start", "answer", "done"]);
    expect(runMock.mock.calls[0]![0]).toMatchObject({ userId: "u1", diagramId: DIAGRAM, nodeId: "was-1", sessionId: SESSION, text: "뭐야?" });
  });
});
