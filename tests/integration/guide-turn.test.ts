import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { db } from "@/db/client";
import { explanations, flows } from "@/db/schema";
import { getGuide } from "@/domain/guides";
import type { ChatEvent } from "@/server/chat/events";
import { listMessages } from "@/server/chat/messages";
import { runChatTurn, type ChatDeps, type ChatSessionTarget } from "@/server/chat/pipeline";
import { createGuideRun, getGuideRun, LEARNING_LOCKED_MESSAGE, saveGuideRun } from "@/server/guide/runs";
import type { ClefClient, Intent } from "@/server/llm/clef";
import type { QwenClient } from "@/server/llm/qwen";
import { ValidationError } from "@/server/projects";
import { getLatestState, listVersions } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

const SHOP = getGuide("shop")!;
const ONPREM = SHOP.variants.onprem!;

/** Clef 가 답하지 못하는 경우(키워드로 판정). 의도 분류는 부르면 안 된다(학습 중에는 가이드가 정한다). */
const clefDown: ClefClient = {
  async decide() {
    throw new Error("clef down");
  },
  async classifyIntent() {
    throw new Error("classifyIntent must not be called while learning");
  },
};

const clefIntent = (intent: Intent): ClefClient => ({
  async decide() {
    throw new Error("clef down");
  },
  async classifyIntent() {
    return { intent, confidence: 0.95 };
  },
});

const neverQwen: QwenClient = {
  async streamCompletion() {
    throw new Error("qwen must not be called");
  },
};

function textQwen(text: string): QwenClient {
  return {
    async streamCompletion(_m, { onDelta }) {
      onDelta(text);
      return { text, finishReason: "stop" };
    },
  };
}

async function turn(ids: { userId: string; diagramId: string }, text: string, deps: ChatDeps, session?: ChatSessionTarget) {
  const events: ChatEvent[] = [];
  const result = await runChatTurn({ ...ids, text, ...(session ? { session } : {}), signal: new AbortController().signal, emit: (e) => events.push(e) }, deps);
  return { events, result };
}

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("guide turn through runChatTurn", () => {
  test("pipeline routes an active run to the guide turn", async () => {
    const ids = await makeOwnedDiagram();
    await createGuideRun({ diagramId: ids.diagramId, guideId: "shop", env: null });
    const deps: ChatDeps = { qwen: neverQwen, clef: clefDown };

    // 환경 확정
    const env = await turn(ids, "온프레미스로 할게요", deps);
    expect(env.result).toEqual({ status: "ok" });
    expect(env.events.find((e) => e.t === "guide")).toMatchObject({ view: { env: "onprem", step: 0, total: ONPREM.steps.length } });
    let run = await getGuideRun(ids.diagramId);
    expect(run).toMatchObject({ env: "onprem", envVersion: 1, step: 0, status: "active" });

    // 단계마다 예시 문장을 보내면 대본 끝까지 간다.
    for (const [i, step] of ONPREM.steps.entries()) {
      const { events } = await turn(ids, step.example, deps);
      expect(events.filter((e) => e.t === "error")).toEqual([]);
      expect(events.at(-1)).toMatchObject({ t: "done", version: i + 2, status: "complete" });
      if (i === 0) {
        // 같은 글을 다시 보내도 같은 단계를 두 번 그리지 않는다(진행 상태를 잠금 안에서 읽는다).
        const again = await turn(ids, step.example, deps);
        expect(again.events.at(-1)).toMatchObject({ t: "done", version: null });
        expect(again.events.find((e) => e.t === "say")).toEqual({ t: "say", text: ONPREM.steps[1]!.miss });
      }
    }
    run = await getGuideRun(ids.diagramId);
    expect(run).toMatchObject({ status: "done", step: ONPREM.steps.length });
    expect(run!.stepVersions).toEqual(ONPREM.steps.map((_, i) => i + 2));

    const versions = await listVersions(ids.diagramId);
    expect(versions.at(-1)!.summary).toBe("학습: 환경 온프레미스");
    expect(versions[0]!.summary).toBe(`학습 ${ONPREM.steps.length}단계: ${ONPREM.steps.at(-1)!.goal}`);
    const state = (await getLatestState(ids.diagramId))!.state;
    expect(Object.values(state.assumptions).every((a) => a.confirmed)).toBe(true);

    // 흐름은 확인한 사용자 흐름으로, 설명은 대본 글로 저장된다.
    const savedFlows = await db.select().from(flows).where(eq(flows.diagramId, ids.diagramId));
    expect(savedFlows.length).toBeGreaterThan(0);
    expect(savedFlows.every((f) => f.source === "user" && f.reviewed)).toBe(true);
    const fw = await db
      .select()
      .from(explanations)
      .where(and(eq(explanations.diagramId, ids.diagramId), eq(explanations.targetKind, "node"), eq(explanations.targetId, "fw-ext")));
    expect(fw).toHaveLength(1);

    const msgs = await listMessages(ids.diagramId);
    const kinds = msgs.filter((m) => m.meta.guide).map((m) => m.meta.guide!.kind);
    expect(kinds).toEqual([...ONPREM.steps.map((_, i) => (i === 0 ? ["step", "miss"] : ["step"])).flat(), "done"]);
    expect(msgs.at(-1)).toMatchObject({ content: ONPREM.outro, meta: { guide: { kind: "done", rebuild: ["cloud"] } } });
  });

  test("a question in learning streams an answer and keeps the step", async () => {
    const ids = await makeOwnedDiagram();
    await createGuideRun({ diagramId: ids.diagramId, guideId: "shop", env: "onprem" });
    const { events } = await turn(ids, "DMZ 가 뭐야?", { qwen: textQwen("DMZ 는 인터넷과 내부 사이 구역이에요."), clef: clefDown });
    expect(events.find((e) => e.t === "start")).toMatchObject({ intent: "question" });
    expect(events.filter((e) => e.t === "answer").map((e) => (e as { delta: string }).delta).join("")).toBe("DMZ 는 인터넷과 내부 사이 구역이에요.");
    expect(events.filter((e) => e.t === "cmd" || e.t === "clarify" || e.t === "guide")).toEqual([]);
    expect(events.at(-1)).toMatchObject({ t: "done", version: null });
    expect(await getGuideRun(ids.diagramId)).toMatchObject({ step: 0, status: "active" });
    expect(await listVersions(ids.diagramId)).toEqual([]);
  });

  test("a question in learning without the AI server keeps the AI unavailable path", async () => {
    const ids = await makeOwnedDiagram();
    await createGuideRun({ diagramId: ids.diagramId, guideId: "shop", env: "onprem" });
    const { events } = await turn(ids, "DMZ 가 뭐야?", { qwen: null, clef: clefDown });
    expect(events.map((e) => e.t)).toEqual(["start", "error", "done"]);
    expect(await getGuideRun(ids.diagramId)).toMatchObject({ step: 0, status: "active" });
  });

  test("a diagram session is refused while learning", async () => {
    const ids = await makeOwnedDiagram();
    await createGuideRun({ diagramId: ids.diagramId, guideId: "shop", env: "onprem" });
    const r = turn(ids, ONPREM.steps[0]!.example, { qwen: neverQwen, clef: clefDown }, "new");
    await expect(r).rejects.toBeInstanceOf(ValidationError);
    await expect(r).rejects.toThrow(LEARNING_LOCKED_MESSAGE);
    expect(await listMessages(ids.diagramId)).toEqual([]);
  });

  test("a finished run goes back to the normal chat", async () => {
    const ids = await makeOwnedDiagram();
    const run = await createGuideRun({ diagramId: ids.diagramId, guideId: "shop", env: "onprem" });
    await saveGuideRun({ ...run, status: "done", step: ONPREM.steps.length });
    const line = JSON.stringify({ op: "add_node", id: "extra", kind: "was", label: "추가 WAS", parent: null });
    const { events } = await turn(ids, "WAS 하나 더 넣어 줘", { qwen: textQwen(`${line}\n`), clef: clefIntent("structure_change") });
    expect(events.find((e) => e.t === "start")).toMatchObject({ intent: "structure_change" });
    expect(events.filter((e) => e.t === "guide")).toEqual([]);
    expect(events.at(-1)).toMatchObject({ t: "done", version: 1, changed: 1 });
    // 세션도 다시 열 수 있다.
    const s = await turn(ids, "질문 하나", { qwen: textQwen(JSON.stringify({ op: "say", text: "네" })), clef: clefIntent("structure_change") }, "new");
    expect(s.result).toEqual({ status: "ok" });
  });
});
