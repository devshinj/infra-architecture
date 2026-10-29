/**
 * 실제 AI 서버 점검. `npm run smoke:llm` (.env 의 실제 키 사용).
 * DB 를 쓰지 않고, npm test / CI 에 포함하지 않는다. 키·주소·헤더는 출력하지 않는다.
 */
import spike from "../docs/superpowers/spike/spike-results.json";
import { accuracy, formatTable } from "./smoke-table";

// 앱 env 모듈이 import 시점에 DB·인증 값을 요구하므로, 이 스크립트에서는 자리표시자를 둔다.
process.env.DATABASE_URL ||= "unused";
process.env.AUTH_SECRET ||= "unused";

const INTENTS: [string, string][] = [
  ["DB를 하나 더 추가해서 이중화 해줘", "structure_change"],
  ["L4랑 L7 차이가 뭐야?", "question"],
  ["WAS 두 대 다 4코어 16기가야", "missing_info_answer"],
  ["아까 Redis 넣기 전으로 돌려줘", "history"],
  ["10.0.2.11, 10.0.2.12", "missing_info_answer"],
  ["이 구성에서 단일 장애점이 어디야?", "question"],
  ["카카오 로그인 연동 빼줘", "structure_change"],
  ["고마워", "other"],
];

const sec = (ms: number) => (ms / 1000).toFixed(1) + "s";

async function main(): Promise<number> {
  const { llmConfig } = await import("../src/server/llm/config");
  const { checkLlmHealth } = await import("../src/server/llm/health");
  const { createQwenClient } = await import("../src/server/llm/qwen");
  const { createClefClient } = await import("../src/server/llm/clef");
  const { createJsonlParser } = await import("../src/server/llm/jsonl");
  const { buildMessages } = await import("../src/server/chat/prompt");
  const { normalizeAiCommand } = await import("../src/server/chat/normalize");
  const { createSkipTally, skipKey } = await import("../src/server/chat/skips");
  const { parseCommand, COMMAND_OPS } = await import("../src/domain/commands");
  const KNOWN_OPS: ReadonlySet<string> = new Set(COMMAND_OPS);
  const { applyCommand } = await import("../src/domain/apply");
  const { emptyState } = await import("../src/domain/types");

  const cfg = llmConfig();
  let failed = false;

  // (1) 상태 확인
  const health = await checkLlmHealth({ config: cfg });
  console.log("== 1. 상태 확인 ==");
  console.log(formatTable(["서버", "상태"], [["Qwen", health.qwen], ["Clef", health.clef]]));

  // (2) 구조 생성
  console.log("\n== 2. 구조 생성 ==");
  const rows: string[][] = [];
  const reasons: { id: string; tally: ReturnType<typeof createSkipTally> }[] = [];
  if (!cfg.qwen) {
    console.log("Qwen 설정 없음(QWEN_CODER_KEY / QWEN_API_URL) - 건너뜀");
    failed = true;
  } else {
    console.log(`모델: ${cfg.qwen.model}`);
    const qwen = createQwenClient(cfg.qwen);
    for (const id of ["s1", "s2"]) {
      const sc = (spike.scenarios as { id: string; prompt: string }[]).find((s) => s.id === id)!;
      let state = emptyState();
      let applied = 0;
      let skipped = 0;
      let bad = 0;
      let firstMs: number | null = null;
      const tally = createSkipTally();
      reasons.push({ id, tally });
      const t0 = Date.now();
      const parser = createJsonlParser(
        (v) => {
          const rawOp = (v as { op?: unknown } | null)?.op;
          if (rawOp === "say") return; // 진행 안내 줄은 명령이 아니다
          const op = typeof rawOp === "string" ? rawOp.slice(0, 40) : "?";
          const p = parseCommand(normalizeAiCommand(v)); // 대화 경로와 같은 정규화
          if (!p.ok && !KNOWN_OPS.has(op)) {
            // 파이프라인과 같은 라벨: 허용 밖 op 는 invalid 가 아니라 unknown_op
            tally.add(skipKey("unknown_op", op), JSON.stringify(v));
            return void skipped++;
          }
          if (!p.ok) {
            tally.add(skipKey("invalid", op, p.error), JSON.stringify(v));
            return void skipped++;
          }
          if (firstMs === null) firstMs = Date.now() - t0;
          const r = applyCommand(state, p.cmd);
          if (r.ok) {
            state = r.state;
            applied++;
          } else {
            tally.add(skipKey("apply", op, r.error), JSON.stringify(v));
            skipped++;
          }
        },
        (text) => {
          tally.add(skipKey("bad_json"), text);
          bad++;
        },
      );
      const messages = buildMessages({ intent: "structure_change", text: sc.prompt, state, mentions: [], history: [] });
      try {
        const res = await qwen.streamCompletion(messages, {
          signal: AbortSignal.timeout(180_000),
          onDelta: (d) => parser.push(d),
        });
        parser.end();
        rows.push([
          id,
          firstMs === null ? "-" : sec(firstMs),
          sec(Date.now() - t0),
          String(applied),
          String(skipped),
          String(bad),
          String(Object.keys(state.nodes).length),
          String(Object.keys(state.edges).length),
          res.finishReason ?? "-",
        ]);
      } catch (e) {
        failed = true;
        const status = (e as { status?: number }).status;
        rows.push([id, "-", sec(Date.now() - t0), "0", "0", "0", "0", "0", `오류${status ? ` ${status}` : ""}: ${(e as Error).name}`]);
      }
    }
    console.log(
      formatTable(["시나리오", "첫 명령", "전체", "적용", "건너뜀", "깨진 줄", "노드", "연결", "종료"], rows),
    );
    // 건너뜀·깨진 줄의 이유별 개수와 표본(모델 출력, 최대 3줄·120자).
    for (const { id, tally } of reasons) {
      if (tally.total() === 0) continue;
      console.log(`\n[${id}] 건너뜀 이유`);
      const counts = Object.entries(tally.counts()).sort((a, b) => b[1] - a[1]);
      console.log(formatTable(["이유", "개수"], counts.map(([k, n]) => [k, String(n)])));
      for (const line of tally.samples()) console.log(`  예: ${line}`);
    }
  }

  // (3) 의도 분류
  console.log("\n== 3. Clef 의도 분류 ==");
  if (!cfg.clef) {
    console.log("Clef 설정 없음(CLEF_API_KEY) - 건너뜀");
    failed = true;
  } else {
    const clef = createClefClient(cfg.clef);
    const irows: string[][] = [];
    const oks: boolean[] = [];
    for (const [text, expect] of INTENTS) {
      const t0 = Date.now();
      const r = await clef.classifyIntent(text, {});
      const ok = r?.intent === expect;
      oks.push(ok);
      irows.push([text, expect, r ? r.intent : "(실패)", r ? r.confidence.toFixed(2) : "-", sec(Date.now() - t0), ok ? "O" : "X"]);
    }
    console.log(formatTable(["문장", "기대", "결과", "신뢰도", "시간", "일치"], irows));
    console.log(`문맥 없음 ${accuracy(oks)}`);

    // 문맥 있는 분류: 스파이크에서 실패했던 값만 알려 주는 답 2건.
    const ctx = {
      lastAssistant: "WAS#1·WAS#2 의 CPU·RAM·IP 를 알려 주세요.",
      openItems: ["WAS#1 CPU", "WAS#1 RAM", "WAS#1 IP", "WAS#2 CPU", "WAS#2 RAM", "WAS#2 IP"],
    };
    const crows: string[][] = [];
    const coks: boolean[] = [];
    for (const text of ["WAS 두 대 다 4코어 16기가야", "10.0.2.11, 10.0.2.12"]) {
      const t0 = Date.now();
      const r = await clef.classifyIntent(text, ctx);
      const ok = r?.intent === "missing_info_answer";
      coks.push(ok);
      crows.push([text, "missing_info_answer", r ? r.intent : "(실패)", r ? r.confidence.toFixed(2) : "-", sec(Date.now() - t0), ok ? "O" : "X"]);
    }
    console.log(formatTable(["문장(문맥 있음)", "기대", "결과", "신뢰도", "시간", "일치"], crows));
    console.log(`문맥 있음 ${accuracy(coks)}`);
  }

  if (health.qwen !== "ok" || health.clef !== "ok") failed = true;
  return failed ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (e) => {
    // 메시지에 주소·키가 섞일 수 있어 이름만 출력한다.
    console.error(`점검 실패: ${(e as Error).name}`);
    process.exit(1);
  },
);
