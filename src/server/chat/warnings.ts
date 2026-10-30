import type { DiagramState, DNode, Warning, WarningLevel } from "@/domain/types";
import { DATA_KINDS, evaluateRules, RULES } from "@/domain/warnings";
import type { ClefClient } from "@/server/llm/clef";
import { noulProbability } from "@/server/llm/clef";
import { createJsonlParser } from "@/server/llm/jsonl";
import type { QwenClient } from "@/server/llm/qwen";

import { buildWarningMessages } from "./prompt";

const CLEF_LIMIT = 5;
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

/** Clef db_exposed 판정. 실패한 판정은 건너뛴다(코드 규칙만 남는다). */
async function judgeExposed(state: DiagramState, flagged: Set<string>, clef: ClefClient, signal: AbortSignal, limit: number): Promise<Warning[]> {
  const targets = Object.values(state.nodes)
    .filter((n) => DATA_KINDS.includes(n.kind) && !flagged.has(n.id))
    .slice(0, limit);
  const question = { q: { type: "noul", instructions: EXPOSED.instructions } };
  // 동시성 제한·재시도는 clef 클라이언트가 맡는다.
  const results = await Promise.allSettled(targets.map((n) => clef.decide(describeTarget(state, n), question, signal)));
  const out: Warning[] = [];
  results.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const level = levelOf(noulProbability(r.value?.q));
    if (!level) return;
    const node = targets[i]!;
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
      if (t === "" || /[\r\n]/.test(t) || Array.from(t).length > TEXT_MAX) return;
      out.set(id, t);
    },
    () => {},
  );
  // 클라이언트가 abort 를 늦게 따르더라도 시간 제한에서 끝낸다.
  const stopped = new Promise<never>((_resolve, reject) => {
    const onAbort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
    if (combined.aborted) onAbort();
    else combined.addEventListener("abort", onAbort, { once: true });
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
  }
  return out;
}

/**
 * 대화 차례 끝의 경고 점검: 코드 규칙 + Clef db_exposed 판정, 새 경고만 Qwen 문구.
 * prev 에 있던 id 는 그 문구를 다시 쓴다. AI 단계가 실패해도 throw 하지 않는다.
 */
export async function checkWarnings(
  state: DiagramState,
  prev: Warning[] | undefined,
  deps: { clef: ClefClient; qwen: QwenClient | null },
  signal: AbortSignal,
  opts: { clefLimit?: number; textTimeoutMs?: number } = {},
): Promise<{ warnings: Warning[]; fresh: Warning[] }> {
  const prevText = new Map((prev ?? []).map((w) => [w.id, w.text]));
  const code = evaluateRules(state);
  let warnings = code;

  if (!signal.aborted) {
    const flagged = new Set(code.filter((w) => w.rule === "db_public").map((w) => w.nodeId));
    let exposed: Warning[] = [];
    try {
      exposed = await judgeExposed(state, flagged, deps.clef, signal, opts.clefLimit ?? CLEF_LIMIT);
    } catch {
      exposed = [];
    }
    // 판정 도중 중단되면 코드 규칙만 쓴다.
    if (!signal.aborted) warnings = [...code, ...exposed.filter((w) => !code.some((c) => c.id === w.id))];
  }

  warnings = warnings.map((w) => {
    const t = prevText.get(w.id);
    return typeof t === "string" ? { ...w, text: t } : w;
  });

  const isNew = (w: Warning) => !prevText.has(w.id);
  const needText = warnings.filter(isNew);
  if (deps.qwen && needText.length && !signal.aborted) {
    const items = needText.map((w) => ({ id: w.id, rule: w.rule, facts: `${w.text} | ${describeTarget(state, state.nodes[w.nodeId]!)}` }));
    const texts = await writeTexts(deps.qwen, items, signal, opts.textTimeoutMs ?? TEXT_TIMEOUT_MS);
    warnings = warnings.map((w) => {
      const t = texts.get(w.id);
      return t ? { ...w, text: t } : w;
    });
  }

  const ignored = new Set(state.ignoredWarnings ?? []);
  return { warnings, fresh: warnings.filter((w) => isNew(w) && !ignored.has(w.id)) };
}
