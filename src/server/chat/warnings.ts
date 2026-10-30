import type { DiagramState, DNode, Warning, WarningLevel } from "@/domain/types";
import { DATA_KINDS, evaluateRules, RULES } from "@/domain/warnings";
import type { ClefClient } from "@/server/llm/clef";
import { noulProbability } from "@/server/llm/clef";
import { createJsonlParser } from "@/server/llm/jsonl";
import type { QwenClient } from "@/server/llm/qwen";

import { buildWarningMessages } from "./prompt";

const CLEF_LIMIT = 5;
// Clef 단계 전체(대기열 대기 포함)의 상한. 재시도는 하지 않는다. 다음 차례의 의도 분류가 밀리지 않게 한다.
const CLEF_CAP_MS = 3000;
const TEXT_TIMEOUT_MS = 8000;
const TEXT_MAX = 80;
const WARN_AT = 0.8;
const CHECK_AT = 0.5;

const EXPOSED = RULES.find((r) => r.rule === "db_exposed")!;

/**
 * 대상 노드와 이웃(조상 그룹·연결 상대)을 요약한 줄들.
 * 사용자 글(라벨·연결 이름)은 JSON.stringify 로 감싸 줄을 위조하지 못하게 한다. id 는 형식 검사를 거친 값이다.
 */
export function describeTarget(state: DiagramState, node: DNode): string {
  const lines = [`대상 노드 ${node.id} [${node.kind}] ${JSON.stringify(node.label)} sub=${JSON.stringify(node.sub ?? "")}`];
  const ancestors: string[] = [];
  const seen = new Set<string>();
  for (let cur = node.parent; cur && !seen.has(cur); ) {
    seen.add(cur);
    const g = state.groups[cur];
    if (!g) break;
    ancestors.push(`${g.id} [${g.groupKind}] ${JSON.stringify(g.label)}`);
    cur = g.parent;
  }
  lines.push(`상위 영역: ${ancestors.length ? ancestors.join(" < ") : "없음(최상위)"}`);
  const touches = new Set([node.id, ...seen]);
  const describe = (id: string) => {
    const n = state.nodes[id];
    if (n) return `노드 ${n.id} [${n.kind}] ${JSON.stringify(n.label)}`;
    const g = state.groups[id];
    return g ? `영역 ${g.id} [${g.groupKind}] ${JSON.stringify(g.label)}` : id;
  };
  for (const e of Object.values(state.edges)) {
    const how = `[${e.edgeKind}] ${JSON.stringify(e.label ?? "")}`;
    if (touches.has(e.to) && !touches.has(e.from)) lines.push(`들어오는 연결 ${how}: ${describe(e.from)} -> ${e.to}`);
    else if (touches.has(e.from) && !touches.has(e.to)) lines.push(`나가는 연결 ${how}: ${e.from} -> ${describe(e.to)}`);
  }
  return lines.join("\n");
}

function levelOf(p: number | null): WarningLevel | null {
  if (p === null) return null;
  if (p >= WARN_AT) return "warn";
  if (p >= CHECK_AT) return "check";
  return null;
}

/**
 * Clef db_exposed 판정. 단계 전체가 capMs 안에 끝나고, 그때까지 끝난 판정만 쓴다.
 * 판정이 실패·시간 초과·읽을 수 없는 답이면 prev 의 같은 경고를 그대로 이어 간다(사라지거나 새 경고로 다시 알리지 않게).
 */
async function judgeExposed(
  state: DiagramState,
  flagged: Set<string>,
  prev: Map<string, Warning>,
  clef: ClefClient,
  signal: AbortSignal,
  limit: number,
  capMs: number,
): Promise<Warning[]> {
  const targets = Object.values(state.nodes)
    .filter((n) => DATA_KINDS.includes(n.kind) && !flagged.has(n.id))
    .slice(0, limit);
  if (!targets.length) return [];
  const question = { q: { type: "noul", instructions: EXPOSED.instructions } };
  // 바깥 signal 은 건드리지 않고 이 단계만 끝낸다(Qwen 단계는 이어서 돈다).
  const stage = new AbortController();
  const handle = setTimeout(() => stage.abort(), capMs);
  const combined = AbortSignal.any([signal, stage.signal]);
  const ended = new Promise<never>((_resolve, reject) => {
    const onAbort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
    if (combined.aborted) onAbort();
    else combined.addEventListener("abort", onAbort, { once: true });
  });
  ended.catch(() => {});
  const started = Date.now();
  let results: PromiseSettledResult<Awaited<ReturnType<ClefClient["decide"]>>>[];
  try {
    // 동시성 제한은 clef 클라이언트가 맡는다. 클라이언트가 signal 을 늦게 따르더라도 상한에서 끝낸다.
    results = await Promise.allSettled(
      targets.map((n) =>
        Promise.race([
          clef.decide(describeTarget(state, n), question, combined, { capMs: Math.max(1, capMs - (Date.now() - started)), maxRetries: 0 }),
          ended,
        ]),
      ),
    );
  } finally {
    clearTimeout(handle);
    stage.abort(); // 남은 리스너·요청 정리
  }
  const out: Warning[] = [];
  results.forEach((r, i) => {
    const node = targets[i]!;
    const p = r.status === "fulfilled" ? noulProbability(r.value?.q) : null;
    if (p === null) {
      const kept = prev.get(`${EXPOSED.rule}:${node.id}`);
      if (kept) out.push(kept);
      return;
    }
    const level = levelOf(p);
    if (!level) return;
    out.push({
      id: `${EXPOSED.rule}:${node.id}`,
      rule: EXPOSED.rule,
      nodeId: node.id,
      level,
      text: EXPOSED.template(state, { node }),
      guide: EXPOSED.guide,
    });
  });
  return out;
}

/** 새 경고 문구를 한 번의 Qwen 호출로 받는다. 시간 초과·실패면 그때까지 받은 올바른 줄만 쓴다. */
async function writeTexts(
  qwen: QwenClient,
  items: { id: string; rule: string; facts: string }[],
  signal: AbortSignal,
  timeoutMs: number,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const wanted = new Set(items.map((i) => i.id));
  const timer = new AbortController();
  const handle = setTimeout(() => timer.abort(), timeoutMs);
  const combined = AbortSignal.any([signal, timer.signal]);
  const parser = createJsonlParser(
    (v) => {
      if (combined.aborted || !v || typeof v !== "object") return;
      const { id, text } = v as { id?: unknown; text?: unknown };
      if (typeof id !== "string" || !wanted.has(id) || out.has(id) || typeof text !== "string") return;
      const t = text.trim();
      if (t === "" || /[\p{Cc}\u2028\u2029]/u.test(t) || Array.from(t).length > TEXT_MAX) return;
      out.set(id, t);
    },
    () => {},
  );
  // 클라이언트가 abort 를 늦게 따르더라도 시간 제한에서 끝낸다.
  let detach = () => {};
  const stopped = new Promise<never>((_resolve, reject) => {
    const onAbort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
    if (combined.aborted) return onAbort();
    combined.addEventListener("abort", onAbort, { once: true });
    detach = () => combined.removeEventListener("abort", onAbort);
  });
  try {
    await Promise.race([
      qwen.streamCompletion(buildWarningMessages(items), {
        signal: combined,
        onDelta(delta) {
          if (!combined.aborted) parser.push(delta);
        },
      }),
      stopped,
    ]);
    if (!combined.aborted) parser.end();
  } catch {
    // 실패·시간 초과: 받지 못한 경고는 정해진 문구(template)를 쓴다.
  } finally {
    clearTimeout(handle);
    detach();
  }
  return out;
}

/**
 * 대화 차례 끝의 경고 점검: 코드 규칙 + Clef db_exposed 판정, 새 경고만 Qwen 문구.
 * prev 에 있던 id 는 그 문구를 다시 쓴다. Clef 단계는 clefCapMs(3초) 안에 끝나고 재시도하지 않는다.
 * AI 단계가 실패해도 throw 하지 않는다.
 */
export async function checkWarnings(
  state: DiagramState,
  prev: Warning[] | undefined,
  deps: { clef: ClefClient; qwen: QwenClient | null },
  signal: AbortSignal,
  opts: { clefLimit?: number; textTimeoutMs?: number; clefCapMs?: number } = {},
): Promise<{ warnings: Warning[]; fresh: Warning[] }> {
  const prevById = new Map((prev ?? []).map((w) => [w.id, w]));
  const code = evaluateRules(state);
  let warnings = code;

  if (!signal.aborted) {
    const flagged = new Set(code.filter((w) => w.rule === "db_public").map((w) => w.nodeId));
    let exposed: Warning[] = [];
    try {
      exposed = await judgeExposed(state, flagged, prevById, deps.clef, signal, opts.clefLimit ?? CLEF_LIMIT, opts.clefCapMs ?? CLEF_CAP_MS);
    } catch {
      exposed = [];
    }
    // 판정 도중 중단되면 코드 규칙만 쓴다.
    if (!signal.aborted) warnings = [...code, ...exposed.filter((w) => !code.some((c) => c.id === w.id))];
  }

  warnings = warnings.map((w) => {
    const t = prevById.get(w.id)?.text;
    return typeof t === "string" ? { ...w, text: t } : w;
  });

  const isNew = (w: Warning) => !prevById.has(w.id);
  const needText = warnings.filter(isNew);
  if (deps.qwen && needText.length && !signal.aborted) {
    const items = needText.map((w) => ({ id: w.id, rule: w.rule, facts: `정해진 문구 ${JSON.stringify(w.text)} | ${describeTarget(state, state.nodes[w.nodeId]!)}` }));
    const texts = await writeTexts(deps.qwen, items, signal, opts.textTimeoutMs ?? TEXT_TIMEOUT_MS);
    warnings = warnings.map((w) => {
      const t = texts.get(w.id);
      return t ? { ...w, text: t } : w;
    });
  }

  const ignored = new Set(state.ignoredWarnings ?? []);
  return { warnings, fresh: warnings.filter((w) => isNew(w) && !ignored.has(w.id)) };
}
