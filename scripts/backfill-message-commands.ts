/**
 * 명령을 저장하기 전에 만든 AI 답에 meta.commands 를 채운다(버전 차이로 되살림). `npm run backfill:commands [-- --apply]`.
 * 대화 기록 재생이 "그 차례에 실제로 낸 명령"을 보여 주게 해, 옛 대화에서도 모델이 일반 글로만 답하지 않게 한다.
 * 기본은 미리보기(쓰지 않음). --apply 를 주면 쓴다. 이미 commands 가 있는 메시지는 건드리지 않아 여러 번 돌려도 같다.
 * 메시지 글·명령 내용은 출력하지 않는다(개수만).
 */
import { and, asc, eq, sql } from "drizzle-orm";

async function main(): Promise<number> {
  const apply = process.argv.includes("--apply");
  const { db } = await import("../src/db/client");
  const { diagramVersions, messages } = await import("../src/db/schema");
  const { planCommandBackfill } = await import("../src/server/chat/backfill");

  const rows = await db
    .select({ id: messages.id, diagramId: messages.diagramId, meta: messages.meta })
    .from(messages)
    .where(and(eq(messages.role, "assistant"), sql`not (${messages.meta} ? 'commands')`))
    .orderBy(asc(messages.diagramId));

  const counts = { filled: 0, failedTurn: 0, skipped: 0 };
  let commandsTotal = 0;
  const versionsCache = new Map<string, Map<number, import("../src/domain/types").DiagramState>>();
  for (const row of rows) {
    let versions = versionsCache.get(row.diagramId);
    if (!versions) {
      const vs = await db
        .select({ number: diagramVersions.number, state: diagramVersions.state })
        .from(diagramVersions)
        .where(eq(diagramVersions.diagramId, row.diagramId));
      versions = new Map(vs.map((v) => [v.number, v.state]));
      versionsCache.set(row.diagramId, versions);
    }
    const commands = planCommandBackfill(row.meta, versions);
    if (commands === null) {
      counts.skipped++;
      continue;
    }
    if (commands.length === 0) counts.failedTurn++;
    else counts.filled++;
    commandsTotal += commands.length;
    if (apply) {
      await db
        .update(messages)
        .set({ meta: sql`${messages.meta} || ${JSON.stringify({ commands })}::jsonb` })
        .where(eq(messages.id, row.id));
    }
  }
  console.log(`${apply ? "적용" : "미리보기(--apply 로 적용)"}: 대상 AI 답 ${rows.length}개`);
  console.log(`  명령을 채움 ${counts.filled}개(명령 ${commandsTotal}개), 실패한 차례로 표시 ${counts.failedTurn}개, 그대로 둠 ${counts.skipped}개`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error("backfill failed", err instanceof Error ? err.message : err);
    process.exit(1);
  });
