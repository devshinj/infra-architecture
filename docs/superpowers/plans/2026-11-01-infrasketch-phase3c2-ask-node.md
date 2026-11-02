# InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 노드 하나에 대해 질문하면 그 질문으로 시작하는 새 대화 세션이 대화 탭에 생기고, AI 가 그 노드의 메타정보를 근거로 답한다(구성은 바꾸지 않는다).

**Architecture:** 새 테이블 `chat_sessions` 와 `messages.session_id`(null = 구성도 대화)로 세션을 저장한다. 질문 차례는 새 API `POST /api/diagrams/[id]/ask` 가 SSE 로 흘린다. 서버는 `runAskTurn` 에서 Clef 의도 분류로 구성 변경 요청을 걸러 내고(걸리면 안내 + 넘겨주기), 아니면 Qwen 으로 노드 맥락에 기대 답한다. 구성도 대화와 같은 구성도 잠금을 써서 한 번에 한 차례만 돈다. 화면은 대화 탭 위 `세션 고르기` 버튼으로 세션을 바꾸고, 질문은 설명 패널 아래 입력과 노드 우클릭 메뉴에서 시작한다.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, drizzle/postgres, zod v4, Qwen(OpenAI 호환 스트림), Clef-Flash, vitest(+ integration), Playwright(가짜 AI).

**Spec:** `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md` §6.8 (세부는 이 계획이 정한다 — Task 1 에서 §6.8 에 결정을 적는다).

## Global Constraints

- §6.8: 질문 세션의 AI 는 그 노드의 세부 메타정보(종류·SW·속성·연결·설명)를 근거로 답하고 구성은 바꾸지 않는다.
- Clef 는 서버에서만 부른다. 진짜 AI 는 테스트·구현자가 부르지 않는다(`npm run smoke:llm` 금지).
- `.env` 를 읽거나 출력·수정·커밋하지 않는다. `npm run db:migrate` 는 구현자가 돌리지 않는다(개발 DB 마이그레이션은 컨트롤러가 한다). 마이그레이션 파일은 `npm run db:generate` 로 만든다.
- 그냥 `npm run build` 금지(E2E 는 `npm run test:e2e` 가 `.next-e2e` 로 빌드). `.superpowers/` 아래 `git add -f` 금지. 맨 `git stash` 금지.
- 디자인: 금색 `--accent` 새 용도 없음, 이모지·글로우·그라디언트·그림자 금지, 아이콘은 SVG, 유리 표면 토큰 사용, 최소 글자 11px, reduced motion 존중.
- 문구는 한국어, 이 계획에 적힌 문구는 글자 그대로 쓴다. 조사 받침 문제를 피하려고 노드 이름 뒤에는 조사를 붙이지 않는다(` · ` 로 잇는다).
- 커밋 끝 줄: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` 과 `Claude-Session: https://claude.ai/code/session_015RDJUjHKUdnZuHRmcFJJV2`.

## Review Focus

1. 질문 세션의 메시지가 구성도 대화(첫 화면 대화 목록·Qwen 에 넘기는 대화 기록·Clef 의 `lastAssistant`)에 섞이지 않는다. Task 1·2 테스트.
2. 질문 차례가 도는 동안 구성도 대화를 보내면(다른 탭 포함) 서버가 바쁨(409)으로 막고, 그 반대도 같다. Task 2 테스트.
3. 남의 구성도·남의 세션 id 로 묻거나 읽으면 404, 다른 구성도의 세션 id 를 섞어 보내도 404. Task 2 테스트.
4. 질문한 노드가 지워진 뒤 그 세션에 보내면 서버가 거절(409, `NODE_GONE_MESSAGE`)하고, 화면은 입력을 막는다. Task 2·3 테스트.
5. 첫 질문 도중 중단·오류여도 세션과 사용자 메시지는 남고, 목록에 보인다(빈 세션이 사라지지 않는다). Task 2 테스트.

---

### Task 1: 세션 저장

**Files:**
- Modify: `src/db/schema.ts`, `src/server/chat/messages.ts`
- Create: `src/server/chat/sessions.ts`, 마이그레이션 `src/db/migrations/0003_*.sql`(`npm run db:generate`)
- Modify: 스펙 §6.8 (결정 기록)
- Test: `tests/integration/sessions.test.ts`, 기존 `listMessages` 사용처 테스트

**Interfaces:**
- Produces:
  - 테이블 `chat_sessions`: `id uuid pk default random`, `diagram_id uuid not null → diagrams.id on delete cascade`, `node_id text not null`, `node_label text not null`(만들 때 이름 스냅숏), `title text not null`(첫 질문, 공백 접고 60자 자름), `created_at`, `updated_at`. 인덱스 `(diagram_id, updated_at)`.
  - `messages.session_id uuid null → chat_sessions.id on delete cascade`. 인덱스 `(session_id, created_at)`.
  - `createSession(diagramId: string, nodeId: string, nodeLabel: string, firstQuestion: string): Promise<SessionRow>`
  - `listSessions(diagramId: string): Promise<SessionRow[]>` — updated_at 최신순.
  - `getSession(diagramId: string, sessionId: string): Promise<SessionRow | null>` — 다른 구성도의 세션이면 null.
  - `touchSession(sessionId: string): Promise<void>` — updated_at 갱신.
  - `SessionRow = { id: string; diagramId: string; nodeId: string; nodeLabel: string; title: string; createdAt: Date; updatedAt: Date }`
  - `createMessage(diagramId, role, content, meta?, sessionId?: string | null)` — 마지막 인자 추가(기본 null).
  - `listMessages(diagramId, limit = 100, sessionId: string | null = null)` — `sessionId` 가 null 이면 `session_id is null` 인 것만(구성도 대화), 아니면 그 세션 것만.

- [ ] **Step 1: 실패하는 통합 테스트** (`tests/integration/sessions.test.ts`)
  - `createSession trims title to 60 chars and folds whitespace`
  - `listSessions returns newest updated first and only for the diagram`
  - `getSession returns null for another diagram's session`
  - `listMessages without session excludes session messages` / `listMessages with session returns only that session`
  - `deleting the diagram cascades sessions and their messages`
- [ ] **Step 2:** `npm run test:int -- tests/integration/sessions.test.ts` → FAIL
- [ ] **Step 3: 구현.** 스키마·저장소·`npm run db:generate`. §6.8 에 이 계획의 결정(진입점·세션 고르기·이어 묻기·변경 요청 넘겨주기·한 번에 한 차례·지워진 노드 읽기 전용·`chat_sessions` 저장)을 짧게 적는다.
- [ ] **Step 4:** `npm run test:int`, `npm test`, `npx tsc --noEmit` → PASS
- [ ] **Step 5: Commit** `feat: 질문 세션 저장(chat_sessions)`

---

### Task 2: 질문 차례(서버)

**Files:**
- Create: `src/server/chat/ask.ts`, `src/app/api/diagrams/[id]/ask/route.ts`, `src/app/api/diagrams/[id]/sessions/[sessionId]/route.ts`
- Modify: `src/server/chat/prompt.ts` (`ASK_PROMPT`, `buildAskMessages`, `explainContext` export), `src/server/chat/events.ts`, `src/server/chat/pipeline.ts`(구성도 대화가 `listMessages(diagramId, n, null)` 을 쓰는지 확인)
- Test: `tests/integration/ask.test.ts`, `tests/unit/prompt.test.ts`, `tests/unit/ask-route.test.ts`

**Interfaces:**
- Consumes: Task 1 저장소, `withDiagramLock`, `deps.clef.classifyIntent`, `deps.qwen.streamCompletion`, `createThinkStripper`, explanations 캐시(`explanations` 테이블의 그 노드 data).
- Produces:
  - `ChatEvent` 에 `{ t: "session"; session: { id: string; nodeId: string; nodeLabel: string; title: string; updatedAt: string } }`(새 세션일 때 `start` 바로 앞), `{ t: "handoff"; text: string }`(구성 변경 요청일 때, 사용자 글 그대로).
  - `MessageMeta` 에 `handoff?: true`.
  - `runAskTurn(args: { userId; diagramId; nodeId: string; sessionId: string | null; text; signal; emit }, deps: ChatDeps): Promise<ChatTurnResult | { status: "gone" }>`
  - 상수: `HANDOFF_REPLY = "구성을 바꾸려면 구성도 대화에서 말해 주세요."`, `NODE_GONE_MESSAGE = "이 노드는 지금 구성도에 없어서 이어서 물을 수 없어요."`
  - `POST /api/diagrams/[id]/ask` body `{ nodeId: string(1..200), text: string(trim 1..4000), sessionId?: uuid }` → SSE(구성도 대화 route 와 같은 형식·오류 코드). 404: 남의 구성도/세션. 409: 잠금 실패(`BUSY_MESSAGE`) 또는 노드 없음(`NODE_GONE_MESSAGE`). sessionId 가 있으면 nodeId 는 그 세션의 node_id 와 같아야 한다(다르면 400).
  - `GET /api/diagrams/[id]/sessions/[sessionId]` → `{ session: SessionRow(JSON), messages: { id, role, content, meta, createdAt }[] }`(최근 100개, 오래된 순). 404 규칙 같음.
  - `ASK_PROMPT`(시스템): 노드 하나에 대한 질문에 한국어 1~4문장 일반 글로 답한다. 근거는 주어진 "대상 노드"(종류·SW·속성·연결된 노드)와 "설명"(있으면)뿐이고 없으면 모른다고 말한다. JSON·명령·코드펜스·마크다운 제목 금지. 제품명 원어. 구성을 바꿔 달라는 말이면 바꾸지 않고 구성도 대화에서 요청하라고 짧게 안내한다.
  - `buildAskMessages({ state, nodeId, explanation?: NodeExplanation, history, text })` — user 글: `대상 노드:\n${explainContext(state,"node",nodeId)}\n\n설명:\n<정의·역할·ADR 한 줄씩 또는 "없음">\n\n질문: ${text}`; 세션 기록은 최근 `HISTORY_LIMIT` 개.

동작:
- 잠금은 구성도 대화와 같은 `withDiagramLock(diagramId)`(한 번에 한 차례).
- 노드가 최신 상태에 없으면 잠금 전에 `gone` → 409. 세션을 만들지 않는다.
- sessionId 가 없으면 `createSession` → `session` 이벤트. 사용자 메시지를 그 세션에 저장, `start`(intent 포함).
- Clef `classifyIntent` 결과가 `structure_change` 면 Qwen 을 부르지 않고 `say`(HANDOFF_REPLY) + `handoff` 이벤트, assistant 메시지 meta `{ intent, handoff: true, says: [HANDOFF_REPLY] }`. Clef 실패·null 이면 질문으로 친다.
- 그 밖에는 `status: answering` → `answer` 델타(think 제거) → 저장. 중단·오류·시간 초과 처리, `done` 모양은 구성도 대화와 같다(`version: null`, `applied: 0`, 현재 nodes/edges/missing).
- 끝나면 `touchSession`.

- [ ] **Step 1: 실패하는 테스트**
  - `tests/unit/prompt.test.ts`: `ask prompt includes target node context and explanation`, `ask prompt says 없음 without explanation`, `ask history is capped`.
  - `tests/integration/ask.test.ts`(가짜 qwen·clef): `first question creates a session and streams an answer`, `follow-up reuses the session and passes session history only`, `main chat history excludes ask messages`(구성도 대화 차례의 Qwen messages 에 질문 세션 글이 없음), `structure_change request hands off without calling qwen`, `clef failure falls back to answering`, `gone node returns gone and creates no session`, `busy while a main turn holds the lock`, `aborted first question keeps the session and user message`, `another user's diagram or session is not found`, `sessionId with a different nodeId is rejected`.
  - `tests/unit/ask-route.test.ts`: 상태 코드 매핑(400/404/409/SSE).
- [ ] **Step 2:** → FAIL
- [ ] **Step 3: 구현.** route 는 `src/app/api/diagrams/[id]/chat/route.ts` 의 SSE·오류 처리 모양을 따른다(공통 부분이 크면 작은 도우미로 나눈다).
- [ ] **Step 4:** `npm test`, `npm run test:int`, `npx tsc --noEmit`, `npm run lint` → PASS
- [ ] **Step 5: Commit** `feat: 노드 질문 차례 API`

---

### Task 3: 세션 고르기와 질문 세션 화면

**Files:**
- Create: `src/ui/chat/SessionPicker.tsx`, `src/ui/chat/useSessions.ts`
- Modify: `src/ui/chat/useChatTurn.ts`(보낼 곳·본문을 세션에 따라), `src/ui/chat/ChatPanel.tsx`, `src/ui/chat/chat.module.css`, `src/ui/DiagramWorkspace.tsx`, `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`(세션 목록 초기값), `src/ui/chat/lines.ts`(handoff 줄)
- Test: `tests/unit/SessionPicker.test.tsx`, `tests/unit/useSessions.test.tsx`, `tests/unit/useChatTurn.test.tsx`, `tests/unit/ChatPanel.test.tsx`

**Interfaces:**
- Consumes: Task 2 API·이벤트.
- Produces:
  - `type SessionKey = "main" | string`(세션 id).
  - `useSessions({ diagramId, initial: SessionSummary[] })` → `{ sessions, active: SessionKey, select(key), linesOf(key): ChatLine[] | "loading", upsert(summary), setLines(key, lines) }`; 세션 줄은 처음 고를 때 `GET …/sessions/[id]` 로 불러 캐시한다.
  - `SessionSummary = { id; nodeId; nodeLabel; title; updatedAt: string }`
  - `useChatTurn` 의 `send(text)` 가 `target: { kind: "main" } | { kind: "ask"; nodeId: string; sessionId: string | null }` 를 받는다(기본 main). `session` 이벤트를 `onSession(summary)` 로 올린다.
  - `startAsk(nodeId: string, text: string)`(DiagramWorkspace): 대화 탭으로 가서 새 세션 차례를 시작한다. Task 4 가 쓴다.

결정(사용자 선택):
- 대화 탭 맨 위 버튼 `구성도 대화 ▾`(질문 세션이면 `<현재 노드 이름> · <title>` 을 한 줄로, 넘치면 말줄임). 누르면 팝오버 목록: 맨 위 `구성도 대화`, 그 아래 질문 세션들(최신순). 각 줄: 노드 이름(지금 상태의 이름, 없으면 스냅숏 + ` (지워짐)`) · title, 오른쪽에 HH:mm(오늘) 또는 M/D. 3D 의 popover 훅(Esc·바깥 클릭·포커스 복귀)을 쓴다. 질문 세션이 하나도 없으면 버튼은 `구성도 대화` 글자만 보이고 누를 수 없다.
- 질문 세션 화면: 진행 카드·빛점·가정/빠진 정보 칩 없이 사용자 말풍선과 AI 답(머리 줄 `IS` · `InfraSketch` · HH:mm)만. 입력 자리표시 `이 노드에 대해 더 물어보기`.
- 넘겨주기: `handoff` 가 온 AI 메시지 아래 버튼 `구성도 대화로 보내기`. 누르면 구성도 대화로 바꾸고 입력창에 `@<노드 이름>` 참조 + 사용자 글을 채운다(보내지 않음, 3D `MentionInput.setText` 와 참조 붙이기 사용). 노드가 지워졌으면 버튼은 비활성.
- 한 번에 한 차례: 어느 세션이든 차례가 도는 동안에는 모든 세션의 보내기를 막는다(안내 `다른 대화가 답하는 중이에요.`). 세션 전환은 막지 않는다. 돌고 있는 차례의 줄은 그 세션에 쌓인다.
- 지워진 노드의 세션: 입력 대신 `NODE_GONE_MESSAGE` 와 같은 문구를 안내로 보이고 보내기 불가.
- 새로고침하면 구성도 대화로 연다(마지막 세션 기억 안 함).
- 비교·이전 버전 보기에서는 질문 보내기를 막는다(구성도 대화와 같은 규칙).

- [ ] **Step 1: 실패하는 테스트**
  - `SessionPicker`: `shows 구성도 대화 alone and disabled with no sessions`, `lists sessions newest first with node name and title`, `deleted node shows (지워짐)`, `Esc closes and returns focus`.
  - `useSessions`: `loads a session's lines once on first select`, `upsert moves a session to the top`.
  - `useChatTurn`: `ask target posts to /ask with nodeId and sessionId`, `session event is reported`, `handoff line has a send-to-main action`.
  - `ChatPanel`: `ask session hides progress card and chips`, `sending is blocked in every session while a turn runs`, `gone node session shows notice instead of input`, `handoff button fills the main input with mention and text`.
- [ ] **Step 2:** → FAIL
- [ ] **Step 3: 구현.**
- [ ] **Step 4:** `npm test`, `npm run lint`, `npx tsc --noEmit` → PASS
- [ ] **Step 5: Commit** `feat: 대화 세션 고르기와 질문 세션 화면`

---

### Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)

**Files:**
- Create: `src/ui/explain/AskNode.tsx`
- Modify: `src/ui/explain/Explanation.tsx` 또는 설명 탭 컨테이너, `src/canvas/NodeMenu.tsx`, `src/canvas/Canvas.tsx`(메뉴 동작 전달), `src/ui/DiagramWorkspace.tsx`
- Test: `tests/unit/AskNode.test.tsx`, `tests/unit/NodeMenu.test.tsx`, `tests/unit/DiagramWorkspace.test.tsx`

**Interfaces:**
- Consumes: Task 3 `startAsk(nodeId, text)`, 차례 진행 여부(busy), live 여부.
- Produces: `<AskNode nodeId: string nodeLabel: string disabled: boolean disabledReason?: string onAsk(text: string): void focusToken?: number />`

결정(사용자 선택: 설명 패널 아래 + 우클릭 메뉴):
- 노드 설명 탭 맨 아래(설명 본문 뒤) 한 줄 입력. 라벨 `이 노드에 대해 물어보기`(시각적으로 숨긴 label 이 아니라 작은 제목으로 보임), 자리표시 `예: 이 서버는 왜 두 대예요?`, 전송 버튼(SVG 아이콘, `aria-label="질문 보내기"`). Enter 로 보내고 Shift+Enter 줄바꿈 없음(한 줄). 빈 글이면 보내지 않는다.
- 보내면 `startAsk` → 대화 탭으로 가서 새 세션이 열리고 답이 흐른다. 입력은 비운다.
- 연결선 설명·용어 노드 설명에는 두지 않는다(노드 전용).
- 노드 우클릭 메뉴에 두 번째 항목 `이 노드에 대해 물어보기`. 누르면 그 노드를 선택해 설명 탭을 열고 이 입력에 포커스(`focusToken` 증가).
- 차례가 도는 중·이전 버전 보기·비교 중이면 입력과 메뉴 항목을 비활성(안내 `다른 대화가 답하는 중이에요.` / 구성도 대화와 같은 보기 모드 안내).

- [ ] **Step 1: 실패하는 테스트**
  - `AskNode`: `Enter sends trimmed text and clears`, `empty text does not send`, `disabled shows reason`, `focusToken focuses the input`.
  - `NodeMenu`: `has 이 노드에 대해 물어보기 item`.
  - `DiagramWorkspace`: `ask from explanation opens chat tab with a new session`, `menu ask selects node, opens 설명 and focuses the ask input`.
- [ ] **Step 2:** → FAIL
- [ ] **Step 3: 구현.**
- [ ] **Step 4:** `npm test`, `npm run lint`, `npx tsc --noEmit` → PASS
- [ ] **Step 5: Commit** `feat: 설명 패널과 우클릭 메뉴에서 노드에 대해 묻기`

---

### Task 5: E2E — 노드 질문 흐름

**Files:** Modify `tests/e2e/fake-llm.ts` · Create `tests/e2e/phase3c2.spec.ts`

- [ ] **Step 1: 가짜 AI.** 시스템 프롬프트가 `ASK_PROMPT` 이면 `대상 노드` 이름을 넣은 고정 답(예: `<이름>에 대한 가짜 답이에요.`)을 흘린다. 가짜 Clef 는 글에 `이중화해 줘` 가 있으면 `structure_change`.
- [ ] **Step 2: E2E**
  - `ask from explanation creates a session and answers` — 샘플 → 노드 선택 → 설명 탭 입력에 질문 → 대화 탭, 세션 버튼에 `<노드 이름> · <질문>`, 답 보임.
  - `follow-up stays in the session and main chat is untouched` — 이어 묻기 → 세션 고르기로 `구성도 대화` → 질문 글이 없음.
  - `change request hands off to main chat` — `이중화해 줘` → `구성도 대화로 보내기` → 구성도 대화 입력에 참조와 글.
  - `menu ask focuses the ask input`.
  - `sessions survive reload` — 새로고침 → 구성도 대화로 열림 → 세션 고르기 목록에 세션 → 고르면 지난 글.
- [ ] **Step 3:** `npm run test:e2e` 연속 2회 통과(기존 23개 유지)
- [ ] **Step 4: Commit** `test: 3C-2단계 E2E(노드에 대해 물어보기)`

---

## 실행 순서
Task 1 → 2 → 3 → 4 → 5. Task 1 뒤 컨트롤러가 개발 DB 에 `npm run db:migrate` 를 돌린다(구현자는 돌리지 않는다).
