import { eq } from "drizzle-orm";
import { describe, expect, test, vi } from "vitest";

import { db } from "@/db/client";
import { diagramVersions } from "@/db/schema";
import { applyCommands } from "@/domain/apply";
import { computeMissing } from "@/domain/missing";
import type { DiagramState } from "@/domain/types";
import { emptyState } from "@/domain/types";
import type { ChatEvent } from "@/server/chat/events";
import { listMessages } from "@/server/chat/messages";
import { runChatTurn, type ChatDeps } from "@/server/chat/pipeline";
import { ANSWER_PROMPT, SYSTEM_PROMPT } from "@/server/chat/prompt";
import type { ClefClient, Intent } from "@/server/llm/clef";
import type { ChatMessage, QwenClient } from "@/server/llm/qwen";
import { NotFoundError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";

import { fx } from "../fixtures/spike";
import { makeOwnedDiagram } from "./helpers";

const BUSY = "다른 응답을 처리하고 있어요. 끝난 뒤 다시 보내 주세요.";
const NO_AI = "AI 서버에 연결할 수 없어요. 잠시 뒤 다시 시도하거나 관리자에게 문의해 주세요.";
const HISTORY_TEXT = "변경 이력은 오른쪽 '이력' 탭에서 보고 되돌릴 수 있어요.";
const LAYOUT_TEXT = "구성도를 다시 정렬했어요.";
const TIMEOUT_TEXT = "응답 시간이 너무 길어 중단했어요.";
const GENERIC_ERR = "응답을 처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.";

/** spike s2 상태를 모델이 냈을 법한 명령 줄로 되돌린다(그룹은 부모 먼저). */
function stateToLines(state: DiagramState): string[] {
  const lines: string[] = [JSON.stringify({ op: "say", text: "구성을 그리는 중…" })];
  for (const a of Object.values(state.assumptions)) {
    lines.push(JSON.stringify({ op: "set_assumption", key: a.key, value: a.value }));
  }
  const done = new Set<string>();
  const groups = Object.values(state.groups);
  while (done.size < groups.length) {
    for (const g of groups) {
      if (done.has(g.id) || (g.parent !== null && !done.has(g.parent))) continue;
      done.add(g.id);
      lines.push(JSON.stringify({ op: "add_group", id: g.id, group_kind: g.groupKind, label: g.label, parent: g.parent }));
    }
  }
  for (const n of Object.values(state.nodes)) {
    lines.push(JSON.stringify({ op: "add_node", id: n.id, kind: n.kind, label: n.label, sub: n.sub, parent: n.parent, attrs: n.attrs }));
  }
  for (const e of Object.values(state.edges)) {
    lines.push(JSON.stringify({ op: "add_edge", id: e.id, from: e.from, to: e.to, edge_kind: e.edgeKind, label: e.label }));
  }
  return lines;
}

const s2 = fx("s2");
const S2_LINES = stateToLines(s2);
const S2_CMDS = S2_LINES.length - 1;

function abortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

/** 텍스트를 일정 크기로 잘라 onDelta 에 흘리는 가짜 Qwen. 신호를 존중한다. */
function fakeQwen(
  text: string,
  opts: { chunk?: number; gate?: Promise<void>; failAfter?: number; hang?: boolean } = {},
): QwenClient & { calls: ChatMessage[][] } {
  const calls: ChatMessage[][] = [];
  return {
    calls,
    async streamCompletion(messages, { signal, onDelta }) {
      calls.push(messages);
      if (opts.gate) await opts.gate;
      if (opts.hang) {
        await new Promise((_r, reject) => signal.addEventListener("abort", () => reject(abortError()), { once: true }));
      }
      const size = opts.chunk ?? 37;
      let sent = 0;
      for (let i = 0; i < text.length; i += size) {
        if (signal.aborted) throw abortError();
        if (opts.failAfter !== undefined && sent >= opts.failAfter) throw new Error("upstream failed at http://10.0.0.1/secret");
        const part = text.slice(i, i + size);
        onDelta(part);
        sent += part.length;
        await new Promise((r) => setImmediate(r));
      }
      if (signal.aborted) throw abortError();
      return { text, finishReason: "stop" };
    },
  };
}

function fakeClef(result: { intent: Intent; confidence: number } | null): ClefClient & { calls: unknown[] } {
  const calls: unknown[] = [];
  return {
    calls,
    async decide() {
      throw new Error("not used");
    },
    async classifyIntent(input, context) {
      calls.push({ input, context });
      return result;
    },
  };
}

const neverQwen: QwenClient = {
  async streamCompletion() {
    throw new Error("qwen must not be called");
  },
};

async function turn(
  ids: { userId: string; diagramId: string },
  text: string,
  deps: ChatDeps,
  opts: { signal?: AbortSignal; onEvent?: (e: ChatEvent) => void } = {},
) {
  const events: ChatEvent[] = [];
  const result = await runChatTurn(
    {
      ...ids,
      text,
      signal: opts.signal ?? new AbortController().signal,
      emit(e) {
        events.push(e);
        opts.onEvent?.(e);
      },
    },
    deps,
  );
  return { events, result };
}

const of = <T extends ChatEvent["t"]>(events: ChatEvent[], t: T) =>
  events.filter((e): e is Extract<ChatEvent, { t: T }> => e.t === t);

async function versions(diagramId: string) {
  return db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, diagramId)).orderBy(diagramVersions.number);
}

describe("runChatTurn", () => {
  test("structure turn streams cmds, saves one ai version linked to the user message", async () => {
    const ids = await makeOwnedDiagram();
    await createVersion(ids.diagramId, emptyState(), { source: "import" });
    const qwen = fakeQwen(S2_LINES.join("\n"));
    const { events, result } = await turn(ids, "IDC 이중화 그려줘", {
      qwen,
      clef: fakeClef({ intent: "structure_change", confidence: 0.9 }),
    });

    expect(result).toEqual({ status: "ok" });
    const start = of(events, "start")[0]!;
    expect(start.intent).toBe("structure_change");
    expect(events[0]).toBe(start);
    expect(of(events, "status").map((e) => e.phase)).toEqual(["thinking", "drawing", "checking"]);
    expect(of(events, "say").map((e) => e.text)).toEqual(["구성을 그리는 중…"]);
    expect(of(events, "cmd")).toHaveLength(S2_CMDS);
    expect(of(events, "skip")).toHaveLength(0);
    // 첫 cmd 바로 앞에 drawing
    const firstCmd = events.findIndex((e) => e.t === "cmd");
    expect(events[firstCmd - 1]).toEqual({ t: "status", phase: "drawing" });

    const done = events.at(-1)!;
    expect(done).toMatchObject({
      t: "done",
      version: 2,
      status: "complete",
      applied: S2_CMDS,
      skipped: 0,
      nodes: Object.keys(s2.nodes).length,
      edges: Object.keys(s2.edges).length,
    });

    const vs = await versions(ids.diagramId);
    expect(vs).toHaveLength(2);
    expect(vs[1]).toMatchObject({ number: 2, source: "ai", status: "complete", messageId: start.messageId });
    expect(vs[1]!.state).toEqual({ ...s2, warnings: [] });

    const msgs = await listMessages(ids.diagramId);
    expect(msgs.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(msgs[0]).toMatchObject({ id: start.messageId, content: "IDC 이중화 그려줘" });
    expect(msgs[1]).toMatchObject({
      id: (done as Extract<ChatEvent, { t: "done" }>).assistantMessageId,
      content: "구성을 그리는 중…",
      meta: { intent: "structure_change", applied: S2_CMDS, skipped: 0, version: 2, status: "complete", says: ["구성을 그리는 중…"] },
    });
    expect(qwen.calls[0]![0]).toEqual({ role: "system", content: SYSTEM_PROMPT });
  });

  test("bad lines are skipped and counted", async () => {
    const ids = await makeOwnedDiagram();
    const lines = [
      JSON.stringify({ op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: null }),
      "{not json",
      JSON.stringify({ op: "add_node", id: "web-1", kind: "web_server", label: "WEB#1", parent: "nope" }),
      JSON.stringify({ op: "warn", text: "위험" }),
      JSON.stringify({ op: "add_node", id: "web-2", kind: "web_server", label: "WEB#2", parent: "vpc" }),
    ];
    const { events } = await turn(ids, "그려줘", { qwen: fakeQwen(lines.join("\n"), { chunk: 5 }), clef: fakeClef(null) });
    expect(of(events, "cmd").map((e) => e.cmd.op)).toEqual(["add_group", "add_node"]);
    expect(of(events, "skip")).toHaveLength(3);
    for (const s of of(events, "skip")) {
      expect(s.reason.startsWith("건너뜀: ")).toBe(true);
      expect(s.reason.length).toBeLessThanOrEqual(120);
    }
    expect(events.at(-1)).toMatchObject({ t: "done", applied: 2, skipped: 3, version: 1, nodes: 1, edges: 0 });
  });

  test("AI lines with sub:null / missing parent / array attrs are normalized and applied, not skipped", async () => {
    const ids = await makeOwnedDiagram();
    const lines = [
      JSON.stringify({ op: "add_node", id: "client-web", kind: "client_web", label: "웹 브라우저", sub: null, parent: null, attrs: { sw: "Browser", ip: null } }),
      JSON.stringify({ op: "add_node", id: "was-1", kind: "was", label: "WAS#1", attrs: { az: ["2a", "2c"], multi_az: true } }),
      JSON.stringify({ op: "add_edge", id: "e-client-web-was-1", from: "client-web", to: "was-1", edge_kind: "request", label: null }),
    ];
    const { events } = await turn(ids, "그려줘", { qwen: fakeQwen(lines.join("\n")), clef: fakeClef(null) });
    expect(of(events, "skip")).toHaveLength(0);
    expect(of(events, "cmd").map((e) => e.cmd)).toEqual([
      { op: "add_node", id: "client-web", kind: "client_web", label: "웹 브라우저", parent: null, attrs: { sw: "Browser", ip: null } },
      { op: "add_node", id: "was-1", kind: "was", label: "WAS#1", parent: null, attrs: { az: "2a, 2c", multi_az: "true" } },
      { op: "add_edge", id: "e-client-web-was-1", from: "client-web", to: "was-1", edge_kind: "request" },
    ]);
    expect(events.at(-1)).toMatchObject({ t: "done", applied: 3, skipped: 0, nodes: 2, edges: 1 });
    // 다시 불러올 때 요약 칩·완료 카드가 쓰는 수도 메타에 남는다.
    expect((await listMessages(ids.diagramId))[1]!.meta).toMatchObject({ nodes: 2, edges: 1 });
    const saved = await getLatestState(ids.diagramId);
    expect(saved!.state.nodes["client-web"]).toBeDefined();
  });

  test("logs one server line per turn with skip reason counts (no message text)", async () => {
    const ids = await makeOwnedDiagram();
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      const lines = [
        JSON.stringify({ op: "add_node", id: "a", kind: "load_balancer", label: "A", parent: null }),
        JSON.stringify({ op: "add_node", id: "b", kind: "load_balancer", label: "B", parent: null }),
        JSON.stringify({ op: "add_edge", from: "x-1", to: "y-1", edge_kind: "request" }),
        JSON.stringify({ op: "warn", text: "위험" }),
        "{not json",
      ];
      await turn(ids, "비밀 문장", { qwen: fakeQwen(lines.join("\n")), clef: fakeClef(null) });
      const calls = info.mock.calls.filter((c) => c[0] === "[chat] skipped");
      expect(calls).toHaveLength(1);
      const payload = calls[0]![1] as { diagramId: string; counts: Record<string, number> };
      expect(payload.diagramId).toBe(ids.diagramId);
      expect(Object.values(payload.counts).reduce((a, b) => a + b, 0)).toBe(5);
      expect(Object.entries(payload.counts).find(([k]) => k.startsWith("invalid add_node"))?.[1]).toBe(2);
      expect(payload.counts["apply add_edge endpoint … not found"]).toBe(1);
      expect(payload.counts["unknown_op warn"]).toBe(1);
      expect(payload.counts["bad_json"]).toBe(1);
      expect(JSON.stringify(calls)).not.toContain("비밀 문장");
    } finally {
      info.mockRestore();
    }
  });

  test("zero applied commands creates no version", async () => {
    const ids = await makeOwnedDiagram();
    await createVersion(ids.diagramId, emptyState(), { source: "import" });
    const lines = [JSON.stringify({ op: "say", text: "바꿀 게 없어요" }), "garbage"];
    const { events } = await turn(ids, "그대로 둬", { qwen: fakeQwen(lines.join("\n")), clef: fakeClef(null) });
    expect(events.at(-1)).toMatchObject({ t: "done", version: null, status: "complete", applied: 0, skipped: 1 });
    expect(await versions(ids.diagramId)).toHaveLength(1);
    const msgs = await listMessages(ids.diagramId);
    expect(msgs[1]).toMatchObject({ role: "assistant", content: "바꿀 게 없어요", meta: { version: null, applied: 0 } });
  });

  test("abort mid-stream saves aborted version and releases lock", async () => {
    const ids = await makeOwnedDiagram();
    const ctrl = new AbortController();
    let cmds = 0;
    const { events, result } = await turn(
      ids,
      "그려줘",
      { qwen: fakeQwen(S2_LINES.join("\n"), { chunk: 20 }), clef: fakeClef(null) },
      {
        signal: ctrl.signal,
        onEvent(e) {
          if (e.t === "cmd" && ++cmds === 3) ctrl.abort();
        },
      },
    );
    expect(result).toEqual({ status: "ok" });
    expect(of(events, "cmd")).toHaveLength(3);
    expect(of(events, "error")).toHaveLength(0);
    expect(events.at(-1)).toMatchObject({ t: "done", status: "aborted", applied: 3, version: 1 });
    const vs = await versions(ids.diagramId);
    expect(vs).toHaveLength(1);
    expect(vs[0]).toMatchObject({ status: "aborted", source: "ai" });
    // 보낸 cmd 를 시작 상태에 다시 적용하면 저장된 상태와 같다
    const replay = applyCommands(emptyState(), of(events, "cmd").map((e) => e.cmd));
    expect(replay.errors).toEqual([]);
    expect(vs[0]!.state).toEqual({ ...replay.state, warnings: [] });
    const msgs = await listMessages(ids.diagramId);
    expect(msgs[1]!.meta).toMatchObject({ status: "aborted", applied: 3, version: 1 });

    // 잠금이 풀려 곧바로 다음 차례가 된다
    const next = await turn(ids, "다시", {
      qwen: fakeQwen(JSON.stringify({ op: "say", text: "네" })),
      clef: fakeClef(null),
    });
    expect(next.result).toEqual({ status: "ok" });
    expect(next.events.at(-1)).toMatchObject({ t: "done", status: "complete" });
  });

  test("second concurrent turn is rejected", async () => {
    const ids = await makeOwnedDiagram();
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let thinking!: () => void;
    const started = new Promise<void>((r) => (thinking = r));
    const lines = [JSON.stringify({ op: "add_node", id: "web-1", kind: "web_server", label: "WEB#1", parent: null })];
    const a = turn(
      ids,
      "A",
      { qwen: fakeQwen(lines.join("\n"), { gate }), clef: fakeClef(null) },
      { onEvent: (e) => e.t === "status" && thinking() },
    );
    await started;

    const b = await turn(ids, "B", { qwen: neverQwen, clef: fakeClef(null) });
    expect(b.result).toEqual({ status: "busy" });
    expect(b.events).toEqual([{ t: "error", message: BUSY }]);

    release();
    const ra = await a;
    expect(ra.result).toEqual({ status: "ok" });
    expect(ra.events.at(-1)).toMatchObject({ t: "done", status: "complete", applied: 1, version: 1 });
    // B 는 사용자 메시지도 남기지 않는다
    expect((await listMessages(ids.diagramId)).map((m) => [m.role, m.content])).toEqual([
      ["user", "A"],
      ["assistant", ""],
    ]);
  });

  test("low-confidence or failed intent falls back to SYSTEM_PROMPT path", async () => {
    for (const r of [{ intent: "question" as const, confidence: 0.4 }, null]) {
      const ids = await makeOwnedDiagram();
      const qwen = fakeQwen(JSON.stringify({ op: "add_node", id: "web-1", kind: "web_server", label: "WEB#1", parent: null }));
      const { events } = await turn(ids, "WEB 하나", { qwen, clef: fakeClef(r) });
      expect(of(events, "start")[0]!.intent).toBeNull();
      expect(qwen.calls[0]![0]!.content).toBe(SYSTEM_PROMPT);
      expect(of(events, "cmd")).toHaveLength(1);
      expect(of(events, "answer")).toHaveLength(0);
      expect(events.at(-1)).toMatchObject({ t: "done", applied: 1, version: 1 });
      const msgs = await listMessages(ids.diagramId);
      expect(msgs[1]!.meta.intent).toBeUndefined();
    }
  });

  test("question intent streams answer deltas and creates no version", async () => {
    const ids = await makeOwnedDiagram();
    await createVersion(ids.diagramId, s2, { source: "import" });
    const answer = "WAS 는 Tomcat 두 대로 이중화되어 있어요. DB 는 Oracle Active-Standby 예요.";
    const qwen = fakeQwen(answer, { chunk: 8 });
    const { events } = await turn(ids, "WAS 는 몇 대야?", { qwen, clef: fakeClef({ intent: "question", confidence: 0.95 }) });
    expect(qwen.calls[0]![0]!.content).toBe(ANSWER_PROMPT);
    expect(of(events, "status").map((e) => e.phase)).toEqual(["thinking", "answering"]);
    expect(of(events, "answer").map((e) => e.delta).join("")).toBe(answer);
    expect(of(events, "cmd")).toHaveLength(0);
    expect(events.at(-1)).toMatchObject({ t: "done", version: null, status: "complete", applied: 0, skipped: 0 });
    expect(await versions(ids.diagramId)).toHaveLength(1);
    const msgs = await listMessages(ids.diagramId);
    expect(msgs[1]).toMatchObject({ role: "assistant", content: answer, meta: { intent: "question", status: "complete" } });
  });

  test("done carries the missing count and meta stores it when commands applied", async () => {
    const ids = await makeOwnedDiagram();
    const lines = [JSON.stringify({ op: "add_node", id: "was-1", kind: "was", label: "WAS#1", attrs: { hostname: "was-1" } })];
    const { events } = await turn(ids, "WAS 하나 그려줘", { qwen: fakeQwen(lines.join("\n")), clef: fakeClef(null) });
    expect(events.at(-1)).toMatchObject({ t: "done", applied: 1, missing: 6 });
    const msgs = await listMessages(ids.diagramId);
    expect(msgs[1]!.meta.missing).toBe(6);
  });

  test("answer-only turn stores no missing meta", async () => {
    const ids = await makeOwnedDiagram();
    await createVersion(ids.diagramId, s2, { source: "import" });
    const { events } = await turn(ids, "WAS 는 몇 대야?", { qwen: fakeQwen("두 대예요."), clef: fakeClef({ intent: "question", confidence: 0.95 }) });
    expect(events.at(-1)).toHaveProperty("missing");
    const msgs = await listMessages(ids.diagramId);
    expect(msgs[1]!.meta).not.toHaveProperty("missing");
  });

  test("history intent replies fixed text and open_history", async () => {
    const ids = await makeOwnedDiagram();
    const { events } = await turn(ids, "어제 버전으로 되돌려줘", {
      qwen: neverQwen,
      clef: fakeClef({ intent: "history", confidence: 0.8 }),
    });
    expect(events.map((e) => e.t)).toEqual(["start", "say", "open_history", "done"]);
    expect(of(events, "say")[0]!.text).toBe(HISTORY_TEXT);
    expect(events.at(-1)).toMatchObject({ t: "done", version: null, status: "complete", applied: 0 });
    const msgs = await listMessages(ids.diagramId);
    expect(msgs[1]).toMatchObject({ role: "assistant", content: HISTORY_TEXT, meta: { intent: "history" } });
    expect(await versions(ids.diagramId)).toHaveLength(0);
  });

  test("layout intent skips qwen and emits relayout", async () => {
    const ids = await makeOwnedDiagram();
    await createVersion(ids.diagramId, s2, { source: "import" });
    const { events } = await turn(ids, "구성도 좀 정리해줘", {
      qwen: neverQwen,
      clef: fakeClef({ intent: "layout", confidence: 0.8 }),
    });
    expect(events.map((e) => e.t)).toEqual(["start", "say", "relayout", "done"]);
    expect(of(events, "start")[0]).toMatchObject({ intent: "layout" });
    expect(of(events, "say")[0]!.text).toBe(LAYOUT_TEXT);
    expect(events.at(-1)).toMatchObject({ t: "done", version: null, status: "complete", applied: 0 });
    const msgs = await listMessages(ids.diagramId);
    expect(msgs[1]).toMatchObject({ role: "assistant", content: LAYOUT_TEXT, meta: { intent: "layout", says: [LAYOUT_TEXT] } });
    expect(await versions(ids.diagramId)).toHaveLength(1);
  });

  test("low-confidence layout intent takes the normal path", async () => {
    const ids = await makeOwnedDiagram();
    const qwen = fakeQwen(JSON.stringify({ op: "say", text: "그대로 둘게요" }));
    const { events } = await turn(ids, "정리", { qwen, clef: fakeClef({ intent: "layout", confidence: 0.5 }) });
    expect(qwen.calls).toHaveLength(1);
    expect(events.some((e) => e.t === "relayout")).toBe(false);
  });

  test("confirmed assumption change from the model is skipped", async () => {
    const ids = await makeOwnedDiagram();
    const base: DiagramState = {
      ...emptyState(),
      assumptions: { scale: { key: "scale", value: "100명", confirmed: true } },
    };
    await createVersion(ids.diagramId, base, { source: "import" });
    const lines = [
      JSON.stringify({ op: "set_assumption", key: "scale", value: "1만명" }),
      JSON.stringify({ op: "set_assumption", key: "deploy", value: "단일 리전" }),
    ];
    const { events } = await turn(ids, "그려줘", { qwen: fakeQwen(lines.join("\n")), clef: fakeClef(null) });
    expect(of(events, "skip")).toHaveLength(1);
    expect(of(events, "cmd").map((e) => e.cmd)).toEqual([{ op: "set_assumption", key: "deploy", value: "단일 리전" }]);
    const latest = await getLatestState(ids.diagramId);
    expect(latest!.number).toBe(2);
    expect(latest!.state.assumptions.scale).toEqual({ key: "scale", value: "100명", confirmed: true });
  });

  test("missing qwen config emits the AI-unavailable error", async () => {
    const ids = await makeOwnedDiagram();
    const clef = fakeClef({ intent: "structure_change", confidence: 0.9 });
    const { events, result } = await turn(ids, "그려줘", { qwen: null, clef });
    expect(result).toEqual({ status: "ok" });
    expect(events.map((e) => e.t)).toEqual(["start", "error", "done"]);
    expect(of(events, "error")[0]!.message).toBe(NO_AI);
    expect(events.at(-1)).toMatchObject({ t: "done", version: null, status: "complete", applied: 0, skipped: 0 });
    expect(clef.calls).toHaveLength(0);
    const msgs = await listMessages(ids.diagramId);
    expect(msgs.map((m) => m.role)).toEqual(["user"]);
  });

  test("other user's diagram throws NotFoundError", async () => {
    const a = await makeOwnedDiagram();
    const b = await makeOwnedDiagram();
    await expect(
      turn({ userId: b.userId, diagramId: a.diagramId }, "x", { qwen: neverQwen, clef: fakeClef(null) }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("history passed to the model excludes system messages and the current message", async () => {
    const ids = await makeOwnedDiagram();
    const say = (t: string) => JSON.stringify({ op: "say", text: t });
    await turn(ids, "첫 요청", { qwen: fakeQwen(say("첫 답")), clef: fakeClef(null) });
    const { createMessage } = await import("@/server/chat/messages");
    await createMessage(ids.diagramId, "system", "v1로 되돌림 (새 버전 v2)");
    const qwen = fakeQwen(say("둘째 답"));
    const clef = fakeClef(null);
    await turn(ids, "둘째 요청", { qwen, clef });
    const msgs = qwen.calls[0]!;
    expect(msgs.slice(1, -1)).toEqual([
      { role: "user", content: "첫 요청" },
      { role: "assistant", content: "첫 답" },
    ]);
    expect(msgs.at(-1)!.content).toContain("요청: 둘째 요청");
    expect(clef.calls[0]).toEqual({ input: "둘째 요청", context: { lastAssistant: "첫 답", openItems: [] } });
  });

  test("unexpected error keeps applied work as aborted version and hides the raw error", async () => {
    const ids = await makeOwnedDiagram();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const first = S2_LINES.slice(0, 3).join("\n") + "\n";
    const { events } = await turn(ids, "그려줘", {
      qwen: fakeQwen(first + S2_LINES.slice(3).join("\n"), { chunk: first.length, failAfter: first.length }),
      clef: fakeClef(null),
    });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
    expect(of(events, "error").map((e) => e.message)).toEqual([GENERIC_ERR]);
    expect(JSON.stringify(events)).not.toContain("10.0.0.1");
    expect(events.at(-1)).toMatchObject({ t: "done", status: "aborted", applied: 2, version: 1 });
    expect((await versions(ids.diagramId))[0]).toMatchObject({ status: "aborted" });
    const msgs = await listMessages(ids.diagramId);
    expect(msgs[1]!.meta).toMatchObject({ status: "error", applied: 2, version: 1 });
  });

  test("turn time cap aborts with the timeout error", async () => {
    const ids = await makeOwnedDiagram();
    const { events } = await turn(ids, "그려줘", {
      qwen: fakeQwen("", { hang: true }),
      clef: fakeClef(null),
      turnTimeoutMs: 50,
    });
    expect(of(events, "error").map((e) => e.message)).toEqual([TIMEOUT_TEXT]);
    expect(events.at(-1)).toMatchObject({ t: "done", status: "aborted", applied: 0, version: null });
    const msgs = await listMessages(ids.diagramId);
    expect(msgs[1]!.meta).toMatchObject({ status: "aborted" });
  });
  test("long skip reasons are capped at 120 chars", async () => {
    const ids = await makeOwnedDiagram();
    const long = "x".repeat(300);
    const lines = [JSON.stringify({ op: "add_node", id: "web-1", kind: "web_server", label: "W", parent: long.slice(0, 60) })];
    const { events } = await turn(ids, "그려줘", { qwen: fakeQwen(lines.join("\n")), clef: fakeClef(null) });
    const [s] = of(events, "skip");
    expect(s!.reason.startsWith("건너뜀: ")).toBe(true);
    expect(s!.reason.length).toBeLessThanOrEqual(120);
  });

  test("think tags split across chunks never reach answer events or the stored message", async () => {
    const ids = await makeOwnedDiagram();
    const raw = "<think>속으로 생각</think>WAS 는 두 대예요.<think>또</think> DB 는 한 쌍이에요.";
    const { events } = await turn(ids, "몇 대야?", {
      qwen: fakeQwen(raw, { chunk: 3 }),
      clef: fakeClef({ intent: "question", confidence: 0.9 }),
    });
    const shown = of(events, "answer").map((e) => e.delta).join("");
    expect(shown).toBe("WAS 는 두 대예요. DB 는 한 쌍이에요.");
    for (const e of of(events, "answer")) expect(e.delta).not.toMatch(/think|<|>/);
    const msgs = await listMessages(ids.diagramId);
    expect(msgs[1]).toMatchObject({ role: "assistant", content: shown, meta: { status: "complete" } });
  });

  test("abort mid-answer stores the partial stripped text", async () => {
    const ids = await makeOwnedDiagram();
    const ctrl = new AbortController();
    let n = 0;
    const raw = "<think>음</think>첫 문장이에요. 둘째 문장이에요. 셋째 문장이에요.";
    const { events } = await turn(
      ids,
      "설명해줘",
      { qwen: fakeQwen(raw, { chunk: 4 }), clef: fakeClef({ intent: "other", confidence: 0.9 }) },
      {
        signal: ctrl.signal,
        onEvent(e) {
          if (e.t === "answer" && ++n === 3) ctrl.abort();
        },
      },
    );
    const shown = of(events, "answer").map((e) => e.delta).join("");
    expect(shown.length).toBeGreaterThan(0);
    expect(raw).toContain(shown);
    expect(events.at(-1)).toMatchObject({ t: "done", status: "aborted", version: null });
    const msgs = await listMessages(ids.diagramId);
    // 저장 글은 보낸 글을 앞뒤 공백만 다듬은 것
    expect(msgs[1]).toMatchObject({ content: shown.trim(), meta: { status: "aborted" } });
  });

  test("an emit that throws does not skip persistence (turn completes)", async () => {
    const ids = await makeOwnedDiagram();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    let cmds = 0;
    const events: ChatEvent[] = [];
    const result = await runChatTurn(
      {
        ...ids,
        text: "그려줘",
        signal: new AbortController().signal,
        emit(e) {
          if (cmds >= 2) throw new Error("stream closed");
          events.push(e);
          if (e.t === "cmd") cmds++;
        },
      },
      { qwen: fakeQwen(S2_LINES.join("\n")), clef: fakeClef(null) },
    );
    spy.mockRestore();
    expect(result).toEqual({ status: "ok" });
    expect(of(events, "cmd")).toHaveLength(2);
    const vs = await versions(ids.diagramId);
    expect(vs).toHaveLength(1);
    expect(vs[0]).toMatchObject({ status: "complete", source: "ai" });
    expect(vs[0]!.state).toEqual({ ...s2, warnings: [] });
    const msgs = await listMessages(ids.diagramId);
    expect(msgs[1]!.meta).toMatchObject({ status: "complete", applied: S2_CMDS, version: 1 });
  });

  test("missing_info_answer turn passes open items to clef and the prompt", async () => {
    const ids = await makeOwnedDiagram();
    const st = emptyState();
    st.nodes["was-1"] = { id: "was-1", kind: "was", label: "WAS#1", parent: null, attrs: { cpu: "4코어" }, unknown: ["ip"] };
    st.nodes["db-1"] = { id: "db-1", kind: "db_rdb", label: "DB", parent: null, attrs: {} };
    st.edges["e-was-1-db-1"] = { id: "e-was-1-db-1", from: "was-1", to: "db-1", edgeKind: "request", label: "" };
    await createVersion(ids.diagramId, st, { source: "import" });
    const missing = computeMissing(st).items.filter((m) => !m.unknown);
    expect(missing.length).toBeGreaterThan(0);

    const clef = fakeClef({ intent: "missing_info_answer", confidence: 0.9 });
    const qwen = fakeQwen(JSON.stringify({ op: "update_node", id: "was-1", attrs: { ram: "16GB" } }));
    await turn(ids, "RAM 은 16GB", { qwen, clef });

    const ctx = (clef.calls[0] as { context: { openItems?: string[] } }).context;
    expect(ctx.openItems).toContain("WAS#1 RAM");
    expect(ctx.openItems).toContain("WAS#1 → DB 프로토콜/포트");
    expect(ctx.openItems).not.toContain("WAS#1 IP"); // 모름 항목 제외
    expect(ctx.openItems).not.toContain("WAS#1 CPU"); // 이미 채워짐
    expect(ctx.openItems).toHaveLength(missing.length);

    const msgs = qwen.calls[0]!;
    expect(msgs[0]).toEqual({ role: "system", content: SYSTEM_PROMPT });
    const user = msgs.at(-1)!.content;
    expect(user).toContain("\n\n채워야 할 정보:\n");
    expect(user).toContain("\nwas-1 ram(RAM)");
    expect(user).toContain("e-was-1-db-1 label(프로토콜/포트)");
    expect(user).not.toContain("was-1 ip(IP)");
    expect(user.indexOf("채워야 할 정보:")).toBeLessThan(user.indexOf("요청: RAM 은 16GB"));
  });

  test("structural change removes obsolete groups", async () => {
    const ids = await makeOwnedDiagram();
    const base = applyCommands(emptyState(), [
      { op: "add_group", id: "aws-region", group_kind: "cloud_region", label: "AWS 서울 리전", parent: null },
      { op: "add_group", id: "vpc", group_kind: "vpc", label: "서비스 VPC", parent: "aws-region" },
      { op: "add_group", id: "pub", group_kind: "subnet_public", label: "공개 구역", parent: "vpc" },
      { op: "add_group", id: "priv", group_kind: "subnet_private", label: "내부 구역", parent: "vpc" },
      { op: "add_group", id: "spare", group_kind: "dmz", label: "원래 빈 구역", parent: null },
      { op: "add_node", id: "client", kind: "client_web", label: "사용자", parent: null },
      { op: "add_node", id: "alb", kind: "lb_l7", label: "ALB", parent: "pub" },
      { op: "add_node", id: "was-1", kind: "was", label: "WAS#1", parent: "priv", attrs: { ip: "10.0.1.5" } },
      { op: "add_edge", from: "client", to: "alb", edge_kind: "request" },
      { op: "add_edge", from: "alb", to: "was-1", edge_kind: "request" },
      { op: "add_edge", from: "client", to: "vpc", edge_kind: "aux" },
    ] as Parameters<typeof applyCommands>[1]);
    expect(base.errors).toEqual([]);
    await createVersion(ids.diagramId, base.state, { source: "import" });
    const lines = [
      { op: "remove_node", id: "alb" },
      { op: "add_group", id: "idc", group_kind: "idc", label: "사내 IDC", parent: null },
      { op: "add_node", id: "l4", kind: "lb_l4", label: "L4", parent: "idc" },
      { op: "update_node", id: "was-1", parent: "idc" },
      { op: "add_edge", from: "client", to: "l4", edge_kind: "request" },
      { op: "add_edge", from: "l4", to: "was-1", edge_kind: "request" },
    ].map((l) => JSON.stringify(l));
    const { events } = await turn(ids, "가정 변경: 환경 → 사내 IDC", { qwen: fakeQwen(lines.join("\n")), clef: fakeClef(null) });

    const latest = await getLatestState(ids.diagramId);
    expect(latest!.number).toBe(2);
    const st = latest!.state;
    expect(Object.keys(st.groups).sort()).toEqual(["idc", "spare"]);
    expect(st.nodes["was-1"]).toMatchObject({ parent: "idc", attrs: { ip: "10.0.1.5" } });
    expect(Object.keys(st.edges).sort()).toEqual(["e-client-l4", "e-l4-was-1"]);

    // 정리된 그룹은 remove_group cmd 로도 나가, 클라이언트가 같은 상태에 닿는다.
    const cmds = of(events, "cmd").map((e) => e.cmd);
    const pruned = cmds.filter((c) => c.op === "remove_group").map((c) => (c as { id: string }).id);
    expect(pruned.sort()).toEqual(["aws-region", "priv", "pub", "vpc"]);
    const client = applyCommands(base.state, cmds);
    expect(client.errors).toEqual([]);
    expect(Object.keys(client.state.groups).sort()).toEqual(Object.keys(st.groups).sort());
    expect(Object.keys(client.state.edges).sort()).toEqual(Object.keys(st.edges).sort());
    expect(events.at(-1)).toMatchObject({ t: "done", applied: lines.length });
  });

  test("moving a node out before remove_group keeps it and its attrs", async () => {
    const ids = await makeOwnedDiagram();
    const base = applyCommands(emptyState(), [
      { op: "add_group", id: "aws-region", group_kind: "cloud_region", label: "AWS 서울 리전", parent: null },
      { op: "add_group", id: "vpc", group_kind: "vpc", label: "서비스 VPC", parent: "aws-region" },
      { op: "add_group", id: "priv", group_kind: "subnet_private", label: "내부 구역", parent: "vpc" },
      { op: "add_node", id: "client", kind: "client_web", label: "사용자", parent: null },
      { op: "add_node", id: "alb", kind: "lb_l7", label: "ALB", parent: "vpc" },
      { op: "add_node", id: "was-1", kind: "was", label: "WAS#1", parent: "priv", attrs: { ip: "10.0.1.5" } },
      { op: "add_edge", from: "client", to: "alb", edge_kind: "request" },
      { op: "add_edge", from: "alb", to: "was-1", edge_kind: "request" },
    ] as Parameters<typeof applyCommands>[1]);
    expect(base.errors).toEqual([]);
    await createVersion(ids.diagramId, base.state, { source: "import" });
    const lines = [
      { op: "add_group", id: "idc", group_kind: "idc", label: "사내 IDC", parent: null },
      { op: "update_node", id: "was-1", parent: "idc" },
      { op: "remove_group", id: "aws-region" },
      { op: "add_node", id: "l4", kind: "lb_l4", label: "L4", parent: "idc" },
      { op: "add_edge", from: "client", to: "l4", edge_kind: "request" },
      { op: "add_edge", from: "l4", to: "was-1", edge_kind: "request" },
    ].map((l) => JSON.stringify(l));
    const { events } = await turn(ids, "가정 변경: 환경 → 사내 IDC", { qwen: fakeQwen(lines.join("\n")), clef: fakeClef(null) });

    expect(of(events, "skip")).toEqual([]);
    const st = (await getLatestState(ids.diagramId))!.state;
    expect(Object.keys(st.groups)).toEqual(["idc"]);
    expect(st.nodes["was-1"]).toMatchObject({ parent: "idc", attrs: { ip: "10.0.1.5" } });
    expect(st.nodes.alb).toBeUndefined();
    expect(Object.keys(st.edges).sort()).toEqual(["e-client-l4", "e-l4-was-1"]);
    expect(events.at(-1)).toMatchObject({ t: "done", applied: lines.length });
  });

  describe("warning check", () => {
    const PUBLIC_DB_LINES = [
      JSON.stringify({ op: "add_group", id: "pub", group_kind: "subnet_public", label: "공개", parent: null }),
      JSON.stringify({ op: "add_node", id: "db-1", kind: "db_rdb", label: "DB", parent: "pub" }),
    ];
    const TEMPLATE = "DB이(가) 공개 구역에 있어요.";

    /** 첫 호출은 명령 줄, 둘째 호출(경고 문구)은 문구 줄을 흘리는 가짜 Qwen. */
    function seqQwen(first: string, second: string): QwenClient & { calls: ChatMessage[][] } {
      const a = fakeQwen(first);
      const b = fakeQwen(second);
      const calls: ChatMessage[][] = [];
      let n = 0;
      return {
        calls,
        streamCompletion(messages, o) {
          calls.push(messages);
          return (n++ === 0 ? a : b).streamCompletion(messages, o);
        },
      };
    }

    function spyClef() {
      const clef = fakeClef(null);
      const decide = vi.fn(async () => null as never);
      return Object.assign(clef, { decide });
    }

    test("turn saves warnings into the version and emits fresh ones before done", async () => {
      const ids = await makeOwnedDiagram();
      const text = JSON.stringify({ id: "db_public:db-1", text: "DB 가 공개 구역에 있어 위험해요." });
      const { events } = await turn(ids, "DB 그려줘", { qwen: seqQwen(PUBLIC_DB_LINES.join("\n"), text), clef: spyClef() });

      const idx = (t: string) => events.findIndex((e) => e.t === t);
      expect(events.some((e) => e.t === "status" && e.phase === "checking")).toBe(true);
      expect(idx("warnings")).toBeGreaterThan(idx("status"));
      expect(events.at(-1)!.t).toBe("done");
      expect(idx("warnings")).toBe(events.length - 2);
      const w = of(events, "warnings")[0]!;
      expect(w.items.map((x) => x.id).sort()).toEqual(["db_public:db-1", "spof:db-1"]);
      expect(w.items.find((x) => x.id === "db_public:db-1")!.text).toBe("DB 가 공개 구역에 있어 위험해요.");

      const latest = await getLatestState(ids.diagramId);
      expect(latest!.state.warnings).toEqual(w.items);
      expect(Object.keys(latest!.state.nodes)).toEqual(["db-1"]);
      const msgs = await listMessages(ids.diagramId);
      expect(msgs[1]!.meta.warnings).toEqual(w.items);
    });

    test("ignored warning is not announced again", async () => {
      const ids = await makeOwnedDiagram();
      const base = { ...emptyState(), ignoredWarnings: ["db_public:db-1"] };
      await createVersion(ids.diagramId, base, { source: "import" });
      const { events } = await turn(ids, "DB 그려줘", { qwen: seqQwen(PUBLIC_DB_LINES.join("\n"), ""), clef: spyClef() });
      expect(of(events, "warnings")[0]!.items.map((x) => x.id)).toEqual(["spof:db-1"]);
      const latest = await getLatestState(ids.diagramId);
      expect(latest!.state.warnings?.map((x) => x.id).sort()).toEqual(["db_public:db-1", "spof:db-1"]);
      expect(latest!.state.ignoredWarnings).toEqual(["db_public:db-1"]);
      const msgs = await listMessages(ids.diagramId);
      expect(msgs[1]!.meta.warnings?.map((x) => x.id)).toEqual(["spof:db-1"]);
    });

    test("code-only fresh warnings are skipped when all are ignored", async () => {
      const ids = await makeOwnedDiagram();
      const base = { ...emptyState(), ignoredWarnings: ["db_public:db-1", "spof:db-1"] };
      await createVersion(ids.diagramId, base, { source: "import" });
      const { events } = await turn(ids, "DB 그려줘", { qwen: seqQwen(PUBLIC_DB_LINES.join("\n"), ""), clef: spyClef() });
      expect(of(events, "warnings")).toHaveLength(0);
      const msgs = await listMessages(ids.diagramId);
      expect(msgs[1]!.meta).not.toHaveProperty("warnings");
    });

    test("abort during checking saves an aborted version with code warnings (no prior db_exposed) and frees the lock", async () => {
      const ids = await makeOwnedDiagram();
      const ctrl = new AbortController();
      const clef = spyClef();
      const { events } = await turn(
        ids,
        "DB 그려줘",
        { qwen: seqQwen(PUBLIC_DB_LINES.join("\n"), "never"), clef },
        {
          signal: ctrl.signal,
          onEvent(e) {
            if (e.t === "status" && e.phase === "checking") ctrl.abort();
          },
        },
      );
      expect(of(events, "error")).toHaveLength(0);
      expect(events.at(-1)).toMatchObject({ t: "done", status: "aborted", applied: 2 });
      const vs = await versions(ids.diagramId);
      expect(vs[0]).toMatchObject({ status: "aborted" });
      expect((await getLatestState(ids.diagramId))!.state.warnings!.find((x) => x.id === "db_public:db-1")!.text).toBe(TEMPLATE);
      expect((await listMessages(ids.diagramId))[1]!.meta.status).toBe("aborted");
      const next = await turn(ids, "다시", { qwen: fakeQwen(JSON.stringify({ op: "say", text: "네" })), clef: fakeClef(null) });
      expect(next.events.at(-1)).toMatchObject({ t: "done", status: "complete" });
    });

    test("abort during checking keeps the previous db_exposed warning", async () => {
      const ids = await makeOwnedDiagram();
      const base = emptyState();
      base.groups["priv"] = { id: "priv", groupKind: "subnet_private", label: "내부", parent: null };
      base.nodes["db-9"] = { id: "db-9", kind: "db_rdb", label: "원장 DB", parent: "priv", attrs: {} };
      base.warnings = [{ id: "db_exposed:db-9", rule: "db_exposed", nodeId: "db-9", level: "warn", text: "예전 노출 문구", guide: "g" }];
      await createVersion(ids.diagramId, base, { source: "import" });
      const ctrl = new AbortController();
      const { events } = await turn(
        ids,
        "DB 그려줘",
        { qwen: seqQwen(PUBLIC_DB_LINES.join("\n"), "never"), clef: spyClef() },
        {
          signal: ctrl.signal,
          onEvent(e) {
            if (e.t === "status" && e.phase === "checking") ctrl.abort();
          },
        },
      );
      expect(events.at(-1)).toMatchObject({ t: "done", status: "aborted" });
      const saved = (await getLatestState(ids.diagramId))!.state.warnings!;
      expect(saved.find((x) => x.id === "db_exposed:db-9")!.text).toBe("예전 노출 문구");
      expect(of(events, "warnings").flatMap((w) => w.items.map((x) => x.id))).not.toContain("db_exposed:db-9");
    });

    test("turn time cap during checking saves aborted and emits the timeout error", async () => {
      const ids = await makeOwnedDiagram();
      const clef = fakeClef(null);
      clef.decide = vi.fn((_t, _q, sig: AbortSignal) => new Promise<never>((_r, rej) => sig.addEventListener("abort", () => rej(abortError()), { once: true })));
      const { events } = await turn(
        ids,
        "DB 그려줘",
        { qwen: fakeQwen(JSON.stringify({ op: "add_node", id: "db-1", kind: "db_rdb", label: "DB", parent: null })), clef, turnTimeoutMs: 400 },
      );
      expect(of(events, "error").map((e) => e.message)).toEqual([TIMEOUT_TEXT]);
      expect(events.at(-1)).toMatchObject({ t: "done", status: "aborted", applied: 1 });
      expect((await versions(ids.diagramId))[0]).toMatchObject({ status: "aborted" });
    });

    test("answer-only turn does not check", async () => {
      const ids = await makeOwnedDiagram();
      await createVersion(ids.diagramId, s2, { source: "import" });
      const clef = Object.assign(fakeClef({ intent: "question", confidence: 0.95 }), { decide: vi.fn(async () => null as never) });
      const { events } = await turn(ids, "몇 대야?", { qwen: fakeQwen("두 대예요."), clef });
      expect(events.some((e) => e.t === "status" && e.phase === "checking")).toBe(false);
      expect(of(events, "warnings")).toHaveLength(0);
      expect(clef.decide).not.toHaveBeenCalled();
      expect(await versions(ids.diagramId)).toHaveLength(1);
    });

    test("abort skips AI checks and keeps code warnings", async () => {
      const ids = await makeOwnedDiagram();
      const ctrl = new AbortController();
      const clef = spyClef();
      const { events } = await turn(
        ids,
        "DB 그려줘",
        { qwen: seqQwen([...PUBLIC_DB_LINES, JSON.stringify({ op: "say", text: "끝" })].join("\n"), "never"), clef },
        {
          signal: ctrl.signal,
          onEvent(e) {
            if (e.t === "cmd" && e.cmd.op === "add_node") ctrl.abort();
          },
        },
      );
      expect(events.at(-1)).toMatchObject({ t: "done", status: "aborted", applied: 2 });
      expect(clef.decide).not.toHaveBeenCalled();
      const latest = await getLatestState(ids.diagramId);
      expect(latest!.state.warnings!.map((x) => x.id).sort()).toEqual(["db_public:db-1", "spof:db-1"]);
      expect(latest!.state.warnings!.find((x) => x.id === "db_public:db-1")!.text).toBe(TEMPLATE);
      expect(of(events, "status").some((e) => e.phase === "checking")).toBe(false);
    });
  });
});
