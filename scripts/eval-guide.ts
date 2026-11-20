/**
 * 실제 Clef 로 학습 모드 단계 판정을 점검한다. `npm run eval:guide`.
 * 학습자 말 한 줄을 현재 단계에 대해 askClef 로 묻고(match·question 확률), decideStep 으로 match/miss/question/conflict 를 정한다.
 * DB 를 쓰지 않고, npm test / CI 에 넣지 않는다. 키·주소는 출력하지 않는다.
 *
 *   --only a,b      이 id 의 문장만
 *   --repeat N      문장마다 N 번 묻는다(기본 1). 모두 기대와 같아야 맞음
 *   --threshold X   GUIDE_MIN_CONFIDENCE 대신 이 기준으로 판정(기준 바꿔 보기)
 *   --update        이번 결과를 기준 파일(tests/fixtures/guide/baseline.json)로 저장. 나빠진 문장이 있거나 --repeat 가 3 보다 작으면 거부
 *   --force         나빠진 문장이 있어도 --update 로 저장(--repeat 3 이상은 여전히 필요)
 *
 * 기준 파일이 있으면 그보다 나빠진 문장을 따로 보여 주고, 하나라도 있으면 실패(1)로 끝낸다.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { formatTable } from "./smoke-table";

process.env.DATABASE_URL ||= "unused";
process.env.AUTH_SECRET ||= "unused";

const DIR = join(__dirname, "..", "tests", "fixtures", "guide");
const BASELINE = join(DIR, "baseline.json");

type Kind = "match" | "miss" | "question" | "conflict";
interface Case {
  id: string;
  guide: string;
  env: "onprem" | "cloud";
  step: string;
  text: string;
  expect: Kind;
}
interface Result {
  id: string;
  expect: Kind;
  got: Kind;
  ok: boolean;
  passes: number;
  runs: number;
  match: number | null;
  question: number | null;
}

const args = process.argv.slice(2);
const update = args.includes("--update");
const force = args.includes("--force");
const valueOf = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const only = valueOf("--only") ? new Set(valueOf("--only")!.split(",")) : null;
const repeat = Math.max(1, Number(valueOf("--repeat")) || 1);
const thresholdArg = valueOf("--threshold");

async function main(): Promise<number> {
  const { llmConfig } = await import("../src/server/llm/config");
  const { createClefClient } = await import("../src/server/llm/clef");
  const { askClef } = await import("../src/server/guide/judge");
  const { decideStep, findConflict } = await import("../src/domain/guides/judge");
  const { getGuide } = await import("../src/domain/guides");
  const { GUIDE_MIN_CONFIDENCE } = await import("../src/domain/guides/types");

  const threshold = thresholdArg !== undefined && Number.isFinite(Number(thresholdArg)) ? Number(thresholdArg) : GUIDE_MIN_CONFIDENCE;
  const cfg = llmConfig();
  if (!cfg.clef) {
    console.log("Clef 설정 없음(CLEF_API_KEY) — 점검할 수 없어요.");
    return 1;
  }
  const clef = createClefClient(cfg.clef);
  // cases.json(쇼핑몰)과 주제별 cases-<주제>.json 을 모두 읽는다.
  const cases: Case[] = readdirSync(DIR)
    .filter((f) => /^cases(-[a-z]+)?\.json$/.test(f))
    .sort()
    .flatMap((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")).cases as Case[])
    .filter((c) => !only || only.has(c.id));

  const results: Result[] = [];
  const rows: string[][] = [];
  let clefFailures = 0;
  for (const c of cases) {
    const variant = getGuide(c.guide)?.variants[c.env];
    const step = variant?.steps.find((s) => s.id === c.step);
    if (!step) throw new Error(`대본에 없는 단계: ${c.id} (${c.guide}/${c.env}/${c.step})`);
    const verdicts: Kind[] = [];
    let lastMatch: number | null = null;
    let lastQuestion: number | null = null;
    for (let i = 0; i < repeat; i++) {
      // 대화 차례(turn.ts)처럼 conflict 가 잡히면 Clef 를 부르지 않는다.
      const hasConflict = findConflict(c.text, step) !== null;
      const p = hasConflict ? { match: null, question: null } : await askClef(clef, c.text, step.goal, AbortSignal.timeout(15_000));
      if (p.match === null && !hasConflict) clefFailures++;
      lastMatch = p.match;
      lastQuestion = p.question;
      verdicts.push(decideStep(c.text, step, p, threshold).kind);
    }
    const passes = verdicts.filter((v) => v === c.expect).length;
    const ok = passes === repeat;
    const got = verdicts.find((v) => v !== c.expect) ?? verdicts[0]!;
    results.push({ id: c.id, expect: c.expect, got, ok, passes, runs: repeat, match: lastMatch, question: lastQuestion });
    const f = (x: number | null) => (x === null ? "-" : x.toFixed(2));
    rows.push([c.id, ok ? "O" : "X", c.expect, repeat > 1 ? `${got} ${passes}/${repeat}` : got, f(lastMatch), f(lastQuestion), c.text]);
    process.stdout.write(".");
  }
  process.stdout.write("\n\n");
  console.log(formatTable(["id", "", "기대", "판정", "match", "question", "문장"], rows));

  const pct = (xs: Result[]) => `${xs.filter((r) => r.ok).length}/${xs.length}`;
  console.log(`\n기준 ${threshold} · 전체 ${pct(results)}`);
  for (const kind of ["match", "miss", "question", "conflict"] as Kind[]) {
    const xs = results.filter((r) => r.expect === kind);
    if (xs.length) console.log(`  ${kind} ${pct(xs)}`);
  }
  if (repeat > 1) {
    const total = results.reduce((t, r) => t + r.runs, 0);
    console.log(`실행 ${results.reduce((t, r) => t + r.passes, 0)}/${total} 통과 (문장마다 ${repeat}번)`);
  }
  if (clefFailures) console.log(`Clef 응답 없음 ${clefFailures}번(키워드 판정으로 넘어감)`);
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.log("\n틀린 문장");
    for (const r of failed) console.log(`  ${r.id} 기대 ${r.expect} → ${r.got} (match ${r.match?.toFixed(2) ?? "-"}, question ${r.question?.toFixed(2) ?? "-"})`);
  }

  let code = 0;
  let worseCount = 0;
  if (existsSync(BASELINE)) {
    const base = new Map((JSON.parse(readFileSync(BASELINE, "utf8")).results as Result[]).map((r) => [r.id, r]));
    const worse = results.filter((r) => base.get(r.id)?.ok && !r.ok);
    worseCount = worse.length;
    const fresh = results.filter((r) => !base.has(r.id));
    if (fresh.length) {
      console.log(`\n기준 없음 ${fresh.length}건`);
      for (const r of fresh) console.log(`  ${r.id} ${r.ok ? "O" : "X"} 기대 ${r.expect} → ${r.got}`);
    }
    const better = results.filter((r) => base.get(r.id) && !base.get(r.id)!.ok && r.ok);
    const show = (title: string, xs: Result[]) => {
      if (!xs.length) return;
      console.log(`\n${title}`);
      for (const r of xs) console.log(`  ${r.id} ${base.get(r.id)!.got} → ${r.got}`);
    };
    show("기준보다 나빠짐", worse);
    show("기준보다 나아짐", better);
    if (!worse.length && !better.length) console.log("\n기준과 같아요.");
    if (worse.length) code = 1;
  } else if (!update) {
    console.log("\n기준 파일이 없어요. --update 로 지금 결과를 기준으로 저장할 수 있어요.");
  }

  if (update) {
    if (repeat < 3) {
      console.log("\n--repeat 가 3 보다 작아 기준으로 저장하지 않아요(흔들림이 기준에 섞여요). --repeat 3 이상으로 돌리세요.");
    } else if (worseCount > 0 && !force) {
      console.log(`\n기준보다 나빠진 문장이 ${worseCount}건 있어 저장하지 않아요. 의도한 것이면 --force 를 같이 주세요.`);
    } else if (only || thresholdArg !== undefined) {
      console.log("\n--only·--threshold 결과는 기준으로 저장하지 않아요(전체를 기본 기준으로 돌려야 해요).");
    } else {
      writeFileSync(BASELINE, JSON.stringify({ savedAt: new Date().toISOString().slice(0, 10), results }, null, 2) + "\n");
      console.log("\n기준 파일을 저장했어요: tests/fixtures/guide/baseline.json");
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
