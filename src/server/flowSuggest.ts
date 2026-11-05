import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db/client";
import { diagrams, flows } from "@/db/schema";
import { parseCommand, toFlowOp } from "@/domain/commands";
import { checkFlow, type Flow, type FlowOp } from "@/domain/flows";
import type { DiagramState } from "@/domain/types";
import { defaultChatDeps } from "@/server/chat/deps";
import { withDiagramLock } from "@/server/chat/lock";
import { normalizeAiCommand } from "@/server/chat/normalize";
import { buildFlowSuggestMessages } from "@/server/chat/prompt";
import { applyFlowOps, FLOW_BUSY_MESSAGE } from "@/server/flows";
import { createJsonlParser } from "@/server/llm/jsonl";
import type { ChatMessage, QwenClient } from "@/server/llm/qwen";
import { getOwnedDiagram } from "@/server/projects";
import { getLatestState } from "@/server/versions";

export const FLOW_SUGGEST_BUSY_MESSAGE = FLOW_BUSY_MESSAGE;
export const FLOW_SUGGEST_FAIL_MESSAGE = "흐름을 만들지 못했어요. 다시 시도해 주세요.";
// 한 번에 저장하는 제안 흐름 수의 상한(프롬프트는 3~5개를 요청한다).
const SUGGEST_MAX = 5;
// Qwen 요청 1건의 상한. 실패하거나 쓸 흐름이 하나도 없으면 1회 다시 요청한다.
const QWEN_TIMEOUT_MS = 30_000;
const ATTEMPTS = 2;
// 저장할 때 대화 차례가 잠금을 쥐고 있으면 잠깐씩 기다렸다 다시 잡는다.
const LOCK_TRIES = 5;
const LOCK_WAIT_MS = 1000;

type AddFlowOp = Extract<FlowOp, { op: "add_flow" }>;

export type SuggestResult = { ok: true; saved: number } | { ok: false; message: string };

/** 흐름 제안이 쓰는 저장소 함수. 단위 테스트는 가짜를 넣는다. */
export interface FlowSuggestRepo {
  /** 남의 것·없는 것이면 NotFoundError 를 던진다. */
  getOwnedDiagram(userId: string, diagramId: string): Promise<unknown>;
  withLock<T>(diagramId: string, fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }>;
  /**
   * 제안 시각을 적는다. onlyFirst 면 아직 제안한 적 없을 때만 적고, 적었는지 돌려준다
   * (동시에 온 자동 제안이 두 번 돌지 않게).
   */
  claimSuggest(diagramId: string, at: Date, onlyFirst: boolean): Promise<boolean>;
  getLatestState(diagramId: string): Promise<{ state: DiagramState } | null>;
  listFlows(diagramId: string): Promise<Flow[]>;
  applyFlowOps(diagramId: string, state: DiagramState, ops: FlowOp[], source: "ai"): Promise<{ saved: number; rejected: { id: string; reason: string }[] }>;
}

export interface FlowSuggestDeps {
  qwen: QwenClient | null;
  repo: FlowSuggestRepo;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
}

const dbRepo: FlowSuggestRepo = {
  getOwnedDiagram,
  withLock: withDiagramLock,
  async claimSuggest(diagramId, at, onlyFirst) {
    const where = onlyFirst ? and(eq(diagrams.id, diagramId), isNull(diagrams.flowsSuggestedAt)) : eq(diagrams.id, diagramId);
    const rows = await db.update(diagrams).set({ flowsSuggestedAt: at }).where(where).returning({ id: diagrams.id });
    return rows.length > 0;
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
    sleep: input.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))),
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
 * 모델을 부르기 전에 flowsSuggestedAt 을 적는다(하나도 못 만들어도).
 * 모델 호출 중에는 잠금을 쥐지 않는다(처음 그린 직후 사용자가 보낼 다음 말을 막지 않게).
 * 저장만 잠금 안에서, 그때의 최신 구성도로 검사한다(그 사이 지워진 연결을 가리키는 흐름은 거절).
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

  // 1. 준비(잠금 없음)
  const current = await repo.listFlows(diagramId);
  if (opts.auto && current.length > 0) return { ok: true, saved: 0 };
  const fail: SuggestResult = { ok: false, message: FLOW_SUGGEST_FAIL_MESSAGE };
  const state = (await repo.getLatestState(diagramId))?.state;
  // 연결이 없으면 흐름을 만들 수 없다. 모델을 부르지 않으므로 제안 시각도 적지 않는다.
  if (!state || Object.keys(state.edges).length === 0 || !deps.qwen) return fail;
  const claimed = await repo.claimSuggest(diagramId, deps.now(), opts.auto);
  if (!claimed) return { ok: true, saved: 0 };

  // 2. 모델 호출(잠금 없음)
  const messages = buildFlowSuggestMessages(state, current);
  const taken = new Set(current.map((f) => f.id));
  let picked: AddFlowOp[] = [];
  for (let attempt = 0; attempt < ATTEMPTS && picked.length === 0; attempt++) {
    if (opts.signal?.aborted) break;
    const out = await complete(deps.qwen, messages, opts.signal);
    if (out !== null) picked = pickFlows(out, state, taken);
  }
  if (picked.length === 0) return fail;

  // 3. 저장(잠금 안, 최신 구성도로 다시 검사)
  for (let tryNo = 0; tryNo < LOCK_TRIES; tryNo++) {
    if (tryNo > 0) await deps.sleep(LOCK_WAIT_MS);
    const locked = await repo.withLock(diagramId, async () => {
      const latest = (await repo.getLatestState(diagramId))?.state ?? state;
      return (await repo.applyFlowOps(diagramId, latest, picked, "ai")).saved;
    });
    if (locked.ok) return locked.value > 0 ? { ok: true, saved: locked.value } : fail;
  }
  return { ok: false, message: FLOW_SUGGEST_BUSY_MESSAGE };
}
