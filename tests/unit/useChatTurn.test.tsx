import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { applyCommand } from "@/domain/apply";
import type { Command } from "@/domain/commands";
import { emptyState } from "@/domain/types";
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
  const hook = renderHook(() => useChatTurn({ diagramId: "d1", initial: [], onCommand, onDone, onOpenHistory, onInterrupted }));
  return { ...hook, onCommand, onDone, onOpenHistory, onInterrupted };
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
  expect(h.result.current.lines.map((l) => l.kind)).toEqual(["user", "progress", "system"]);
  expect(h.result.current.busy).toBe(false);
});

test("done adds the summary line and calls onDone", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([done()])])));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.result.current.lines.at(-1)).toMatchObject({ kind: "system", text: "노드 3 · 연결 1 · 적용 2 · 건너뜀 1" });
  expect(h.onDone).toHaveBeenCalledTimes(1);
});

test("answer deltas append to one assistant line; no summary for answer-only turns", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([
    { t: "answer", delta: "안녕" }, { t: "answer", delta: "하세요" }, done({ version: null, applied: 0, skipped: 0 }),
  ])])));
  const h = setup();
  await act(() => h.result.current.send("?"));
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

test("reminder line follows the summary when missing > 0", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([done({ missing: 6 })])])));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.result.current.lines.slice(-2).map((l) => [l.kind, l.text])).toEqual([
    ["system", "노드 3 · 연결 1 · 적용 2 · 건너뜀 1"],
    ["system", "빠진 정보 6개가 있어요"],
  ]);
});

test("no reminder when nothing was applied", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([done({ version: null, applied: 0, missing: 6 })])])));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.result.current.lines.some((l) => l.text.startsWith("빠진 정보"))).toBe(false);
});

async function abortWith(events: ChatEvent[]) {
  vi.stubGlobal("fetch", vi.fn(async (_u: string, init: RequestInit) => streamOf([nd(events)], init.signal ?? undefined, true)));
  const state = applyCommand(emptyState(), { op: "add_node", id: "was-1", kind: "was", label: "WAS", parent: null }).state;
  const onCommand = vi.fn();
  const hook = renderHook(() =>
    useChatTurn({ diagramId: "d1", initial: [], onCommand, onDone: vi.fn(), onOpenHistory: vi.fn(), getState: () => state }),
  );
  let p!: Promise<void>;
  act(() => { p = hook.result.current.send("x"); });
  await waitFor(() => expect(events.some((e) => e.t === "cmd") ? onCommand.mock.calls.length : 1).toBeGreaterThan(0));
  await waitFor(() => expect(hook.result.current.busy).toBe(true));
  act(() => hook.result.current.stop());
  await act(() => p);
  return hook.result.current.lines;
}

test("user abort after applied commands shows the reminder from live state", async () => {
  const lines = await abortWith([{ t: "cmd", cmd: add("was-1") }]);
  expect(lines.slice(-2).map((l) => l.text)).toEqual(["중단했어요.", "빠진 정보 7개가 있어요"]);
});

test("user abort with no applied commands shows no reminder", async () => {
  const lines = await abortWith([{ t: "say", text: "그리는 중" }]);
  expect(lines.at(-1)?.text).toBe("중단했어요.");
});

test("warnings event adds lines after the summary and reminder", async () => {
  const items = [
    { id: "spof:w", rule: "spof", nodeId: "w", level: "warn" as const, text: "1대뿐이에요.", guide: "g" },
    { id: "db_exposed:d", rule: "db_exposed", nodeId: "d", level: "check" as const, text: "보일 수 있어요.", guide: "g" },
  ];
  vi.stubGlobal("fetch", vi.fn(async () => streamOf([nd([{ t: "status", phase: "checking" }, { t: "warnings", items }, done({ missing: 6 })])])));
  const h = setup();
  await act(() => h.result.current.send("x"));
  expect(h.result.current.lines.slice(-4).map((l) => [l.kind, l.text])).toEqual([
    ["system", "노드 3 · 연결 1 · 적용 2 · 건너뜀 1"],
    ["system", "빠진 정보 6개가 있어요"],
    ["warning", "주의: 1대뿐이에요."],
    ["warning", "확인해 보세요: 보일 수 있어요."],
  ]);
  expect(h.result.current.lines.at(-2)).toMatchObject({ nodeId: "w", level: "warn" });
});
