import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { NEW_SESSION, type SessionSummary, useSessions } from "@/ui/chat/useSessions";

afterEach(() => vi.unstubAllGlobals());

const s = (id: string, updatedAt: string): SessionSummary => ({ id, kind: "node", nodeId: "n1", nodeLabel: "API 서버", title: id, updatedAt });

test("loads a session's lines once on first select", async () => {
  const fetchMock = vi.fn(async () =>
    Response.json({
      session: s("a", "2026-11-01T00:00:00Z"),
      messages: [
        { id: "u1", role: "user", content: "왜 두 대예요?", meta: {}, createdAt: "2026-11-01T00:00:00Z" },
        { id: "m1", role: "assistant", content: "이중화예요.", meta: { applied: 0, version: null, status: "complete" }, createdAt: "2026-11-01T00:00:01Z" },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [s("a", "2026-11-01T00:00:00Z")] }));
  expect(result.current.active).toBe("main");
  act(() => result.current.select("a"));
  expect(result.current.active).toBe("a");
  expect(result.current.linesOf("a")).toBe("loading");
  await waitFor(() => expect(result.current.linesOf("a")).not.toBe("loading"));
  expect(fetchMock).toHaveBeenCalledWith("/api/diagrams/d1/sessions/a", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  const lines = result.current.linesOf("a");
  expect(lines !== "loading" && lines.map((l) => [l.kind, l.text])).toEqual([["user", "왜 두 대예요?"], ["assistant", "이중화예요."]]);
  act(() => result.current.select("main"));
  act(() => result.current.select("a"));
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("upsert moves a session to the top", () => {
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [s("a", "2026-11-01T02:00:00Z"), s("b", "2026-11-01T01:00:00Z")] }));
  act(() => result.current.upsert(s("b", "2026-11-01T03:00:00Z")));
  expect(result.current.sessions.map((x) => x.id)).toEqual(["b", "a"]);
  act(() => result.current.upsert(s("c", "2026-11-01T04:00:00Z")));
  expect(result.current.sessions.map((x) => x.id)).toEqual(["c", "b", "a"]);
});

test("a new session's lines move to its id when the server names it", () => {
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [] }));
  act(() => result.current.startNew({ nodeId: "n1", nodeLabel: "API 서버", text: "  왜   두 대예요? " }));
  expect(result.current.active).toBe(NEW_SESSION);
  expect(result.current.summaryOf(NEW_SESSION)).toMatchObject({ nodeId: "n1", title: "왜 두 대예요?" });
  act(() => result.current.setLines(NEW_SESSION, (ls) => [...ls, { id: "u", kind: "user", text: "왜 두 대예요?" }]));
  act(() => result.current.upsert(s("x", "2026-11-01T04:00:00Z")));
  expect(result.current.active).toBe("x");
  expect(result.current.summaryOf(NEW_SESSION)).toBeNull();
  const lines = result.current.linesOf("x");
  expect(lines !== "loading" && lines.map((l) => l.text)).toEqual(["왜 두 대예요?"]);
});

const histRes = () =>
  Response.json({ session: s("a", "2026-11-01T00:00:00Z"), messages: [{ id: "u1", role: "user", content: "옛 질문", meta: {}, createdAt: "2026-11-01T00:00:00Z" }] });

test("a load that finishes after the running turn appended lines merges history first, then the turn's lines", async () => {
  let release!: (r: Response) => void;
  const fetchMock = vi
    .fn()
    .mockRejectedValueOnce(new Error("net"))
    .mockImplementationOnce(() => new Promise<Response>((r) => (release = r)));
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [s("a", "2026-11-01T00:00:00Z")] }));
  act(() => result.current.select("a"));
  await waitFor(() => expect(result.current.linesOf("a")).not.toBe("loading"));
  // 차례가 도는 중에 다시 고른다.
  act(() => result.current.select("a"));
  expect(result.current.linesOf("a")).toBe("loading");
  act(() => result.current.setLines("a", (ls) => [...ls, { id: "t1", kind: "assistant", text: "새 답" }]));
  await act(async () => release(histRes()));
  await waitFor(() => {
    const l = result.current.linesOf("a");
    expect(l !== "loading" && l.map((x) => x.text)).toEqual(["옛 질문", "새 답"]);
  });
});

test("switching sessions aborts the in-flight load without an error line", async () => {
  const signals: AbortSignal[] = [];
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    const sig = init!.signal!;
    signals.push(sig);
    return new Promise<Response>((_, reject) => sig.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
  });
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [s("a", "2026-11-01T00:00:00Z"), s("b", "2026-11-01T00:00:00Z")] }));
  act(() => result.current.select("a"));
  act(() => result.current.select("b"));
  expect(signals[0]!.aborted).toBe(true);
  expect(signals[1]!.aborted).toBe(false);
  await act(async () => {});
  // 끊긴 세션은 오류 줄 없이 비워 두어 다시 고르면 다시 불러온다.
  expect(result.current.linesOf("a")).toEqual([]);
  act(() => result.current.select("a"));
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

test("unmount aborts the in-flight load", () => {
  let sig: AbortSignal | undefined;
  vi.stubGlobal("fetch", vi.fn((_u: string, init?: RequestInit) => ((sig = init!.signal!), new Promise<Response>(() => {}))));
  const { result, unmount } = renderHook(() => useSessions({ diagramId: "d1", initial: [s("a", "2026-11-01T00:00:00Z")] }));
  act(() => result.current.select("a"));
  unmount();
  expect(sig!.aborted).toBe(true);
});

test("titles drop a trailing space left by the 60-codepoint cut", () => {
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [] }));
  act(() => result.current.startNew({ nodeId: "n1", nodeLabel: "A", text: `${"가".repeat(59)} 나다라` }));
  expect(result.current.summaryOf(NEW_SESSION)!.title).toBe("가".repeat(59));
});

const dupRes = (withReply: boolean) =>
  Response.json({
    session: s("a", "2026-11-01T00:00:00Z"),
    messages: [
      { id: "db-u1", role: "user", content: "이어 묻기", meta: {}, createdAt: "2026-11-01T00:00:00Z" },
      ...(withReply ? [{ id: "db-m1", role: "assistant", content: "이어 답", meta: { applied: 0, version: null, status: "complete" }, createdAt: "2026-11-01T00:00:01Z" }] : []),
    ],
  });

test.each([false, true])("merge drops turn lines already in the loaded history (reply saved: %s)", async (withReply) => {
  let release!: (r: Response) => void;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((r) => (release = r))));
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [s("a", "2026-11-01T00:00:00Z")] }));
  act(() => result.current.select("a"));
  act(() =>
    result.current.setLines("a", (ls) => [...ls, { id: "l-1", kind: "user", text: "이어 묻기" }, { id: "a-1", kind: "assistant", text: "이어 답" }]),
  );
  await act(async () => release(dupRes(withReply)));
  await waitFor(() => {
    const l = result.current.linesOf("a");
    expect(l).not.toBe("loading");
    const texts = (l as { text: string }[]).map((x) => x.text);
    expect(texts.filter((t) => t === "이어 묻기")).toHaveLength(1);
    expect(texts.filter((t) => t === "이어 답")).toHaveLength(1);
  });
});

test("a session holding turn lines whose load was aborted is reloaded and merged on reselect", async () => {
  const calls: AbortSignal[] = [];
  let release!: (r: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn((_u: string, init?: RequestInit) => {
      calls.push(init!.signal!);
      if (calls.length === 1) return new Promise<Response>((_, rej) => init!.signal!.addEventListener("abort", () => rej(new DOMException("a", "AbortError"))));
      return new Promise<Response>((r) => (release = r));
    }),
  );
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [s("a", "2026-11-01T00:00:00Z")] }));
  act(() => result.current.select("a"));
  act(() => result.current.setLines("a", (ls) => [...ls, { id: "t1", kind: "assistant", text: "새 답" }]));
  act(() => result.current.select("main"));
  expect(calls[0]!.aborted).toBe(true);
  act(() => result.current.select("a"));
  expect(calls).toHaveLength(2);
  expect(result.current.linesOf("a")).not.toBe("loading");
  await act(async () => release(histRes()));
  await waitFor(() => {
    const l = result.current.linesOf("a");
    expect(l !== "loading" && l.map((x) => x.text)).toEqual(["옛 질문", "새 답"]);
  });
});

const chatS = (id: string, title: string, updatedAt: string): SessionSummary => ({ id, kind: "diagram", nodeId: null, nodeLabel: null, title, updatedAt });

test("startNewDiagram opens an empty 새 대화 draft, titled from the first message once sent, and moves to the server id", () => {
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [] }));
  act(() => result.current.startNewDiagram());
  expect(result.current.active).toBe(NEW_SESSION);
  expect(result.current.summaryOf(NEW_SESSION)).toMatchObject({ kind: "diagram", nodeId: null, title: "새 대화" });
  expect(result.current.linesOf(NEW_SESSION)).toEqual([]);
  act(() => result.current.startNewDiagram("  웹   서버 \n하나 "));
  expect(result.current.summaryOf(NEW_SESSION)).toMatchObject({ title: "웹 서버 하나" });
  act(() => result.current.setLines(NEW_SESSION, (ls) => [...ls, { id: "u", kind: "user", text: "웹 서버 하나" }]));
  act(() => result.current.upsert(chatS("c1", "웹 서버 하나", "2026-11-01T04:00:00Z")));
  expect(result.current.active).toBe("c1");
  expect(result.current.pending).toBeNull();
  const lines = result.current.linesOf("c1");
  expect(lines !== "loading" && lines.map((l) => l.text)).toEqual(["웹 서버 하나"]);
});

test("rename PATCHes the title and keeps the order; a failure returns the server's message", async () => {
  const fetchMock = vi
    .fn<(u: string, i?: RequestInit) => Promise<Response>>()
    .mockResolvedValueOnce(Response.json({ session: chatS("b", "새 이름", "2026-11-01T01:00:00Z") }))
    .mockResolvedValueOnce(Response.json({ error: "대화 이름은 1~60자로 입력해 주세요." }, { status: 400 }));
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() =>
    useSessions({ diagramId: "d1", initial: [chatS("a", "a", "2026-11-01T02:00:00Z"), chatS("b", "b", "2026-11-01T01:00:00Z")] }),
  );
  let err: string | void = "x";
  await act(async () => {
    err = await result.current.rename("b", "  새 이름 ");
  });
  expect(err).toBeUndefined();
  expect(fetchMock).toHaveBeenCalledWith("/api/diagrams/d1/sessions/b", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ title: "  새 이름 " }) }));
  expect(result.current.sessions.map((s) => [s.id, s.title])).toEqual([["a", "a"], ["b", "새 이름"]]);
  await act(async () => {
    err = await result.current.rename("b", "x");
  });
  expect(err).toBe("대화 이름은 1~60자로 입력해 주세요.");
  expect(result.current.sessions[1]!.title).toBe("새 이름");
});

test("remove DELETEs the session, drops its lines, and leaves it for 기본 대화 when it was open", async () => {
  const fetchMock = vi
    .fn<(u: string, i?: RequestInit) => Promise<Response>>()
    .mockResolvedValueOnce(Response.json({ error: "다른 응답을 처리하고 있어요. 끝난 뒤 다시 보내 주세요." }, { status: 409 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [chatS("a", "a", "2026-11-01T02:00:00Z"), s("b", "2026-11-01T01:00:00Z")] }));
  act(() => result.current.upsert(chatS("a", "a", "2026-11-01T03:00:00Z")));
  act(() => result.current.setLines("a", [{ id: "u", kind: "user", text: "hi" }]));
  act(() => result.current.select("a"));
  let err: string | void = "unset";
  await act(async () => {
    err = await result.current.remove("a");
  });
  expect(err).toBe("다른 응답을 처리하고 있어요. 끝난 뒤 다시 보내 주세요.");
  expect(result.current.active).toBe("a");
  await act(async () => {
    err = await result.current.remove("a");
  });
  expect(err).toBeUndefined();
  expect(fetchMock).toHaveBeenLastCalledWith("/api/diagrams/d1/sessions/a", { method: "DELETE" });
  expect(result.current.active).toBe("main");
  expect(result.current.sessions.map((x) => x.id)).toEqual(["b"]);
  expect(result.current.linesOf("a")).toEqual([]);
});
