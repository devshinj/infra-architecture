import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { explanations, type ExplanationTargetKind } from "@/db/schema";
import { NODE_KINDS } from "@/domain/catalog";
import {
  LIMITS,
  overLimit,
  signatureOf,
  termCandidates,
  type EdgeExplanation,
  type NodeExplanation,
} from "@/domain/explain";
import type { DiagramState } from "@/domain/types";
import { defaultChatDeps } from "@/server/chat/deps";
import { buildExplainMessages } from "@/server/chat/prompt";
import { addAiTerm, ensureSeeded, findTerm, type AiTermInput, type GlossaryRow } from "@/server/glossary";
import { EXPLAIN_SCORE_QUESTION, scoreValue, type ClefClient } from "@/server/llm/clef";
import type { ChatMessage, QwenClient } from "@/server/llm/qwen";
import { getOwnedDiagram, ValidationError } from "@/server/projects";
import { getLatestState } from "@/server/versions";

export const EXPLAIN_FAIL_MESSAGE = "설명을 만들지 못했어요. 다시 시도해 주세요.";
const NOT_FOUND_MESSAGE = "대상을 찾을 수 없어요";
const INSTRUCTION_MAX = 200;
// 길이 초과와 Clef 점수를 합쳐 다시 쓰는 최대 횟수.
const MAX_REWRITES = 2;
// Clef 점수(0~2)가 이 값을 넘으면 다시 쓴다.
const SCORE_MAX = 1.3;
// Clef 단계 상한(대기열 포함). 재시도는 하지 않는다(3B 와 같다).
const CLEF_CAP_MS = 3000;
// Qwen 요청 1건의 상한.
const QWEN_TIMEOUT_MS = 30_000;

type Explanation = NodeExplanation | EdgeExplanation;
type NodeDraft = { definition?: string; role: string; adr: NodeExplanation["adr"] };
type EdgeDraft = Omit<EdgeExplanation, "kind">;
type Draft = NodeDraft | EdgeDraft;

export type ExplainResult =
  | { ok: true; explanation: Explanation; signature: string }
  | { ok: false; message: string; partial?: Partial<NodeExplanation> };

/** 설명 생성이 쓰는 저장소 함수. 단위 테스트는 가짜를 넣는다. */
export interface ExplainRepo {
  /** 남의 것·없는 것이면 NotFoundError 를 던진다. */
  getOwnedDiagram(userId: string, diagramId: string): Promise<unknown>;
  getLatestState(diagramId: string): Promise<{ state: DiagramState } | null>;
  ensureSeeded(userId: string): Promise<void>;
  findTerm(userId: string, keys: string[]): Promise<GlossaryRow | null>;
  addAiTerm(userId: string, entry: AiTermInput): Promise<GlossaryRow>;
  getCached(diagramId: string, targetKind: ExplanationTargetKind, targetId: string): Promise<{ signature: string; data: unknown } | null>;
  saveExplanation(row: {
    diagramId: string;
    targetKind: ExplanationTargetKind;
    targetId: string;
    signature: string;
    data: Explanation;
    updatedAt: Date;
  }): Promise<void>;
  listSignatures(diagramId: string): Promise<{ targetKind: ExplanationTargetKind; targetId: string; signature: string }[]>;
}

export interface ExplainDeps {
  qwen: QwenClient | null;
  clef: ClefClient;
  repo: ExplainRepo;
  now: () => Date;
}

const dbRepo: ExplainRepo = {
  getOwnedDiagram,
  getLatestState,
  ensureSeeded,
  findTerm,
  addAiTerm,
  async getCached(diagramId, targetKind, targetId) {
    const [row] = await db
      .select({ signature: explanations.signature, data: explanations.data })
      .from(explanations)
      .where(and(eq(explanations.diagramId, diagramId), eq(explanations.targetKind, targetKind), eq(explanations.targetId, targetId)));
    return row ?? null;
  },
  async saveExplanation(row) {
    await db
      .insert(explanations)
      .values(row)
      .onConflictDoUpdate({
        target: [explanations.diagramId, explanations.targetKind, explanations.targetId],
        set: { signature: row.signature, data: row.data, updatedAt: row.updatedAt },
      });
  },
  listSignatures(diagramId) {
    return db
      .select({ targetKind: explanations.targetKind, targetId: explanations.targetId, signature: explanations.signature })
      .from(explanations)
      .where(eq(explanations.diagramId, diagramId));
  },
};

type DepsInput = Partial<Omit<ExplainDeps, "repo">> & { repo?: Partial<ExplainRepo> };

function resolveDeps(input: DepsInput): ExplainDeps {
  // qwen·clef 를 둘 다 넘기면 기본 클라이언트(환경 설정)를 만들지 않는다.
  const hasQwen = "qwen" in input;
  const ai = hasQwen && input.clef ? null : defaultChatDeps();
  return {
    qwen: hasQwen ? (input.qwen ?? null) : ai!.qwen,
    clef: input.clef ?? ai!.clef,
    repo: { ...dbRepo, ...input.repo },
    now: input.now ?? (() => new Date()),
  };
}

const codePoints = (s: string) => [...s].length;

/** 앞뒤 코드펜스를 벗기고 JSON 객체 하나를 읽는다. */
function parseObject(text: string): Record<string, unknown> | null {
  const body = text
    .trim()
    .replace(/^```[a-zA-Z]*[ \t]*\r?\n?/, "")
    .replace(/\r?\n?```$/, "")
    .trim();
  try {
    const v: unknown = JSON.parse(body);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** 비어 있지 않은 문자열이면 다듬어서, 아니면 null. */
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

/** Qwen 출력 검사. 필수 항목이 비었거나 형식이 틀리면 null. needDefinition 이 거짓이면 definition 은 버린다. */
function parseDraft(raw: string, kind: "node" | "edge", needDefinition: boolean): Draft | null {
  const o = parseObject(raw);
  if (!o) return null;
  if (kind === "edge") {
    const flow = text(o.flow);
    const method = text(o.method);
    const why = text(o.why);
    const firewall = text(o.firewall);
    return flow && method && why && firewall ? { flow, method, why, firewall } : null;
  }
  const role = text(o.role);
  const adr = o.adr && typeof o.adr === "object" ? (o.adr as Record<string, unknown>) : {};
  const decision = text(adr.decision);
  const reason = text(adr.reason);
  const alternative = text(adr.alternative);
  const cost = text(adr.cost);
  if (!role || !decision || !reason || !alternative || !cost) return null;
  const draft: NodeDraft = { role, adr: { decision, reason, alternative, cost } };
  if (needDefinition) {
    const definition = text(o.definition);
    if (!definition) return null;
    draft.definition = definition;
  }
  return draft;
}

/** 캐시된 설명에서 AI 가 쓴 부분만(다시 쓰기의 "이전 결과"). */
function draftOf(e: unknown): object | undefined {
  if (!e || typeof e !== "object") return undefined;
  const x = e as Partial<NodeExplanation> & Partial<EdgeExplanation>;
  if (x.kind === "edge") return { flow: x.flow, method: x.method, why: x.why, firewall: x.firewall };
  if (x.kind === "node") return x.definitionSource === "ai" ? { definition: x.definition, role: x.role, adr: x.adr } : { role: x.role, adr: x.adr };
  return undefined;
}

const LIMIT_OF: Record<string, number> = {
  definition: LIMITS.definition,
  role: LIMITS.role,
  why: LIMITS.why,
  compare: LIMITS.compare,
  "adr.decision": LIMITS.adr,
  "adr.reason": LIMITS.adr,
  "adr.alternative": LIMITS.adr,
  "adr.cost": LIMITS.adr,
};

/** 길이 초과 지적. 사전에서 온 항목(정의·why·compare)은 다시 써도 바뀌지 않아 빼고 본다. */
function lengthProblems(e: Explanation): string[] {
  const fromGlossary = e.kind === "node" && e.definitionSource === "glossary";
  return overLimit(e)
    .filter((name) => !(fromGlossary && (name === "definition" || name === "why" || name === "compare")))
    .map((name) => {
      const max = e.kind === "edge" ? LIMITS.edge : LIMIT_OF[name]!;
      const value = name.startsWith("adr.") ? (e as NodeExplanation).adr[name.slice(4) as keyof NodeExplanation["adr"]] : ((e as unknown as Record<string, string>)[name] ?? "");
      return `${name}: ${max}자 이내로 줄일 것(지금 ${codePoints(value)}자)`;
    });
}

/** Clef 가 읽을 글: 노드는 정의+역할, 연결은 네 항목을 이어 붙인다. */
function scoredText(e: Explanation): string {
  return e.kind === "node" ? `${e.definition} ${e.role}` : [e.flow, e.method, e.why, e.firewall].join(" ");
}

/** Clef 점수(0~2). 실패·시간 초과·읽을 수 없는 답이면 null(길이만 본다). */
async function easeScore(clef: ClefClient, e: Explanation, signal?: AbortSignal): Promise<number | null> {
  const stage = new AbortController();
  const timer = setTimeout(() => stage.abort(), CLEF_CAP_MS);
  const combined = signal ? AbortSignal.any([signal, stage.signal]) : stage.signal;
  // 클라이언트가 signal 을 늦게 따르더라도 상한에서 끝낸다.
  const ended = new Promise<null>((resolve) => {
    if (combined.aborted) resolve(null);
    else combined.addEventListener("abort", () => resolve(null), { once: true });
  });
  try {
    const answers = await Promise.race([
      clef.decide(`설명: ${JSON.stringify(scoredText(e))}`, { q: EXPLAIN_SCORE_QUESTION }, combined, { capMs: CLEF_CAP_MS, maxRetries: 0 }),
      ended,
    ]);
    return answers ? scoreValue(answers.q) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    stage.abort();
  }
}

/** Qwen 응답 전체 글. 실패·시간 초과면 null. */
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

const kindKo = (kind: string) => NODE_KINDS.find((k) => k.kind === kind)?.labelKo ?? kind;

/** 사전 항목의 정의 부분. why·compare 는 비어 있지 않을 때만(용어 노드, §6.2). */
function glossaryPart(row: GlossaryRow, source: NodeExplanation["definitionSource"]) {
  return {
    term: row.term,
    definition: row.definition,
    definitionSource: source,
    reviewed: row.reviewed,
    ...(row.why ? { why: row.why } : {}),
    ...(row.compare ? { compare: row.compare } : {}),
  };
}

/**
 * 노드·연결 설명을 만든다(또는 캐시에서 돌려준다).
 * 1. 소유·대상 확인 2. 캐시 3. 사전 조회(노드) 4. Qwen JSON 생성(형식 오류는 1회 다시 요청)
 * 5. 길이·Clef 점수로 최대 2회 다시 쓰기 6. 사전 추가(AI 정의) 7. 저장.
 * 구성도 버전을 만들지 않고 대화 잠금도 잡지 않는다.
 */
export async function explainTarget(
  userId: string,
  diagramId: string,
  targetKind: ExplanationTargetKind,
  targetId: string,
  opts: { instruction?: string; force?: boolean; signal?: AbortSignal } = {},
  depsInput: DepsInput = {},
): Promise<ExplainResult> {
  let instruction: string | undefined;
  if (opts.instruction !== undefined) {
    // 사용자 글이 줄을 새로 만들지 못하게 공백을 한 칸으로 접는다.
    instruction = typeof opts.instruction === "string" ? opts.instruction.replace(/\s+/g, " ").trim() : "";
    const n = codePoints(instruction);
    if (n < 1 || n > INSTRUCTION_MAX) throw new ValidationError(`요청은 1~${INSTRUCTION_MAX}자로 입력해 주세요`);
  }
  const deps = resolveDeps(depsInput);
  const { repo } = deps;
  await repo.getOwnedDiagram(userId, diagramId);
  const state = (await repo.getLatestState(diagramId))?.state;
  const signature = state ? signatureOf(state, targetKind, targetId) : null;
  if (!state || !signature) throw new ValidationError(NOT_FOUND_MESSAGE);

  const cached = await repo.getCached(diagramId, targetKind, targetId);
  const fresh = cached && cached.signature === signature ? cached : null;
  if (fresh && !opts.force && !instruction) {
    return { ok: true, explanation: fresh.data as Explanation, signature };
  }

  // 노드: 사전 조회. ensureSeeded 를 먼저 해야 시드와 같은 용어를 AI 가 새로 넣지 않는다.
  let row: GlossaryRow | null = null;
  let candidate: { key: string; display: string } | undefined;
  const node = targetKind === "node" ? state.nodes[targetId]! : null;
  if (node) {
    await repo.ensureSeeded(userId);
    const candidates = termCandidates(node);
    candidate = candidates[0];
    row = await repo.findTerm(userId, candidates.map((c) => c.key));
  }

  const fail = (): ExplainResult =>
    row ? { ok: false, message: EXPLAIN_FAIL_MESSAGE, partial: glossaryPart(row, "glossary") } : { ok: false, message: EXPLAIN_FAIL_MESSAGE };

  const { qwen } = deps;
  if (!qwen) return fail();

  const base = { kind: targetKind, state, id: targetId, glossaryDefinition: row?.definition, instruction };
  const needDefinition = !!node && !row;

  /** 설명 모양으로 조립한다. AI 정의 노드의 용어는 사전에 넣기 전 후보 이름을 쓴다. */
  const assemble = (d: Draft, termRow: GlossaryRow | null, source: NodeExplanation["definitionSource"]): Explanation => {
    if (!node) return { kind: "edge", ...(d as EdgeDraft) };
    const nd = d as NodeDraft;
    const def = termRow
      ? glossaryPart(termRow, source)
      : { term: candidate?.display ?? node.label, definition: nd.definition ?? "", definitionSource: source, reviewed: false };
    return { kind: "node", ...def, role: nd.role, adr: nd.adr };
  };
  const source = row ? "glossary" : "ai";

  // 첫 생성: 형식이 틀리면 1회 다시 요청한다.
  const firstMessages = buildExplainMessages({ ...base, previous: instruction ? draftOf(fresh?.data) : undefined });
  let draft: Draft | null = null;
  for (let attempt = 0; attempt < 2 && !draft; attempt++) {
    const out = await complete(qwen, firstMessages, opts.signal);
    if (out === null) return fail();
    draft = parseDraft(out, targetKind, needDefinition);
  }
  if (!draft) return fail();

  // 품질: 길이 초과가 있으면 그것만, 없으면 Clef 점수를 본다. 최대 2회 다시 쓴다.
  for (let round = 0; round < MAX_REWRITES; round++) {
    const current = assemble(draft, row, source);
    const problems = lengthProblems(current);
    if (!problems.length) {
      const score = await easeScore(deps.clef, current, opts.signal);
      if (score !== null && score > SCORE_MAX) {
        problems.push(`비전공자가 읽기에 어렵거나 장황하다(난이도 ${score.toFixed(1)}/2). 전문용어를 풀어 쓰고 문장을 더 짧고 쉽게 쓸 것`);
      }
    }
    if (!problems.length) break;
    const out = await complete(qwen, buildExplainMessages({ ...base, previous: draft, problems }), opts.signal);
    const next = out === null ? null : parseDraft(out, targetKind, needDefinition);
    // 다시 쓰기가 실패하면 마지막 올바른 결과를 쓴다.
    if (!next) break;
    draft = next;
  }

  let finalRow = row;
  if (node && !row && candidate) {
    // AI 정의는 미검수로 사전에 넣는다. 같은 용어가 이미 있으면 그 항목을 쓴다.
    finalRow = await repo.addAiTerm(userId, {
      term: candidate.display,
      category: kindKo(node.kind),
      definition: (draft as NodeDraft).definition ?? "",
      why: "",
      compare: "",
    });
  }
  const explanation = assemble(draft, finalRow, source);
  await repo.saveExplanation({ diagramId, targetKind, targetId, signature, data: explanation, updatedAt: deps.now() });
  return { ok: true, explanation, signature };
}

/** 저장된 설명 서명. key 는 "node:<id>"/"edge:<id>". 남의 구성도는 NotFoundError. */
export async function listSignatures(
  userId: string,
  diagramId: string,
  depsInput: { repo?: Partial<ExplainRepo> } = {},
): Promise<Record<string, string>> {
  const repo = { ...dbRepo, ...depsInput.repo };
  await repo.getOwnedDiagram(userId, diagramId);
  const rows = await repo.listSignatures(diagramId);
  return Object.fromEntries(rows.map((r) => [`${r.targetKind}:${r.targetId}`, r.signature]));
}
