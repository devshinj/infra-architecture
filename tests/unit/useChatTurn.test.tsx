import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import type { Command } from "@/domain/commands";
import type { ChatEvent } from "@/server/chat/events";
import { useChatTurn } from "@/ui/chat/useChatTurn";

const enc = new TextEncoder();
const nd = (evs: ChatEvent[]) => evs.map((e) => JSON.stringify(e) + "\n").join("");

function streamOf(chunks: string[], signal?: AbortSignal, hang = false): Response {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch));
      if (hang) signal?.addEventListener("abort", () => c.error(new DOMException("aborted", "AbortError")));
      else c.close();
    },
  });
  return new Response(body, { status: 200 });
}

const done = (o: Partial<Extract<ChatEvent, { t: "done" }>> = {}): ChatEvent => ({
  t: "done", version: 2, status: "complete", applied: 2, skipped: 1, nodes: 3, edges: 1, assistantMessageId: "m", missing: 0, ...o,
});
const add = (id: string): Command => ({ op: "add_node", id, kind: "server", label: id, parent: null });

function setup() {
  const onCommand = vi.fn();
  const onDone = vi.fn();
  const onOpenHistory = vi.fn();
  const onInterrupted = vi.fn();
  const onRelayout = vi.fn();
  const hook = renderHook(() => useChatTurn({ diagramId: "d1", initial: [], onCommand, onDone, onOpenHistory, onInterrupted, onRelayout }));
  return { ...hook, onCommand, onDone, onOpenHistory, onInterrupted, onRelayout };
}

afterEach(() => vi.unstubAllGlobals());

test("cmd events are forwarded in order and say lines appear as progress", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([
    { t: "start", messageId: "m", intent: null }, { t: "say", text: "웹 서버를 놓을게요" },
    { t: "cmd", cmd: add("a") }, { t: "cmd", cmd: add("b") }, done(),
  ])])));
  const h = setup();
  await act(() => h.result.current.send("만들어줘"));
  expect(h.onCommand.mock.calls.map((c) => c[0].id)).toEqual(["a", "b"]);
  expect(h.result.current.lines.map((l) => l.kind)).toEqual(["user", "card", "progress", "summary"]);
  expect(h.result.current.busy).toBe(false);
});

test("relayout event calls onRelayout; the no-change card and chip are dropped", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([
    { t: "start", messageId: "m", intent: "layout" }, { t: "say", text: "구성도를 다시 정렬했어요." },
    { t: "relayout" }, done({ version: null, applied: 0, skipped: 0 }),
  ])])));
  const h = setup();
  await act(() => h.result.current.send("정리해줘"));
  expect(h.onRelayout).toHaveBeenCalledTimes(1);
  expect(h.onCommand).not.toHaveBeenCalled();
  // 카드는 치우고 안내 줄만 남는다("변경 사항이 없어요." 칩은 정렬 안내와 어긋나 두지 않는다).
  expect(h.result.current.lines.map((l) => l.kind)).toEqual(["user", "progress"]);
});

test("done adds the summary line and calls onDone", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([done()])])));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.result.current.lines.at(-1)).toMatchObject({ kind: "summary", text: "노드 3 · 연결 1 · 2곳 바꿨어요" });
  expect(h.onDone).toHaveBeenCalledTimes(1);
});

test("answer deltas append to one assistant line; no summary for answer-only turns", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([
    { t: "answer", delta: "안녕" }, { t: "answer", delta: "하세요" }, done({ version: null, applied: 0, skipped: 0 }),
  ])])));
  const h = setup();
  await act(() => h.result.current.send("?"));
  // 답변만 한 차례는 진행 카드를 남기지 않는다(다시 불러온 모양과 같다).
  expect(h.result.current.lines.map((l) => [l.kind, l.text])).toEqual([["user", "?"], ["assistant", "안녕하세요"]]);
});

test("409 shows the server message as an error line", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "다른 응답을 처리하고 있어요." }), { status: 409 })));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.result.current.lines.at(-1)).toMatchObject({ kind: "error", text: "다른 응답을 처리하고 있어요." });
  expect(h.result.current.busy).toBe(false);
});

test("401 shows the login copy", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 401 })));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.result.current.lines.at(-1)?.text).toBe("로그인이 필요해요. 다시 로그인해 주세요.");
});

test("stop aborts the request and busy becomes false", async () => {
  vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => streamOf([nd([{ t: "cmd", cmd: add("a") }])], init.signal ?? undefined, true)));
  const h = setup();
  let p!: Promise<void>;
  act(() => { p = h.result.current.send("x"); });
  await waitFor(() => expect(h.onCommand).toHaveBeenCalled());
  expect(h.result.current.busy).toBe(true);
  act(() => h.result.current.stop());
  await act(() => p);
  expect(h.result.current.busy).toBe(false);
  expect(h.result.current.lines.at(-1)).toMatchObject({ kind: "system", text: "중단했어요." });
  expect(h.onInterrupted).toHaveBeenCalledTimes(1);
  expect(h.onDone).not.toHaveBeenCalled();
});

test("events split across chunks are parsed", async () => {
  const full = nd([{ t: "cmd", cmd: add("a") }, done()]);
  const cut = 20;
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([full.slice(0, cut), full.slice(cut, cut + 30), full.slice(cut + 30)])));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.onCommand).toHaveBeenCalledTimes(1);
  expect(h.onDone).toHaveBeenCalledTimes(1);
});

test("trailing line without newline, malformed line, and byte-split Korean are handled", async () => {
  const e1 = JSON.stringify({ t: "say", text: "웹 서버를 놓을게요" }) + "\n";
  const bytes = enc.encode("not json\n" + e1 + JSON.stringify(done()));
  const i = bytes.indexOf(0xec) + 1; // inside the first multibyte char
  vi.stubGlobal("fetch", vi.fn(async () => {
    const body = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(bytes.slice(0, i)); c.enqueue(bytes.slice(i)); c.close(); } });
    return new Response(body, { status: 200 });
  }));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.result.current.lines.map((l) => l.text)).toContain("웹 서버를 놓을게요");
  expect(h.onDone).toHaveBeenCalledTimes(1);
});

test("unmount aborts the running turn", async () => {
  let sig: AbortSignal | undefined;
  vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => { sig = init.signal ?? undefined; return streamOf([], sig, true); }));
  const h = setup();
  act(() => { void h.result.current.send("x"); });
  await waitFor(() => expect(sig).toBeDefined());
  h.unmount();
  expect(sig?.aborted).toBe(true);
});

test("no missing-info line even when missing > 0 (the canvas card shows it)", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([done({ missing: 6 })])])));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.result.current.lines.at(-1)).toMatchObject({ kind: "summary", text: "노드 3 · 연결 1 · 2곳 바꿨어요" });
  expect(h.result.current.lines.some((l) => l.text.startsWith("빠진 정보"))).toBe(false);
});

async function abortWith(events: ChatEvent[]) {
  vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => streamOf([nd(events)], init.signal ?? undefined, true)));
  const onCommand = vi.fn();
  const hook = renderHook(() =>
    useChatTurn({ diagramId: "d1", initial: [], onCommand, onDone: vi.fn(), onOpenHistory: vi.fn() }),
  );
  let p!: Promise<void>;
  act(() => { p = hook.result.current.send("x"); });
  await waitFor(() => expect(events.some((e) => e.t === "cmd") ? onCommand.mock.calls.length : 1).toBeGreaterThan(0));
  await waitFor(() => expect(hook.result.current.busy).toBe(true));
  act(() => hook.result.current.stop());
  await act(() => p);
  return hook.result.current.lines;
}

test("user abort after applied commands ends with 중단했어요. and no reminder", async () => {
  const lines = await abortWith([{ t: "cmd", cmd: add("was-1") }]);
  expect(lines.at(-1)?.text).toBe("중단했어요.");
  expect(lines.some((l) => l.text.startsWith("빠진 정보"))).toBe(false);
});

test("user abort with no applied commands shows no reminder", async () => {
  const lines = await abortWith([{ t: "say", text: "그리는 중" }]);
  expect(lines.at(-1)?.text).toBe("중단했어요.");
});

test("warnings event adds one 주의 N chip after the summary", async () => {
  const items = [
    { id: "spof:w", rule: "spof", nodeId: "w", level: "warn" as const, text: "1대뿐이에요.", guide: "g" },
    { id: "db_exposed:d", rule: "db_exposed", nodeId: "d", level: "check" as const, text: "보일 수 있어요.", guide: "g" },
  ];
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([{ t: "status", phase: "checking" }, { t: "warnings", items }, done({ missing: 6 })])])));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.result.current.lines.slice(-2).map((l) => [l.kind, l.text])).toEqual([
    ["summary", "노드 3 · 연결 1 · 2곳 바꿨어요"],
    ["warning", "주의 2"],
  ]);
});

/** 이벤트를 하나씩 흘려보내는 응답. */
function controlled() {
  let ctl!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(c) { ctl = c; } });
  return {
    res: new Response(body, { status: 200 }),
    emit: (...evs: ChatEvent[]) => ctl.enqueue(enc.encode(nd(evs))),
    close: () => ctl.close(),
  };
}
const cardOf = (lines: { kind: string; card?: unknown }[]) => lines.find((l) => l.kind === "card")?.card;

test("own bubble appears immediately on send", async () => {
  let release!: (r: Response) => void;
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((r) => { release = r; })));
  const h = setup();
  let p!: Promise<void>;
  act(() => { p = h.result.current.send("  쇼핑몰 그려줘 "); });
  // 서버가 아직 답하지 않았어도 내 말풍선과 진행 카드가 이미 있다.
  expect(h.result.current.lines.map((l) => [l.kind, l.text])).toEqual([["user", "쇼핑몰 그려줘"], ["card", ""]]);
  expect(cardOf(h.result.current.lines)).toEqual({ mode: "build", step: "review", changes: 0 });
  const turnLine = h.result.current.lines[1]!;
  expect(turnLine.turn).toBeTruthy();
  expect(typeof turnLine.at).toBe("number");
  release(streamOf([nd([done({ version: null, applied: 0, skipped: 0 })])]));
  await act(() => p);
});

test("progress card steps and node count update", async () => {
  const s = controlled();
  vi.stubGlobal("fetch", vi.fn(async () => s.res));
  const h = setup();
  let p!: Promise<void>;
  act(() => { p = h.result.current.send("x"); });
  await act(async () => { s.emit({ t: "start", messageId: "m", intent: "structure_change" }, { t: "status", phase: "thinking" }); });
  await waitFor(() => expect(cardOf(h.result.current.lines)).toMatchObject({ mode: "build", step: "review" }));
  await act(async () => { s.emit({ t: "status", phase: "drawing" }, { t: "cmd", cmd: add("a") }); });
  await waitFor(() => expect(cardOf(h.result.current.lines)).toMatchObject({ step: "drawing", changes: 1 }));
  await act(async () => { s.emit({ t: "cmd", cmd: add("b") }, { t: "cmd", cmd: { op: "add_edge", id: "e", from: "a", to: "b", edge_kind: "request" } as Command }); });
  await waitFor(() => expect(cardOf(h.result.current.lines)).toMatchObject({ step: "drawing", changes: 3 }));
  await act(async () => { s.emit({ t: "status", phase: "checking" }); });
  await waitFor(() => expect(cardOf(h.result.current.lines)).toMatchObject({ step: "checking" }));
  await act(async () => { s.emit(done({ nodes: 2, edges: 1, applied: 3 })); s.close(); });
  await act(() => p);
  expect(cardOf(h.result.current.lines)).toMatchObject({ end: "done", nodes: 2, edges: 1 });
  // 카드·안내·요약은 모두 같은 차례로 묶인다.
  const turns = new Set(h.result.current.lines.filter((l) => l.kind !== "user").map((l) => l.turn));
  expect(turns.size).toBe(1);
});

test("a continuation status keeps counting changes and shows the part on the card", async () => {
  const s = controlled();
  vi.stubGlobal("fetch", vi.fn(async () => s.res));
  const h = setup();
  let p!: Promise<void>;
  act(() => { p = h.result.current.send("x"); });
  await act(async () => { s.emit({ t: "start", messageId: "m", intent: "structure_change" }, { t: "status", phase: "drawing" }, { t: "cmd", cmd: add("a") }); });
  await waitFor(() => expect(cardOf(h.result.current.lines)).toMatchObject({ step: "drawing", changes: 1 }));
  await act(async () => { s.emit({ t: "status", phase: "drawing", part: { n: 2, of: 3 } }, { t: "cmd", cmd: add("b") }); });
  await waitFor(() => expect(cardOf(h.result.current.lines)).toMatchObject({ step: "drawing", changes: 2, part: { n: 2, of: 3 } }));
  await act(async () => { s.emit(done({ nodes: 2, edges: 0, applied: 2 })); s.close(); });
  await act(() => p);
  expect(cardOf(h.result.current.lines)).toMatchObject({ end: "done", changes: 2 });
});

test("answer mode shows single step", async () => {
  const s = controlled();
  vi.stubGlobal("fetch", vi.fn(async () => s.res));
  const h = setup();
  let p!: Promise<void>;
  act(() => { p = h.result.current.send("뭐야?"); });
  await act(async () => { s.emit({ t: "start", messageId: "m", intent: "question" }, { t: "status", phase: "thinking" }); });
  await waitFor(() => expect(cardOf(h.result.current.lines)).toMatchObject({ mode: "answer" }));
  await act(async () => { s.emit({ t: "status", phase: "answering" }, { t: "answer", delta: "로드밸런서는" }); });
  await waitFor(() => expect(h.result.current.lines.some((l) => l.kind === "assistant")).toBe(true));
  expect(cardOf(h.result.current.lines)).toMatchObject({ mode: "answer" });
  await act(async () => { s.emit(done({ version: null, applied: 0, skipped: 0 })); s.close(); });
  await act(() => p);
});

test("aborted shows 중단됨", async () => {
  const lines = await abortWith([{ t: "cmd", cmd: add("was-1") }]);
  expect(cardOf(lines)).toMatchObject({ end: "aborted" });
  expect(lines.filter((l) => l.kind !== "user").every((l) => l.turn === lines[1]!.turn)).toBe(true);
});

test("edit-only turns count every applied change", async () => {
  const upd = { op: "update_node", id: "a", label: "A2" } as Command;
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([{ t: "status", phase: "drawing" }, { t: "cmd", cmd: upd }, { t: "cmd", cmd: upd }])], undefined, false)));
  const h = setup();
  await act(() => h.result.current.send("x"));
  // done 없이 끝났지만 변경이 있었으니 중단됨 카드가 남는다.
  expect(cardOf(h.result.current.lines)).toMatchObject({ changes: 2, end: "aborted" });
});

test("stream ending without done after commands leaves a 중단됨 card", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([{ t: "cmd", cmd: add("a") }])])));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(cardOf(h.result.current.lines)).toMatchObject({ end: "aborted" });
  expect(h.result.current.lines.at(-1)).toMatchObject({ kind: "error", text: "응답을 받지 못했어요. 다시 시도해 주세요." });
});

test("non-OK response removes the card", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "다른 응답을 처리하고 있어요." }), { status: 409 })));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.result.current.lines.some((l) => l.kind === "card")).toBe(false);
  expect(h.result.current.lines.map((l) => l.kind)).toEqual(["user", "error"]);
});

test("abort after done keeps the done card", async () => {
  vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => streamOf([nd([{ t: "cmd", cmd: add("a") }, done()])], init.signal ?? undefined, true)));
  const h = setup();
  let p!: Promise<void>;
  act(() => { p = h.result.current.send("x"); });
  await waitFor(() => expect(h.onDone).toHaveBeenCalled());
  act(() => h.result.current.stop());
  await act(() => p);
  expect(cardOf(h.result.current.lines)).toMatchObject({ end: "done" });
});

/** 질문 세션 줄 저장소(useSessions.setLines 자리). */
function askSetup() {
  const store: Record<string, import("@/ui/chat/useChatTurn").ChatLine[]> = {};
  const onSession = vi.fn();
  const onDone = vi.fn();
  const onInterrupted = vi.fn();
  const onSessionLines = (key: string, fn: (ls: import("@/ui/chat/useChatTurn").ChatLine[]) => import("@/ui/chat/useChatTurn").ChatLine[]) => {
    store[key] = fn(store[key] ?? []);
  };
  const hook = renderHook(() =>
    useChatTurn({ diagramId: "d1", initial: [], onCommand: vi.fn(), onDone, onOpenHistory: vi.fn(), onInterrupted, onSession, onSessionLines }),
  );
  return { ...hook, store, onSession, onDone, onInterrupted };
}
const askDone = done({ version: null, applied: 0, skipped: 0 });

test("ask target posts to /ask with nodeId and sessionId", async () => {
  const fetchMock = vi.fn<(u: string, i: RequestInit) => Promise<Response>>(async () => streamOf([nd([{ t: "start", messageId: "m", intent: "question" }, { t: "answer", delta: "이중화예요." }, askDone])]));
  vi.stubGlobal("fetch", fetchMock);
  const h = askSetup();
  await act(() => h.result.current.send("왜 두 대예요?", { kind: "ask", nodeId: "n1", sessionId: "s1" }));
  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url).toBe("/api/diagrams/d1/ask");
  expect(JSON.parse(init.body as string)).toEqual({ nodeId: "n1", text: "왜 두 대예요?", sessionId: "s1" });
  // 질문 세션에는 진행 카드·요약 칩이 없고, 구성도 대화 줄은 그대로다.
  expect(h.store.s1!.map((l) => [l.kind, l.text])).toEqual([["user", "왜 두 대예요?"], ["assistant", "이중화예요."]]);
  expect(h.result.current.lines).toEqual([]);
  expect(h.onDone).not.toHaveBeenCalled();
  expect(h.result.current.busy).toBe(false);
});

test("session event is reported", async () => {
  const session = { id: "s9", kind: "node" as const, nodeId: "n1", nodeLabel: "API 서버", title: "왜?", updatedAt: "2026-11-01T00:00:00.000Z" };
  const fetchMock = vi.fn<(u: string, i: RequestInit) => Promise<Response>>(async () => streamOf([nd([{ t: "session", session }, { t: "start", messageId: "m", intent: null }, { t: "answer", delta: "답" }, askDone])]));
  vi.stubGlobal("fetch", fetchMock);
  const h = askSetup();
  let p!: Promise<void>;
  act(() => { p = h.result.current.send("왜?", { kind: "ask", nodeId: "n1", sessionId: null }); });
  expect(h.result.current.runningKey).toBe("new");
  await act(() => p);
  expect(JSON.parse(fetchMock.mock.calls[0]![1].body as string)).toEqual({ nodeId: "n1", text: "왜?" });
  expect(h.onSession).toHaveBeenCalledWith(session);
  // 세션 이름이 온 뒤의 줄은 그 세션으로 간다.
  expect(h.store.new!.map((l) => l.kind)).toEqual(["user"]);
  expect(h.store.s9!.map((l) => l.kind)).toEqual(["assistant"]);
  expect(h.result.current.runningKey).toBeNull();
});

test("handoff line has a send-to-main action", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([
    { t: "start", messageId: "m", intent: "structure_change" }, { t: "say", text: "구성을 바꾸려면 구성도 대화에서 말해 주세요." },
    { t: "handoff", text: "이중화해 줘" }, askDone,
  ])])));
  const h = askSetup();
  await act(() => h.result.current.send("이중화해 줘", { kind: "ask", nodeId: "n1", sessionId: "s1" }));
  expect(h.store.s1!.map((l) => [l.kind, l.text])).toEqual([
    ["user", "이중화해 줘"],
    ["progress", "구성을 바꾸려면 구성도 대화에서 말해 주세요."],
    ["handoff", "이중화해 줘"],
  ]);
  // 안내와 넘기기 버튼은 한 AI 메시지다.
  expect(new Set(h.store.s1!.slice(1).map((l) => l.turn)).size).toBe(1);
});

test("a new diagram chat posts newSession to /chat, keeps the card and summary in that session, and reports the session", async () => {
  const session = { id: "c1", kind: "diagram" as const, nodeId: null, nodeLabel: null, title: "웹 하나", updatedAt: "2026-11-01T00:00:00.000Z" };
  const fetchMock = vi.fn<(u: string, i: RequestInit) => Promise<Response>>(async () =>
    streamOf([nd([{ t: "session", session }, { t: "start", messageId: "m", intent: "structure_change" }, { t: "cmd", cmd: add("a") }, done()])]),
  );
  vi.stubGlobal("fetch", fetchMock);
  const h = askSetup();
  // useSessions.upsert 처럼 새 세션 줄을 받은 id 로 옮긴다.
  h.onSession.mockImplementation((x: { id: string }) => {
    h.store[x.id] = h.store.new ?? [];
    delete h.store.new;
  });
  let p!: Promise<void>;
  act(() => { p = h.result.current.send("웹 하나", { kind: "diagram", sessionId: null }); });
  expect(h.result.current.runningKey).toBe("new");
  expect(h.result.current.runningAsk).toBe(false);
  await act(() => p);
  const [url, init] = fetchMock.mock.calls[0]!;
  expect(url).toBe("/api/diagrams/d1/chat");
  expect(JSON.parse(init.body as string)).toEqual({ text: "웹 하나", newSession: true });
  expect(h.onSession).toHaveBeenCalledWith(session);
  expect(h.onDone).toHaveBeenCalled();
  // 기본 대화 줄은 그대로이고, 진행 카드·요약은 새 세션 줄에 있다.
  expect(h.result.current.lines).toEqual([]);
  expect(h.store.c1!.map((l) => l.kind)).toEqual(["user", "card", "summary"]);
  expect(h.store.c1!.find((l) => l.kind === "card")?.card).toMatchObject({ end: "done" });
});

test("an existing diagram chat posts its sessionId; errors are counted", async () => {
  const fetchMock = vi.fn<(u: string, i: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({ error: "다른 응답을 처리하고 있어요." }), { status: 409 }));
  vi.stubGlobal("fetch", fetchMock);
  const h = askSetup();
  expect(h.result.current.errors).toBe(0);
  await act(() => h.result.current.send("또", { kind: "diagram", sessionId: "c1" }));
  expect(JSON.parse(fetchMock.mock.calls[0]![1].body as string)).toEqual({ text: "또", sessionId: "c1" });
  expect(h.store.c1!.map((l) => [l.kind, l.text])).toEqual([["user", "또"], ["error", "다른 응답을 처리하고 있어요."]]);
  expect(h.result.current.errors).toBe(1);
});
