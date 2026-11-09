# Claude Code 연동(MCP 서버) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude Code가 계정 키로 `/api/mcp`에 붙어 InfraSketch 구성도를 만들고, 읽고, 대화 기능과 같은 명령·규칙으로 고치게 한다. 열어 둔 브라우저는 몇 초 안에 그 변경을 보여 준다.

**Architecture:** 그리기 규칙을 Qwen 프롬프트에서 공용 모듈로 떼어 내 `get_guide`와 같이 쓴다. 쓰기 도구는 순수 함수로 명령을 모두 검사한 뒤(전부 아니면 전무), 구성도 잠금 안에서 버전과 흐름을 한 트랜잭션으로 저장한다. MCP 라우트는 공식 SDK의 stateless Streamable HTTP로 받고 Bearer 키로 계정을 찾는다. 브라우저는 3초마다 가벼운 머리 정보(버전 번호·흐름 수·흐름 최종 수정 시각)를 물어 바뀌면 불러온다.

**Tech Stack:** Next.js 15 App Router(route handler, server actions), React 19, TypeScript, zod 4, Drizzle/Postgres, `@modelcontextprotocol/sdk@1.32.2`, vitest(node·jsdom·integration), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-06-mcp-server-design.md`

## Global Constraints

- 명령 검사·적용은 기존 `parseCommand`(`src/domain/commands.ts:73`)·`applyCommand`(`src/domain/apply.ts:28`)를 그대로 쓴다. MCP 쪽에 새 검사 규칙을 만들지 않는다(거절 이유를 쉬운 말로 바꾸는 것만 더함).
- 받지 않는 명령: `say`, 서버 전용 `set_link_guess`(`SERVER_ONLY_OPS`).
- MCP 경로에서 Clef·Qwen을 부르지 않는다. 경고는 코드 규칙과 망 지식 판정만.
- 키 원문은 DB·로그에 남기지 않는다. 형식 `isk_` + 무작위 32바이트(base64url), 저장은 SHA-256 hex. 목록에는 앞 8글자만. **(사용자 선택)**
- 대화 보정 중 **연결 짝 지우기(`createEdgeCoalescer`)만** 적용하고 `keepStepText`는 적용하지 않는다. **(사용자 선택)**
- 브라우저 확인 간격 3초, 탭이 보일 때만(`document.visibilityState === "visible"`). **(사용자 선택)**
- 지워진 노드·연결은 비교 보기 유령 모양으로 약 1초 보였다 사라진다. `prefers-reduced-motion: reduce`면 바로 사라진다. **(사용자 선택)**
- 버전 출처 새 값 `mcp`, 버전에 `via`(`"mcp"`|null)·`summary`(≤80자) 칸을 더한다. 이력 표기: `mcp` → "Claude Code에서", `restore`+`via:"mcp"` → "되돌리기 · Claude Code에서".
- summary가 비면 `"Claude Code에서 N곳 바꿈"`(N = 적용한 구성 명령 수).
- 잠금이 바쁠 때 문구: `"지금 다른 변경이 진행 중이에요. 잠시 뒤 다시 시도해 주세요."`
- 덮어쓰기 막기 문구: `"구성도가 바뀌었어요(지금 버전 N). get_diagram 으로 다시 읽어 주세요."`
- 모든 도구 설명 끝에: `"InfraSketch에 처음 그리기 전에 get_guide를 먼저 읽으세요."`
- `get_guide` 결과 ≤ 20,000자.
- 넣지 않는 도구: 프로젝트·구성도 삭제, 망 지식 편집, 계정 설정, Qwen을 쓰는 기능.
- 구성도 대화 기록에 메시지를 남기지 않는다(`restoreVersionWithMessage` 쓰지 않음).
- 마이그레이션은 `npm run db:generate`로 `src/db/migrations/0008_*`을 만든다. 개발 DB 적용·푸시는 사용자 요청 시.
- 화면 문구는 쉬운 한국어, 기존 화면(망 지식·용어 사전) 모양을 따른다. 색·글꼴은 기존 토큰만.
- 통합 테스트와 E2E는 동시에 돌리지 않는다.

## Review Focus

1. **다른 계정의 id** — 키 A로 계정 B의 diagram_id/project_id를 주면 "찾을 수 없어요"로 끝나고 아무것도 읽거나 쓰지 않는다. → Task 6 통합 테스트 `foreign ids are not found`.
2. **dry_run은 아무것도 쓰지 않는다** — 흐름 명령이 섞여도 버전 수·흐름 행이 그대로다. → Task 5 `dry_run writes nothing`.
3. **흐름 거절이 구성까지 막는다** — 구성 명령은 맞고 흐름 명령 하나가 틀리면 버전도 흐름도 안 생긴다. → Task 5 `a rejected flow op saves nothing`.
4. **브라우저 입력 보호** — 사용자가 입력란에 글을 쓰는 중 새 버전이 오면 화면을 바꾸지 않고 안내만 띄운다. → Task 9 `does not adopt while typing`.
5. **지운 키** — 지운 키로 부르면 바로 401. 마지막 사용 시각은 키를 쓸 때 갱신된다. → Task 3 `deleted key is rejected`.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/server/drawing/rules.ts` (새) | 공용 그리기 규칙 조각: 명령 예, 종류 목록, attrs 칸, 그리기 규칙, 패턴 블록, 망 지식 안내 글 |
| `src/server/chat/prompt.ts` (고침) | 공용 조각 + Qwen 전용 글로 `SYSTEM_PROMPT`를 조립(글자 그대로 같게) |
| `src/db/schema.ts` (고침), `src/db/migrations/0008_*` (새) | `mcp_keys` 테이블, `diagram_versions.via`·`summary` |
| `src/server/versions.ts` (고침) | `createVersion`에 `via`·`summary`·`tx`, `listVersions`에 두 칸 |
| `src/ui/HistoryPanel.tsx` (고침) | 출처 표기·summary 줄 |
| `src/server/mcpKeys.ts` (새) | 키 만들기·목록·지우기·확인 |
| `src/server/chat/settle.ts` (새) | 차례 끝 정리(빈 영역·망연계 기록·흐름 나누기 계산) — 대화와 MCP 공용 |
| `src/server/chat/warnings.ts` (고침) | `checkCodeWarnings`(Clef·Qwen 없는 경고 점검) |
| `src/domain/flows.ts`·`src/server/flows.ts` (고침) | 흐름 명령 미리 검사 `planFlowOps`, 트랜잭션 저장 |
| `src/server/mcp/explain.ts` (새) | 거절 이유를 쉬운 말로 |
| `src/server/mcp/apply.ts` (새) | `applyMcpCommands`, `restoreMcpVersion` |
| `src/server/mcp/read.ts` (새) | 목록·구성도 읽기·이력·`buildGuide` |
| `src/server/mcp/server.ts` (새) | MCP 서버와 도구 등록 |
| `src/app/api/mcp/route.ts` (새) | Bearer 확인, stateless 전송 |
| `src/middleware-paths.ts` (고침) | `/api/mcp` 공개 경로 |
| `src/app/(app)/claude-code/page.tsx`, `src/ui/mcp/McpKeysPage.tsx` (새), `src/ui/Sidebar.tsx`·`src/app/(app)/actions.ts` (고침) | 키 화면 |
| `src/app/api/diagrams/[id]/head/route.ts` (새), `src/ui/useRemoteChanges.ts` (새), `src/ui/GhostLayer.tsx` (새), `src/ui/DiagramWorkspace.tsx` (고침) | 브라우저 알아채기·효과 |

---

### Task 1: 그리기 규칙 공용 모듈

**Files:**
- Create: `src/server/drawing/rules.ts`
- Modify: `src/server/chat/prompt.ts:16-106`
- Test: `tests/unit/prompt.test.ts`, `tests/unit/drawing-rules.test.ts` (새)

**Interfaces:**
- Produces:
  - `COMMAND_EXAMPLES: string` — `add_*`/`update_*`/`remove_*`/`set_assumption`/`set_zone_type`/`guess`/흐름 명령 예 줄들(`say` 줄 제외).
  - `KIND_BLOCK: string` — 노드·영역·연결 종류 목록 줄과 `ATTR_LIST` 줄.
  - `DRAW_RULES: string` — Qwen 전용 줄을 뺀 그리기 규칙 글머리들.
  - `patternBlock(): string` — 지금 `patternPromptBlock()`.
  - `networkGuideText(k: NetworkKnowledge): string` — 망 종류(key·이름·다른 이름·등급), 기관 규칙, `GRADE_RULES` 기본 등급표. 종류 설명(description)은 넣지 않는다.
  - `ATTR_LIST`는 `prompt.ts`에서 계속 export(다시 내보내기).

- [ ] **Step 1: 지금 프롬프트를 고정하는 테스트를 쓴다.** `tests/unit/prompt.test.ts`에 `it("SYSTEM_PROMPT 글이 리팩터 전과 같다", () => expect(SYSTEM_PROMPT).toMatchSnapshot())`를 넣고 **리팩터 전에** 한 번 돌려 스냅샷 파일을 만들어 커밋한다. `ANSWER_PROMPT`도 같은 방식으로.
- [ ] **Step 2:** `npx vitest run tests/unit/prompt.test.ts` → PASS(스냅샷 생성). 커밋 `test(prompt): 리팩터 전 시스템 프롬프트 고정`.
- [ ] **Step 3: 공용 모듈 테스트를 쓴다.** `tests/unit/drawing-rules.test.ts`:
  - `DRAW_RULES`·`COMMAND_EXAMPLES`에 `"op":"say"`, `JSON Lines`, `warn 과 report_missing`, `질문이면 명령 없이`가 **없다**.
  - `COMMAND_EXAMPLES`의 `{"op":` 로 시작하는 줄은 모두 `parseCommand`가 ok.
  - `SYSTEM_PROMPT`가 `DRAW_RULES`·`COMMAND_EXAMPLES`·`KIND_BLOCK`·`patternBlock()`를 모두 포함.
  - `networkGuideText(k)`가 seed 종류의 key·이름·등급 라벨과 `GRADE_RULES` 7줄을 포함하고, seed의 description 문장은 포함하지 않는다.
- [ ] **Step 4:** 실행 → FAIL(모듈 없음).
- [ ] **Step 5: `src/server/drawing/rules.ts`를 만들고 `SYSTEM_PROMPT`를 조각과 Qwen 전용 줄(머리말, say 줄, JSONL·say·warn·질문·이어 쓰기 관련 규칙)로 다시 조립한다.** Qwen 전용 줄이 규칙 목록 중간에 끼어 있으면 그 위치를 지키도록 조각을 나눈다(스냅샷이 기준). `networkGuideText`는 기존 `networkBlock`의 기본 등급표 줄 만드는 코드를 함께 쓴다.
- [ ] **Step 6:** `npx vitest run tests/unit/prompt.test.ts tests/unit/drawing-rules.test.ts` → PASS, 스냅샷 변경 없음. `npm test` 전체 PASS.
- [ ] **Step 7:** 커밋 `refactor(prompt): 그리기 규칙을 공용 모듈로 떼어 낸다`.

### Task 2: 키 테이블과 버전 칸

**Files:**
- Modify: `src/db/schema.ts:129-148`, `src/server/versions.ts:8-75`, `src/ui/HistoryPanel.tsx:7,23`, `src/ui/DiagramWorkspace.tsx`(VersionRow 타입만)
- Create: `src/db/migrations/0008_*.sql`(생성), `tests/integration/versions-mcp.test.ts`
- Test: `tests/unit/HistoryPanel.test.tsx`(있으면 고치고 없으면 새로)

**Interfaces:**
- Produces:
  - `VersionSource = "import" | "restore" | "ai" | "form" | "mcp"`
  - `mcpKeys` 테이블: `id uuid pk default random`, `userId uuid → users.id on delete cascade`, `name text not null`, `prefix text not null`, `hash text not null unique`, `createdAt timestamptz default now`, `lastUsedAt timestamptz null`.
  - `diagramVersions`에 `via text null`(`$type<"mcp">`), `summary text null`.
  - `createVersion(diagramId, state, opts: { source; status?; restoredFrom?; messageId?; via?: "mcp"; summary?: string; tx?: Tx })` — `tx`가 있으면 그 트랜잭션 안에서 advisory lock·insert(새 트랜잭션을 열지 않음). `Tx`는 drizzle 트랜잭션 타입을 `src/db`에서 export.
  - `listVersions` 행에 `via: "mcp" | null`, `summary: string | null`.

- [ ] **Step 1: 통합 테스트.** `createVersion(d, s, {source:"mcp", via:"mcp", summary:"Redis 추가"})` 뒤 `listVersions(d)[0]`이 `{source:"mcp", via:"mcp", summary:"Redis 추가"}`; `db.transaction(tx => createVersion(d, s, {source:"ai", tx}))` 안에서 throw하면 버전이 생기지 않는다.
- [ ] **Step 2: 화면 테스트.** `HistoryPanel`에 `{source:"mcp", summary:"Redis 추가"}` 행 → "Claude Code에서"와 "Redis 추가"가 보인다; `{source:"restore", via:"mcp", restoredFrom:3}` → "되돌리기 · Claude Code에서"와 "v3에서".
- [ ] **Step 3:** 실행 → FAIL.
- [ ] **Step 4: 스키마·`versions.ts`·`HistoryPanel`을 고치고 `npm run db:generate`로 0008을 만든다.** 마이그레이션 이름은 drizzle-kit이 주는 대로 두되 파일을 열어 위 세 변경만 있는지 확인한다.
- [ ] **Step 5:** `npm test`·`npm run test:int` → PASS.
- [ ] **Step 6:** 커밋 `feat(db): MCP 키 테이블과 버전 출처·요약 칸 (마이그레이션 0008)`.

### Task 3: 키 만들기·확인

**Files:**
- Create: `src/server/mcpKeys.ts`, `tests/integration/mcpKeys.test.ts`

**Interfaces:**
- Consumes: Task 2 `mcpKeys`.
- Produces:
  - `MCP_KEY_LIMITS = { name: 40, perUser: 10 }` **(제 판단)**
  - `createMcpKey(userId, name): Promise<{ id: string; key: string; prefix: string }>` — 이름 앞뒤 공백 제거 후 1~40자, 계정당 10개 넘으면 `ValidationError("키는 10개까지 만들 수 있어요.")`, 빈 이름 `ValidationError("키 이름을 적어 주세요.")`.
  - `listMcpKeys(userId): Promise<{ id; name; prefix; createdAt: Date; lastUsedAt: Date | null }[]>` 최근 만든 순.
  - `deleteMcpKey(userId, id): Promise<void>` — 남의 키·없는 키는 `NotFoundError`.
  - `verifyMcpKey(raw: string): Promise<string | null>` — `isk_` 형식이 아니면 DB를 보지 않고 null. 맞으면 `lastUsedAt = now()`로 갱신하고 userId.
  - `hashKey(raw): string` — SHA-256 hex(`node:crypto`).

- [ ] **Step 1: 통합 테스트**: 만든 키 원문은 `isk_`로 시작하고 길이 47(`isk_` + 43); DB `mcp_keys` 어느 칸에도 원문이 없다(`hash === hashKey(key)`, `prefix === key.slice(0,8)`); `verifyMcpKey(key)`가 userId를 주고 `lastUsedAt`이 채워진다; `deleted key is rejected` — 지운 뒤 null; 다른 계정이 `deleteMcpKey`하면 NotFoundError; 11번째 키는 ValidationError; `verifyMcpKey("isk_bogus")`·`""`·`"Bearer x"` → null.
- [ ] **Step 2:** 실행 → FAIL.
- [ ] **Step 3:** 구현. 키는 `"isk_" + randomBytes(32).toString("base64url")`.
- [ ] **Step 4:** `npm run test:int -- tests/integration/mcpKeys.test.ts` → PASS.
- [ ] **Step 5:** 커밋 `feat(mcp): 계정 키 만들기·확인·지우기`.

### Task 4: 차례 끝 정리 공용화와 코드 경고 점검

**Files:**
- Create: `src/server/chat/settle.ts`
- Modify: `src/server/chat/pipeline.ts:144-153,379-399`, `src/server/chat/warnings.ts:196-243`
- Test: `tests/unit/settle.test.ts` (새), `tests/unit/chat-warnings.test.ts`(있는 경고 테스트 파일에 추가)

**Interfaces:**
- Produces:
  - `settleTurn(turnStart: DiagramState, state: DiagramState): { state: DiagramState; emitted: Command[]; splits: StepSplit[] }` — `pruneEmptyGroups` + `prunedOrder`의 `remove_group` 명령들, `recordReplaced`의 `set_link_guess` 적용, `splitsFor`. `emitted`는 적용 순서대로(`remove_group`… 그다음 `set_link_guess`…). `prunedOrder`는 이 파일로 옮긴다.
  - `checkCodeWarnings(state, prev: Warning[] | undefined, knowledge?: NetworkKnowledge): { warnings: Warning[]; fresh: Warning[] }` — `evaluateRules(state, knowledge)` + `prev`의 `db_exposed` 이어 받기 + fresh 계산(기존 `checkWarnings`의 Clef 실패·중단 경로와 같은 결과). `link_*` 글은 고정 글 그대로.

- [ ] **Step 1: 단위 테스트**: (a) 빈 영역이 생긴 상태 → `emitted`가 안쪽 영역부터 `remove_group`; (b) `adminCase` 망연계 추정 삽입 상태 → `set_link_guess` 하나와 splits 하나; (c) `checkCodeWarnings`가 같은 입력에 대해 `checkWarnings(state, prev, {clef: 실패하는 가짜, qwen: null}, AbortSignal.abort(), {knowledge})`와 같은 `warnings`·`fresh`를 준다; (d) prev의 `db_exposed`가 남는다.
- [ ] **Step 2:** 실행 → FAIL.
- [ ] **Step 3:** 구현하고 `pipeline.ts`가 `settleTurn`을 쓰게 바꾼다(동작 같게). `checkWarnings`의 해당 경로는 `checkCodeWarnings`를 부르게 해 중복을 없앤다.
- [ ] **Step 4:** `npm test`·`npm run test:int` → 기존 파이프라인 테스트 포함 PASS.
- [ ] **Step 5:** 커밋 `refactor(chat): 차례 끝 정리와 코드 경고 점검을 공용 함수로`.

### Task 5: MCP 고치기·되돌리기 서비스

**Files:**
- Create: `src/server/mcp/explain.ts`, `src/server/mcp/apply.ts`, `tests/unit/mcp-explain.test.ts`, `tests/integration/mcp-apply.test.ts`
- Modify: `src/domain/flows.ts`(미리 검사), `src/server/flows.ts:55-150`(`tx` 받기)

**Interfaces:**
- Consumes: Task 2 `createVersion({tx, via, summary})`, Task 4 `settleTurn`·`checkCodeWarnings`, `createEdgeCoalescer`(`src/domain/edgeCoalesce.ts`), `withDiagramLock`, `getOwnedDiagram`, `getNetworkKnowledge`, `getLatestState`, `listFlows`, `computeMissing`, `linkVerdicts`.
- Produces:
  - `planFlowOps(state: DiagramState, existing: Flow[], ops: FlowOp[]): { ok: true; changed: number } | { ok: false; rejected: { index: number; reason: string }[] }` — 지금 `applyFlowOps`가 쓰는 판정(not_found·exists·too_many_flows·no_steps·too_many_steps·`checkFlow` 문제)을 쓰기 없이 순서대로 시뮬레이션. `applyFlowOps`는 이 판정을 쓰도록 바꾸고 `opts.tx`를 받는다.
  - `explainRejection(index: number, cmd: unknown, error: string): string` — `"3번: parent 영역 vpc-1 이 없어요"` 꼴. `apply.ts` 오류 글(`id X already exists`, `parent X not found`, `endpoint X not found`, `node|edge|group X not found`, `assumption X is confirmed`, `group X is not a network zone`, `zone type X is confirmed`), `parseCommand` 오류(`path: message`), 모르는 명령, `say`, `set_link_guess`, 알 수 없는 망 종류, 흐름 거절 이유마다 쉬운 말. 모르는 글은 `"N번: 적용할 수 없어요(<원문>)"`.
  - `type McpApplyInput = { userId; diagramId; baseVersion: number; commands: unknown[]; summary?: string; dryRun?: boolean }`
  - `applyMcpCommands(input): Promise<McpApplyResult>`, `McpApplyResult =`
    - `{ ok: false; kind: "busy" | "stale" | "rejected"; message: string; errors?: string[]; latestVersion?: number }`
    - `{ ok: true; dryRun: boolean; version: number | null; changed: number; flowsChanged: number; freshWarnings: Warning[]; missing: MissingItem[]; linkExpected: LinkVerdict[]; url: string }`
  - `restoreMcpVersion({ userId, diagramId, baseVersion, number }): Promise<{ ok: false; kind: "busy"|"stale"|"not_found"; message } | { ok: true; version: number; brokenFlows: { id; name }[]; url }>`
  - `diagramUrl(diagramId): string` = `${env.APP_URL}/diagrams/${id}`(실제 구성도 경로를 확인해 맞춘다).

순서(apply): 소유 확인 → 잠금(바쁘면 busy) → 최신 버전 ≠ baseVersion이면 stale → 망 지식 읽기 → 명령마다 `say`·`set_link_guess`·모르는 op 거절, `parseCommand`, `set_zone_type` 종류 확인, 흐름 명령은 모으고, 나머지는 coalescer `push` → `applyCommand(state, c, {netTypes})`, 실패 모음(멈추지 않고 끝까지 검사) → `flush` → 흐름 `mapFlow` 후 `planFlowOps`(구성 명령을 다 적용한 상태 기준) → 하나라도 실패면 rejected(errors 전부) → `settleTurn` → `checkCodeWarnings`(prev = 최신 버전 warnings) → dryRun이면 여기서 결과(version null) → 구성 바뀜(isStructural 또는 가정 명령)이면 `db.transaction`: `createVersion({source:"mcp", via:"mcp", summary, tx})` + splits 있으면 `rewriteFlows(..., {tx})` + `applyFlowOps(..., "ai", {tx})`; 흐름만이면 버전 없이 흐름만 트랜잭션 저장.

- [ ] **Step 1: 단위 테스트(explain)**: 위 오류 글 종류마다 기대 문장 하나씩(예: `explainRejection(2, {op:"add_node",parent:"vpc-1"}, "parent vpc-1 not found")` → `"3번: parent 영역 vpc-1 이 없어요"`, 번호는 1부터).
- [ ] **Step 2: 통합 테스트(apply)** — `makeOwnedDiagram` + `createVersion`으로 v1:
  - 맞는 명령 3개 → v2, `source:"mcp"`, summary 기본값 `"Claude Code에서 3곳 바꿈"`, 대화 메시지 0개.
  - `a rejected flow op saves nothing` — 구성 2개 + 없는 연결을 쓰는 add_flow → rejected, 버전 그대로, 흐름 행 0.
  - 명령 중 2번째·4번째가 틀림 → errors 두 개(2번·4번), 저장 없음.
  - stale: baseVersion 1인데 최신 2 → stale, 메시지에 "지금 버전 2".
  - busy: `withDiagramLock`을 잡은 채 호출 → busy 문구.
  - `dry_run writes nothing` — 구성+흐름 명령, dryRun → ok, version null, 버전 수·흐름 행 그대로, freshWarnings 계산됨.
  - 흐름만 바꾼 호출 → version null, flowsChanged 1, 버전 수 그대로.
  - 지웠다 다시 만든 연결 짝 → 원래 연결 id 유지.
  - `set_link_guess`·`say` → rejected.
  - 망연계 추정(`guess`)을 넣는 명령 → 저장된 상태에 `set_link_guess` 기록, 흐름 단계 나뉨.
  - restore: v1으로 되돌리기 → 새 버전 `source:"restore", via:"mcp", restoredFrom:1`, 메시지 0개, 끊긴 흐름 이름 돌려줌; stale·busy 같은 방식.
- [ ] **Step 3:** 실행 → FAIL.
- [ ] **Step 4:** 구현.
- [ ] **Step 5:** `npm test`·`npm run test:int` → PASS(기존 흐름 테스트 포함).
- [ ] **Step 6:** 커밋 `feat(mcp): 명령 고치기·되돌리기 — 전부 아니면 전무, 덮어쓰기 막기`.

### Task 6: 읽기 서비스와 안내서

**Files:**
- Create: `src/server/mcp/read.ts`, `tests/integration/mcp-read.test.ts`, `tests/unit/mcp-guide.test.ts`
- Modify: `src/server/projects.ts`(목록에 최신 버전 번호)

**Interfaces:**
- Consumes: Task 1 `COMMAND_EXAMPLES`·`KIND_BLOCK`·`DRAW_RULES`·`patternBlock`·`networkGuideText`, Task 5 `diagramUrl`.
- Produces:
  - `buildGuide(k: NetworkKnowledge): string` — 머리말(InfraSketch가 무엇인지), `apply_commands` 명령 형식(한 줄에 JSON 하나가 아니라 **배열의 원소**로 보낸다는 점), `COMMAND_EXAMPLES`, `KIND_BLOCK`, `DRAW_RULES`, `patternBlock()`, `networkGuideText(k)`, 사용법(“구성도가 바뀌었으면 get_diagram 으로 다시 읽고 고친다”, “모르는 값은 비워 둔다”, “흐름은 버전과 따로 저장되며, 고치기 전에 get_diagram 으로 최신 흐름을 읽는다”, “base_version 은 get_diagram 의 version”, “먼저 dry_run 으로 확인할 수 있다”).
  - `listProjectsForMcp(userId): Promise<{ id; name; diagrams: { id; name; version: number }[] }[]>`
  - `createProjectForMcp(userId, name)` → `createProjectWithDiagram(userId, name, "새 구성도")` 결과 `{ projectId; diagramId }`.
  - `listDiagramsForMcp(userId, projectId)`, `createDiagramForMcp(userId, projectId, name): { diagramId; version: 1 }`
  - `getDiagramForMcp(userId, diagramId): { version; state: {groups,nodes,edges,assumptions}; zones: {id; name; type: string|null; typeName: string|null; typeSource: "ai"|"user"|null}[]; guessedLinks: string[]; flows: StoredFlow[]; brokenFlows: {id; name; problems}[]; warnings: Warning[]; missing: MissingItem[]; url }` — 경고는 `mergeWarnings(state, k).active`. 지식에 없는 종류 key는 `type: null`.
  - `listVersionsForMcp(userId, diagramId): { number; createdAt: string; source; via; summary }[]` 최근 50개.

- [ ] **Step 1: 단위 테스트(guide)**: seed 지식으로 `buildGuide(k).length <= 20000`; `"get_diagram 으로 다시 읽"`·`"모르는 값은 비워"`·`"흐름은 버전과 따로"` 포함; `"op":"say"`·`JSON Lines` 미포함; seed에 종류 30개·기관 규칙 30개를 더한 지식도 ≤ 20000.
- [ ] **Step 2: 통합 테스트(read)**: 목록에 최신 버전 번호; `createProjectForMcp`가 첫 구성도 하나를 만든다; `getDiagramForMcp`가 망 영역 종류·출처, 끊긴 흐름, 빠진 정보를 준다; `foreign ids are not found` — 다른 계정의 project_id/diagram_id로 각 함수가 `NotFoundError`.
- [ ] **Step 3:** 실행 → FAIL. **Step 4:** 구현. **Step 5:** PASS.
- [ ] **Step 6:** 커밋 `feat(mcp): 구성도 읽기와 그리기 안내서`.

### Task 7: MCP 라우트와 도구

**Files:**
- Create: `src/server/mcp/server.ts`, `src/app/api/mcp/route.ts`, `tests/integration/mcp-route.test.ts`
- Modify: `package.json`(`@modelcontextprotocol/sdk` `1.32.2` 정확한 버전), `src/middleware-paths.ts`, `tests/unit/middleware-matcher.test.ts`

**Interfaces:**
- Consumes: Task 3 `verifyMcpKey`, Task 5·6 서비스.
- Produces:
  - `createMcpServer(userId: string): McpServer` — 도구 `get_guide`, `list_projects`, `create_project(name)`, `list_diagrams(project_id)`, `create_diagram(project_id, name)`, `get_diagram(diagram_id)`, `list_versions(diagram_id)`, `apply_commands(diagram_id, base_version, commands[], summary?, dry_run?)`, `restore_version(diagram_id, base_version, number)`. 입력은 zod 스키마(`commands`는 `z.array(z.record(z.string(), z.unknown())).min(1).max(500)` **(제 판단: 한 번에 500개)**, summary `max(80)`). 결과는 `content: [{type:"text", text: "<짧은 머리말>\n" + JSON.stringify(data)}]`; 실패(busy/stale/rejected/not found/검증 오류)는 `isError: true`와 쉬운 문장.
  - 라우트 `POST`(그리고 SDK가 요구하면 `GET`·`DELETE`에 405): `Authorization: Bearer <키>` → `verifyMcpKey` 실패면 401 JSON `{error:"키가 맞지 않아요."}`. 요청마다 새 서버·새 SDK 웹 표준 Streamable HTTP 전송(stateless: `sessionIdGenerator: undefined`, JSON 응답). `runtime = "nodejs"`, `dynamic = "force-dynamic"`. 키·Authorization 헤더는 로그에 쓰지 않는다.
  - `PUBLIC`에 `/^\/api\/mcp$/`.

- [ ] **Step 1: 테스트**: middleware — `/api/mcp`는 로그인 없이 `"next"`. 통합 — SDK `Client` + `StreamableHTTPClientTransport`의 `fetch`를 라우트 `POST`에 직접 연결(서버를 띄우지 않음): 키 없음/틀린 키 → 401; `tools/list`에 9개 도구, 모든 설명이 Global Constraints의 get_guide 문장으로 끝남; `create_project` → `get_diagram` → `apply_commands`(dry_run) → `apply_commands` → `list_versions` 끝까지; stale일 때 `isError` 와 "get_diagram 으로 다시 읽어 주세요"; 다른 계정 diagram_id → `isError` "찾을 수 없어요".
- [ ] **Step 2:** 실행 → FAIL. **Step 3:** `npm install @modelcontextprotocol/sdk@1.32.2 --save-exact` 후 구현. **Step 4:** `npm test`·`npm run test:int`·`npx tsc --noEmit` → PASS.
- [ ] **Step 5:** 커밋 `feat(mcp): /api/mcp 라우트와 도구 9개`.

### Task 8: 키 화면

**Files:**
- Create: `src/app/(app)/claude-code/page.tsx`, `src/ui/mcp/McpKeysPage.tsx`, `src/ui/mcp/McpKeysPage.module.css`, `tests/unit/McpKeysPage.test.tsx`
- Modify: `src/app/(app)/actions.ts`, `src/ui/Sidebar.tsx:350-379`

**Interfaces:**
- Consumes: Task 3 함수.
- Produces:
  - 서버 액션 `createMcpKeyAction(name): Promise<{ok:true; key; id; prefix} | {ok:false; error}>`, `deleteMcpKeyAction(id)`, `listMcpKeysAction()` — 기존 `runResult` 꼴.
  - 사이드바 계정 메뉴(`accountRow`)에 "Claude Code 연결" 링크(`/claude-code`), 망 지식 링크와 같은 모양·활성 표시.
  - 화면: 키 이름 입력 + "키 만들기" → 키를 **한 번만** 보여 주는 칸(“이 창을 닫으면 다시 볼 수 없어요”)과 복사 버튼(`navigator.clipboard.writeText`, 실패하면 “직접 선택해 복사해 주세요”), 그 아래 설정 예 `claude mcp add --transport http infrasketch <앱 주소>/api/mcp --header "Authorization: Bearer <키>"`(앱 주소는 `window.location.origin`)와 복사 버튼. 목록: 이름·만든 날·마지막 사용(없으면 “아직 안 씀”)·앞 8글자·지우기(기존 `DeleteDialog`).
- [ ] **Step 1: 화면 테스트**: 만들기 뒤 키·설정 예가 보이고, 목록 새로 고침 뒤(또는 다시 그린 뒤)에는 키 원문이 DOM에 없다; 지우기 확인 뒤 행이 사라진다; 빈 이름이면 안내 문구.
- [ ] **Step 2:** FAIL. **Step 3:** 구현(망 지식 화면 모양을 따른다). **Step 4:** `npm test` PASS.
- [ ] **Step 5:** 커밋 `feat(ui): Claude Code 연결 키 화면`.

### Task 9: 열어 둔 브라우저가 변경을 알아채기

**Files:**
- Create: `src/app/api/diagrams/[id]/head/route.ts`, `src/ui/useRemoteChanges.ts`, `src/ui/GhostLayer.tsx`, `tests/unit/useRemoteChanges.test.tsx`, `tests/integration/diagram-head.test.ts`
- Modify: `src/ui/DiagramWorkspace.tsx:301-363`, `src/server/flows.ts`(머리 정보 함수)

**Interfaces:**
- Produces:
  - `GET /api/diagrams/[id]/head` → `{ version: number; flows: { count: number; updatedAt: string | null } }`(로그인·소유 확인, 기존 flows 라우트 꼴). 흐름 수와 `max(updatedAt)`을 함께 써 지우기도 알아챈다.
  - `useRemoteChanges({ diagramId, version, flowsKey, paused, onVersion, onFlows }): { pending: boolean; load(): void }` — 3초마다 탭이 보일 때만 head를 부르고, `version`보다 크면 `paused`가 아니면 `onVersion()`, `paused`면 `pending=true`(안내만). 흐름 키가 바뀌면 `onFlows()`. 대화 차례 중(`chat.busy`)에는 묻지 않는다.
  - `paused` 판단 **(제 판단)**: 작업 화면 안의 `input`·`textarea`·`[contenteditable]`에 포커스가 있거나, 대화상자가 열려 있거나, `mode.kind !== "live"`(비교·이력 보기 중).
  - 안내 띄우기: `"Claude Code가 구성도를 바꿨어요"` + `[불러오기]` 버튼(누르면 `load()`).
  - 효과: 새 버전을 받으면 `diffStates(old, new)`로 새 노드는 기존 `fly.queue`로, 지워진 노드·연결은 `GhostLayer`가 비교 보기 유령 모양으로 약 1초(`GHOST_MS = 1000`) 보였다 사라지게(`opacity` 전환만). `prefers-reduced-motion: reduce`면 유령을 그리지 않는다.
  - 불러오기는 기존 `refreshFromServer()` 흐름(`router.refresh()` + `loadVersions()`)을 쓴다. 흐름은 `useFlows`의 다시 읽기.
- [ ] **Step 1: 테스트**: 훅 — 가짜 타이머로 3초 뒤 head 호출, `document.visibilityState="hidden"`이면 안 부름, 버전이 오르면 `onVersion`, `does not adopt while typing`(paused=true면 `onVersion` 안 부르고 `pending` true), 흐름 키 변경 → `onFlows`. 통합 — head가 지운 흐름 뒤 count를 줄여 준다, 남의 구성도는 404.
- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** `npm test`·`npm run test:int` PASS.
- [ ] **Step 5:** 커밋 `feat(ui): 열어 둔 구성도가 Claude Code 변경을 몇 초 안에 보여 준다`.

### Task 10: E2E와 문서

**Files:**
- Create: `tests/e2e/mcp.spec.ts`
- Modify: `README.md`(Claude Code 연동 절), `docs/superpowers/specs/2026-11-06-mcp-server-design.md`는 고치지 않는다

- [ ] **Step 1: E2E**: 가입 → 프로젝트 만들기 → 계정 메뉴 "Claude Code 연결" → 키 만들기 → 화면에서 키를 읽는다 → 구성도를 열어 둔 채 Playwright `request`로 `/api/mcp`에 JSON-RPC `initialize`·`tools/call get_diagram`·`tools/call apply_commands`(노드 하나 추가) → 열어 둔 화면에 새 노드가 10초 안에 보인다 → 이력에 "Claude Code에서". 키를 지운 뒤 같은 호출이 401.
- [ ] **Step 2:** `npm run test:e2e -- tests/e2e/mcp.spec.ts` → PASS(통합 테스트와 동시에 돌리지 않는다).
- [ ] **Step 3: README**에 연결 방법(키 만들기, `claude mcp add` 명령, 도구 목록 한 줄씩, 넣지 않은 도구)을 더한다. 문서 사이트(`architecture.md`의 MCP 도구 표·키 데이터 모델, 그래프 재생성)는 main에 합친 뒤 docs worktree에서 한다.
- [ ] **Step 4:** 커밋 `test(e2e): Claude Code 연동 — 키 화면과 열어 둔 구성도 반영` / `docs: Claude Code 연동 사용법`.
