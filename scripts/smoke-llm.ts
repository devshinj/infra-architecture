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
  const { parseCommand } = await import("../src/domain/commands");
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
      const t0 = Date.now();
      const parser = createJsonlParser(
        (v) => {
          if ((v as { op?: unknown } | null)?.op === "say") return; // 진행 안내 줄은 명령이 아니다
          const p = parseCommand(v);
          if (!p.ok) return void skipped++;
          if (firstMs === null) firstMs = Date.now() - t0;
          const r = applyCommand(state, p.cmd);
          if (r.ok) {
            state = r.state;
            applied++;
          } else skipped++;
        },
        () => void bad++,
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
    console.log(`정답률: ${accuracy(oks)}`);
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
