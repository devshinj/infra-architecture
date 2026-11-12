import { describe, expect, test } from "vitest";

import { CLARIFY_AUTO, CLARIFY_AUTO_VALUE, CLARIFY_REPLY } from "@/domain/clarify";
import type { ChatEvent } from "@/server/chat/events";
import { listMessages } from "@/server/chat/messages";
import { runChatTurn, type ChatDeps } from "@/server/chat/pipeline";
import type { ClefClient, Intent } from "@/server/llm/clef";
import type { ChatMessage, QwenClient } from "@/server/llm/qwen";
import { getLatestState, listVersions } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

const j = (o: unknown) => JSON.stringify(o);

/** 그리기 요청마다 lines 를 내는 가짜 Qwen. 경고 점검 요청에는 빈 답을 낸다. */
function fakeQwen(lines: string[]): QwenClient & { calls: ChatMessage[][] } {
  const calls: ChatMessage[][] = [];
  return {
    calls,
    async streamCompletion(messages, { onDelta }) {
      if (messages.some((m) => m.content.includes("경고 목록"))) return { text: "", finishReason: "stop" };
      calls.push(messages);
      const text = lines.join("\n");
      onDelta(text);
      return { text, finishReason: "stop" };
    },
  };
}

const clef = (intent: Intent | null): ClefClient => ({
  async decide() {
    throw new Error("not used");
  },
  async classifyIntent() {
    return intent ? { intent, confidence: 1 } : null;
  },
});

async function turn(ids: { userId: string; diagramId: string }, text: string, deps: ChatDeps, choices?: Record<string, string>) {
  const events: ChatEvent[] = [];
  const result = await runChatTurn({ ...ids, text, ...(choices ? { choices } : {}), signal: new AbortController().signal, emit: (e) => events.push(e) }, deps);
  return { events, result };
}
const of = <T extends ChatEvent["t"]>(events: ChatEvent[], t: T) => events.filter((e): e is Extract<ChatEvent, { t: T }> => e.t === t);
const lastUserText = (calls: ChatMessage[][]) => calls.at(-1)!.at(-1)!.content;

const DRAW = [
  j({ op: "say", text: "그릴게요" }),
  // 사용자가 고른 가정을 AI 가 바꾸려 해도 받지 않는다.
  j({ op: "set_assumption", key: "call_mode", value: "1:1 통화(단말끼리 직접)" }),
  j({ op: "set_assumption", key: "llm_serving", value: "외부 LLM API" }),
  j({ op: "add_node", id: "sfu", kind: "media_server", label: "SFU", parent: null }),
];
const REQUEST = "화상회의랑 챗봇을 넣어 줘";
const PICKED = { call_mode: "다자간(미디어 서버 경유)", llm_serving: CLARIFY_AUTO };

describe("그리기 전에 되묻기", () => {
  test("갈림길이 있으면 AI 를 부르지 않고 선택지만 보낸다. 구성·버전은 그대로다", async () => {
    const ids = await makeOwnedDiagram();
    const qwen = fakeQwen(DRAW);
    const { events, result } = await turn(ids, REQUEST, { qwen, clef: clef("structure_change") });

    expect(result).toEqual({ status: "ok" });
    expect(qwen.calls).toHaveLength(0);
    expect(events.map((e) => e.t)).toEqual(["start", "say", "clarify", "done"]);
    expect(of(events, "say")[0].text).toBe(CLARIFY_REPLY);
    expect(of(events, "clarify")[0].questions.map((q) => q.key)).toEqual(["call_mode", "llm_serving"]);
    expect(of(events, "done")[0]).toMatchObject({ version: null, applied: 0, changed: 0, status: "complete" });
    expect(await listVersions(ids.diagramId)).toHaveLength(0);

    const saved = (await listMessages(ids.diagramId)).at(-1)!;
    expect(saved.content).toBe(CLARIFY_REPLY);
    expect(saved.meta.clarify).toEqual({ questions: of(events, "clarify")[0].questions, text: REQUEST });
  });

  test("답을 받으면 원래 요청을 고른 답과 함께 그리고, 가정으로 남겨 다시 묻지 않는다", async () => {
    const ids = await makeOwnedDiagram();
    const qwen = fakeQwen(DRAW);
    // 답한 차례는 분류기를 부르지 않는다(분류가 실패해도 그린다).
    await turn(ids, REQUEST, { qwen, clef: clef("structure_change") });
    const { events } = await turn(ids, "통화 방식: 다자간(미디어 서버 경유) · LLM 위치: 알아서 정해 줘", { qwen, clef: clef(null) }, PICKED);

    expect(of(events, "start")[0].intent).toBe("structure_change");
    expect(of(events, "clarify")).toHaveLength(0);
    expect(qwen.calls).toHaveLength(1);
    const sent = lastUserText(qwen.calls);
    expect(sent).toContain(`요청: ${REQUEST}\n\n사용자가 고른 것(그대로 따른다): 통화 방식 = 다자간(미디어 서버 경유)`);
    expect(sent).toContain("사용자가 맡긴 것(알맞게 정하고 set_assumption 으로 밝힌다): LLM 위치(key llm_serving)");
    // 고른 답은 그리기 전에 가정으로 들어가 "현재 구성"에도 보인다.
    expect(sent).toContain('가정 "call_mode"="다자간(미디어 서버 경유)" (미확정)');

    const cmds = of(events, "cmd").map((e) => e.cmd);
    expect(cmds.slice(0, 2)).toEqual([
      { op: "set_assumption", key: "call_mode", value: "다자간(미디어 서버 경유)" },
      { op: "set_assumption", key: "llm_serving", value: CLARIFY_AUTO_VALUE },
    ]);
    const state = (await getLatestState(ids.diagramId))!.state;
    // 고른 것은 AI 가 바꾸지 못하고, 맡긴 것은 AI 가 정한 값이 남는다.
    expect(state.assumptions.call_mode.value).toBe("다자간(미디어 서버 경유)");
    expect(state.assumptions.llm_serving.value).toBe("외부 LLM API");
    expect(state.nodes.sfu.kind).toBe("media_server");
    expect(of(events, "done")[0]).toMatchObject({ version: 1, changed: 1 });

    // 같은 요청을 다시 해도 묻지 않고 그린다.
    const again = await turn(ids, REQUEST, { qwen: fakeQwen([j({ op: "say", text: "이미 있어요" })]), clef: clef("structure_change") });
    expect(of(again.events, "clarify")).toHaveLength(0);
  });

  test("되묻지 않는 경우: 질문 차례, 분류 실패, 요청에 선택이 들어 있을 때", async () => {
    for (const [text, intent] of [
      [REQUEST, "question"],
      [REQUEST, null],
      ["다자간 화상회의를 외부 LLM API 챗봇과 함께 넣어 줘", "structure_change"],
    ] as const) {
      const ids = await makeOwnedDiagram();
      const qwen = fakeQwen([j({ op: "say", text: "네" })]);
      const { events } = await turn(ids, text, { qwen, clef: clef(intent) });
      expect(of(events, "clarify"), text).toHaveLength(0);
      expect(qwen.calls.length, text).toBeGreaterThan(0);
    }
  });

  test("되물은 적이 없는데 온 답, 모르는 답은 버리고 보통 차례로 돈다", async () => {
    const ids = await makeOwnedDiagram();
    const qwen = fakeQwen([j({ op: "add_node", id: "was", kind: "was", label: "WAS", parent: null })]);
    const first = await turn(ids, "WAS 하나 넣어 줘", { qwen, clef: clef("structure_change") }, PICKED);
    expect(of(first.events, "cmd").map((e) => e.cmd.op)).toEqual(["add_node"]);
    expect(lastUserText(qwen.calls)).not.toContain("사용자가 고른 것");

    // 되물은 뒤라도 아는 답이 하나도 없으면 다시 묻는다.
    const other = await makeOwnedDiagram();
    await turn(other, REQUEST, { qwen, clef: clef("structure_change") });
    const bad = await turn(other, "아무거나", { qwen, clef: clef("structure_change") }, { call_mode: "우주 통신", hacked: "x" });
    expect(of(bad.events, "cmd").filter((e) => e.cmd.op === "set_assumption")).toHaveLength(0);
  });
});
