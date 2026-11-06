/**
 * 실제 Clef·Qwen 으로 의도 분류와 그 뒤 Qwen 명령을 점검한다. `npm run eval:intent`.
 * 대화 한 차례와 같은 순서로 돈다: 빠진 정보·참조 노드를 구해 Clef 로 분류 → 의도에 맞는 지시문 → Qwen 명령.
 * DB 를 쓰지 않고, npm test / CI 에 넣지 않는다. 키·주소는 출력하지 않는다.
 *
 *   --clef-only   Qwen 을 부르지 않고 의도 분류만 본다(빠름)
 *   --only a,b    이 id 의 문장만
 *   --update      이번 결과를 기준 파일(tests/fixtures/intent/baseline.json)로 저장
 *
 * 기준 파일이 있으면 그보다 나빠진 문장을 따로 보여 주고, 하나라도 있으면 실패(1)로 끝낸다.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { compareBaseline, judgeQwen, summarizeOps, type CaseResult, type QwenExpect, type SeenCommand } from "./eval-intent-lib";
import { formatTable } from "./smoke-table";

process.env.DATABASE_URL ||= "unused";
process.env.AUTH_SECRET ||= "unused";

const DIR = join(__dirname, "..", "tests", "fixtures", "intent");
const BASELINE = join(DIR, "baseline.json");
const DEFAULT_PREV = "구성도를 그렸어요.";
const QWEN_TIMEOUT_MS = 180_000;
const CLASSIFY_CAP_MS = 15_000; // 실제 대화는 3초. 점검에서는 느린 응답 때문에 판정이 비지 않게 넉넉히 둔다.

interface Case {
  id: string;
  text: string;
  want: string;
  lastAssistant?: string;
  qwen: QwenExpect;
}

const args = process.argv.slice(2);
const clefOnly = args.includes("--clef-only");
const update = args.includes("--update");
const onlyArg = args[args.indexOf("--only") + 1];
const only = args.includes("--only") && onlyArg ? new Set(onlyArg.split(",")) : null;

async function main(): Promise<number> {
  const { llmConfig } = await import("../src/server/llm/config");
  const { createClefClient } = await import("../src/server/llm/clef");
  const { createQwenClient } = await import("../src/server/llm/qwen");
  const { createJsonlParser } = await import("../src/server/llm/jsonl");
  const { resolveIntent } = await import("../src/server/chat/intent");
  const { buildMessages, parseMentions } = await import("../src/server/chat/prompt");
  const { normalizeAiCommand } = await import("../src/server/chat/normalize");
  const { parseCommand } = await import("../src/domain/commands");
  const { applyCommand } = await import("../src/domain/apply");
  const { emptyState } = await import("../src/domain/types");
  const { computeMissing } = await import("../src/domain/missing");
  type State = ReturnType<typeof emptyState>;

  const cfg = llmConfig();
  if (!cfg.clef) {
    console.log("Clef 설정 없음(CLEF_API_KEY) — 점검할 수 없어요.");
    return 1;
  }
  if (!clefOnly && !cfg.qwen) {
    console.log("Qwen 설정 없음 — --clef-only 로 의도만 볼 수 있어요.");
    return 1;
  }
  const clef = createClefClient(cfg.clef, { classifyCapMs: CLASSIFY_CAP_MS });
  const qwen = !clefOnly && cfg.qwen ? createQwenClient(cfg.qwen) : null;

  const fixture = JSON.parse(readFileSync(join(DIR, "diagram.json"), "utf8"));
  let state: State = emptyState();
  for (const raw of fixture.commands) {
    const p = parseCommand(raw);
    if (!p.ok) throw new Error(`점검 구성도 명령이 틀림: ${JSON.stringify(raw)} — ${p.error}`);
    const r = applyCommand(state, p.cmd);
    if (!r.ok) throw new Error(`점검 구성도 적용 실패: ${JSON.stringify(raw)} — ${r.error}`);
    state = r.state;
  }
  const flows = fixture.flows;
  const cases: Case[] = JSON.parse(readFileSync(join(DIR, "cases.json"), "utf8")).cases.filter((c: Case) => !only || only.has(c.id));

  // 파이프라인과 같은 방식으로 열린 빠진 정보를 만든다.
  const openMissing = computeMissing(state).items.filter((m) => !m.unknown);
  const nameOf = (id: string) => state.nodes[id]?.label ?? state.groups[id]?.label ?? id;
  const openItems = openMissing.map((m) => {
    if (m.targetKind === "node") return `${nameOf(m.targetId)} ${m.label}`;
    const e = state.edges[m.targetId];
    return e ? `${nameOf(e.from)} → ${nameOf(e.to)} ${m.label}` : `${m.targetId} ${m.label}`;
  });

  const results: CaseResult[] = [];
  const rows: string[][] = [];
  for (const c of cases) {
    const prev = c.lastAssistant ?? DEFAULT_PREV;
    const { clean, mentions } = parseMentions(c.text, state);
    let raw: { intent: string; confidence: number } | null = null;
    const routedIntent = await resolveIntent(c.text, async () => {
      raw = await clef.classifyIntent(clean, { lastAssistant: prev, openItems });
      return raw as Awaited<ReturnType<typeof clef.classifyIntent>>;
    });
    const got = raw as { intent: string; confidence: number } | null;
    const routed = routedIntent ?? "null";
    const intentOk = routed === c.want;

    let qwenOk: boolean | null = null;
    let qwenNote: string | undefined;
    let opsText = "-";
    if (qwen && c.qwen.expect !== "skip") {
      const answerMode = routed === "question" || routed === "other";
      if (routed === "layout" || routed === "history") {
        // 파이프라인은 이 두 의도에서 Qwen 을 부르지 않는다.
        qwenNote = c.qwen.expect === "none" ? undefined : `Qwen 을 부르지 않음(${routed})`;
        qwenOk = qwenNote === undefined;
        opsText = "부르지 않음";
      } else if (answerMode) {
        // 답만 하는 경로는 명령을 받지 않는다.
        qwenNote = c.qwen.expect === "none" || c.qwen.expect === "record" ? undefined : "답만 하는 경로로 감";
        qwenOk = qwenNote === undefined;
        opsText = "답만 함";
      } else {
        const seen: SeenCommand[] = [];
        let st = state;
        const parser = createJsonlParser(
          (v) => {
            if ((v as { op?: unknown } | null)?.op === "say") return;
            const p = parseCommand(normalizeAiCommand(v));
            if (!p.ok) return;
            const cmd = p.cmd as SeenCommand;
            seen.push({ op: cmd.op, id: cmd.id, payload: cmd.payload, direction: cmd.direction, attrs: cmd.attrs });
            const r = applyCommand(st, p.cmd);
            if (r.ok) st = r.state;
          },
          () => {},
        );
        const history = [{ role: "assistant" as const, content: prev }];
        const messages = buildMessages({ intent: routedIntent, text: clean, state, mentions, history, missing: openMissing, flows });
        try {
          await qwen.streamCompletion(messages, { signal: AbortSignal.timeout(QWEN_TIMEOUT_MS), onDelta: (d) => parser.push(d) });
          parser.end();
          qwenNote = judgeQwen(c.qwen, seen) ?? undefined;
          qwenOk = qwenNote === undefined;
          opsText = summarizeOps(seen);
        } catch (e) {
          qwenOk = false;
          qwenNote = `호출 실패: ${(e as Error).name}`;
          opsText = "-";
        }
      }
      if (c.qwen.expect === "record") qwenOk = null; // 기대 없이 기록만
    }

    results.push({ id: c.id, intent: got?.intent ?? null, confidence: got?.confidence ?? null, routed, intentOk, qwenOk, qwenNote });
    const mark = (ok: boolean | null) => (ok === null ? " " : ok ? "O" : "X");
    rows.push([
      c.id,
      mark(intentOk),
      `${got?.intent ?? "-"} ${got ? got.confidence.toFixed(2) : ""}`.trim(),
      c.want,
      mark(qwenOk),
      qwenNote ?? opsText,
    ]);
    process.stdout.write(".");
  }
  process.stdout.write("\n\n");
  console.log(formatTable(["문장", "의도", "Clef 판정", "기대", "Qwen", "Qwen 결과"], rows));

  const n = (xs: (boolean | null)[]) => `${xs.filter((x) => x === true).length}/${xs.filter((x) => x !== null).length}`;
  console.log(`\n의도 ${n(results.map((r) => r.intentOk))}${qwen ? ` · Qwen ${n(results.map((r) => r.qwenOk))}` : ""}`);

  let code = 0;
  if (existsSync(BASELINE)) {
    const base: CaseResult[] = JSON.parse(readFileSync(BASELINE, "utf8")).results;
    const { worse, better } = compareBaseline(base, results);
    const show = (title: string, xs: typeof worse) => {
      if (!xs.length) return;
      console.log(`\n${title}`);
      for (const x of xs) console.log(`  ${x.id} [${x.what}] ${x.from} → ${x.to}`);
    };
    show("기준보다 나빠짐", worse);
    show("기준보다 나아짐", better);
    if (!worse.length && !better.length) console.log("\n기준과 같아요.");
    if (worse.length) code = 1;
  } else if (!update) {
    console.log("\n기준 파일이 없어요. --update 로 지금 결과를 기준으로 저장할 수 있어요.");
  }

  if (update) {
    if (only || clefOnly) {
      console.log("\n--only·--clef-only 결과는 기준으로 저장하지 않아요(전체를 돌려야 해요).");
    } else {
      writeFileSync(BASELINE, JSON.stringify({ savedAt: new Date().toISOString().slice(0, 10), results }, null, 2) + "\n");
      console.log(`\n기준 파일을 저장했어요: tests/fixtures/intent/baseline.json`);
    }
  }
  return code;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
