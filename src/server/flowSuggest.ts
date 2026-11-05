import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { diagrams, flows } from "@/db/schema";
import { parseCommand, toFlowOp } from "@/domain/commands";
import { checkFlow, type Flow, type FlowOp } from "@/domain/flows";
import type { DiagramState } from "@/domain/types";
import { defaultChatDeps } from "@/server/chat/deps";
import { withDiagramLock } from "@/server/chat/lock";
import { normalizeAiCommand } from "@/server/chat/normalize";
import { buildFlowSuggestMessages } from "@/server/chat/prompt";
import { applyFlowOps } from "@/server/flows";
import { createJsonlParser } from "@/server/llm/jsonl";
import type { ChatMessage, QwenClient } from "@/server/llm/qwen";
import { getOwnedDiagram } from "@/server/projects";
import { getLatestState } from "@/server/versions";

export const FLOW_SUGGEST_BUSY_MESSAGE = "지금은 구성도를 그리는 중이에요. 잠시 뒤 다시 눌러 주세요.";
export const FLOW_SUGGEST_FAIL_MESSAGE = "흐름을 만들지 못했어요. 다시 시도해 주세요.";
// 한 번에 저장하는 제안 흐름 수의 상한(프롬프트는 3~5개를 요청한다).
const SUGGEST_MAX = 5;
// Qwen 요청 1건의 상한. 실패하거나 쓸 흐름이 하나도 없으면 1회 다시 요청한다.
const QWEN_TIMEOUT_MS = 30_000;
const ATTEMPTS = 2;

type AddFlowOp = Extract<FlowOp, { op: "add_flow" }>;

export type SuggestResult = { ok: true; saved: number } | { ok: false; message: string };

/** 흐름 제안이 쓰는 저장소 함수. 단위 테스트는 가짜를 넣는다. */
export interface FlowSuggestRepo {
  /** 남의 것·없는 것이면 NotFoundError 를 던진다. */
  getOwnedDiagram(userId: string, diagramId: string): Promise<unknown>;
  withLock<T>(diagramId: string, fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }>;
  getSuggestedAt(diagramId: string): Promise<Date | null>;
  markSuggested(diagramId: string, at: Date): Promise<void>;
  getLatestState(diagramId: string): Promise<{ state: DiagramState } | null>;
  listFlows(diagramId: string): Promise<Flow[]>;
  applyFlowOps(diagramId: string, state: DiagramState, ops: FlowOp[], source: "ai"): Promise<{ saved: number; rejected: { id: string; reason: string }[] }>;
}

export interface FlowSuggestDeps {
  qwen: QwenClient | null;
  repo: FlowSuggestRepo;
  now: () => Date;
}

const dbRepo: FlowSuggestRepo = {
  getOwnedDiagram,
  withLock: withDiagramLock,
  async getSuggestedAt(diagramId) {
    const [row] = await db.select({ at: diagrams.flowsSuggestedAt }).from(diagrams).where(eq(diagrams.id, diagramId));
    return row?.at ?? null;
  },
  async markSuggested(diagramId, at) {
    await db.update(diagrams).set({ flowsSuggestedAt: at }).where(eq(diagrams.id, diagramId));
  },
  getLatestState,
  async listFlows(diagramId) {
    const rows = await db.select({ data: flows.data }).from(flows).where(eq(flows.diagramId, diagramId));
    return rows.map((r) => r.data);
  },
  applyFlowOps,
};

type DepsInput = Partial<Omit<FlowSuggestDeps, "repo">> & { repo?: Partial<FlowSuggestRepo> };

function resolveDeps(input: DepsInput): FlowSuggestDeps {
  return {
    // qwen 을 넘기면 기본 클라이언트(환경 설정)를 만들지 않는다.
    qwen: "qwen" in input ? (input.qwen ?? null) : defaultChatDeps().qwen,
    repo: { ...dbRepo, ...input.repo },
    now: input.now ?? (() => new Date()),
  };
}

async function complete(qwen: QwenClient, messages: ChatMessage[], signal?: AbortSignal): Promise<string | null> {
  const timeout = AbortSignal.timeout(QWEN_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let streamed = "";
  try {
    const r = await qwen.streamCompletion(messages, {
      signal: combined,
      onDelta(d) {
        streamed += d;
      },
    });
    return r.text || streamed;
  } catch {
    return null;
  }
}

/**
 * 모델 출력에서 쓸 수 있는 add_flow 만 고른다(최대 SUGGEST_MAX 개).
 * 다른 명령·깨진 줄·형식 오류·이미 있거나 겹치는 id·구성도 검사에 걸린 흐름은 버린다.
 */
function pickFlows(text: string, state: DiagramState, takenIds: Set<string>): AddFlowOp[] {
  const picked: AddFlowOp[] = [];
  const taken = new Set(takenIds);
  const parser = createJsonlParser(
    (value) => {
      if (picked.length >= SUGGEST_MAX) return;
      if (!value || typeof value !== "object" || (value as { op?: unknown }).op !== "add_flow") return;
      const parsed = parseCommand(normalizeAiCommand(value));
      if (!parsed.ok || parsed.cmd.op !== "add_flow") return;
      const op = toFlowOp(parsed.cmd) as AddFlowOp;
      if (taken.has(op.id)) return;
      if (checkFlow(state, { id: op.id, name: op.name, origin: op.origin, steps: op.steps }).length) return;
      taken.add(op.id);
      picked.push(op);
    },
    () => {},
  );
  parser.push(text);
  parser.end({ dropPartial: true });
  return picked;
}

/**
 * 구성도의 흐름을 AI 로 제안해 "AI 제안"(미검수)으로 저장한다. 구성도 버전은 만들지 않는다.
 * - auto: 이미 제안했거나 흐름이 있으면 아무것도 하지 않는다(처음 그린 뒤 한 번만).
 * - 버튼(auto=false): 흐름이 있어도 덧붙인다. 이미 있는 흐름은 모델에게 알려 새 id 를 쓰게 한다.
 * 대화 잠금 안에서 돌고, 모델을 부르면 flowsSuggestedAt 을 적는다(하나도 못 만들어도).
 */
export async function suggestFlows(
  userId: string,
  diagramId: string,
  opts: { auto: boolean; signal?: AbortSignal },
  depsInput: DepsInput = {},
): Promise<SuggestResult> {
  const deps = resolveDeps(depsInput);
  const { repo } = deps;
  await repo.getOwnedDiagram(userId, diagramId);

  const locked = await repo.withLock(diagramId, async (): Promise<SuggestResult> => {
    const current = await repo.listFlows(diagramId);
    if (opts.auto && (current.length > 0 || (await repo.getSuggestedAt(diagramId)))) return { ok: true, saved: 0 };

    const fail: SuggestResult = { ok: false, message: FLOW_SUGGEST_FAIL_MESSAGE };
    const state = (await repo.getLatestState(diagramId))?.state;
    // 연결이 없으면 흐름을 만들 수 없다. 모델을 부르지 않으므로 제안 시각도 적지 않는다.
    if (!state || Object.keys(state.edges).length === 0 || !deps.qwen) return fail;

    await repo.markSuggested(diagramId, deps.now());
    const messages = buildFlowSuggestMessages(state, current);
    const taken = new Set(current.map((f) => f.id));
    let picked: AddFlowOp[] = [];
    for (let attempt = 0; attempt < ATTEMPTS && picked.length === 0; attempt++) {
      if (opts.signal?.aborted) break;
      const out = await complete(deps.qwen, messages, opts.signal);
      if (out !== null) picked = pickFlows(out, state, taken);
    }
    if (picked.length === 0) return fail;

    const { saved } = await repo.applyFlowOps(diagramId, state, picked, "ai");
    return saved > 0 ? { ok: true, saved } : fail;
  });
  return locked.ok ? locked.value : { ok: false, message: FLOW_SUGGEST_BUSY_MESSAGE };
}
