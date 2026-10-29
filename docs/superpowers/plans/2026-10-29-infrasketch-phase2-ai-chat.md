# InfraSketch 2단계: AI 대화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대화 탭에서 "결제·카카오 로그인 붙는 쇼핑몰" 처럼 말하면 Qwen 이 구성도 변경 명령을 스트리밍하고, 캔버스에 노드가 하나씩 나타나며, 진행 상황·가정 목록·요약이 대화창에 보이고, 응답 1회가 버전 1개(중단 시 "중단됨")로 저장된다. `@노드` 참조로 특정 노드를 고칠 수 있고, Clef-Flash 가 요청 의도를 먼저 분류한다.

**Architecture:** 서버 쪽 `runChatTurn` 이 한 번의 대화 차례를 처리한다(의도 분류 → 프롬프트 → Qwen JSON Lines 스트림 → 줄마다 `applyCommand` → 이벤트 방출 → 버전·메시지 저장). Next.js Route Handler 가 이 이벤트를 NDJSON 스트림으로 브라우저에 보내고, 브라우저는 같은 `applyCommand` 로 자기 상태에 즉시 반영해 1단계 캔버스의 등장 애니메이션을 그대로 쓴다. LLM·Clef·DB 의존성은 주입 가능한 인터페이스로 분리해 가짜로 테스트한다.

**Tech Stack:** 1단계 스택 + `openai` npm SDK(Qwen, OpenAI 호환) + `fetch`(Clef `/v1/systemone`). Playwright E2E 는 가짜 Qwen·Clef HTTP 서버로 돌린다.

**Spec:** `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md` — 이번 범위: §4.3, §4.4, §4.5, §4.5.1, §4.6(요청 의도 분류만), §9(메시지·버전 연결·되돌림 메시지·중단), §10.3, §10.4, §12. 스파이크 원자료: `docs/superpowers/spike/spike.mjs`(검증된 시스템 프롬프트·스트림 파서), `docs/superpowers/spike/spike-results.json`.

## Global Constraints

- 1단계 계획의 Global Constraints 전부 유지(한국어 UI, 토큰 색만, 강조색 용도 제한, 구조 변경은 `applyCommand` 로만, LLM 은 좌표를 정하지 않음, 소유자만 접근).
- 생성 모델: `qwen3.8-flash-next`, OpenAI 호환 `POST {QWEN_API_URL}/chat/completions`, `Authorization: Bearer QWEN_CODER_KEY`, `stream: true`, `temperature: 0.3`, `max_tokens: 16000`, 요청 본문 최상위 `chat_template_kwargs: { enable_thinking: false }`.
- 전달 방식은 **JSON Lines 고정**(스파이크 결론). tool calling 경로는 만들지 않는다.
- Qwen 방어: 429·503·5xx → 2초 → 4초 → 8초 최대 3회 재시도(스트림 시작 전에만), `<think>…</think>` 제거(청크 경계 포함), ```` ``` ```` 코드 펜스 줄 무시, 빈 응답이면 1회 재호출.
- `QWEN_API_URL` 정규화: 끝의 `/chat/completions`·`/` 제거, 스킴이 없으면 `http://` 붙임(§12.3).
- Clef: `POST {CLEF_API_URL}/v1/systemone`, `model: "Cloudflare/clef-flash"`, `choice` 질문의 선택지는 `criteria` 객체(`options` 키 금지), 타임아웃 30초, 429 → 1초부터·502/503/504 → 5·15·45초 최대 3회, 동시 호출 상한 `CLEF_MAX_CONCURRENCY`(기본 2), **서버에서만** 호출.
- 의도 분류 확신도 0.6 미만이거나 Clef 실패·키 없음 → 일반 경로(구조 변경 프롬프트, 질문이면 `say` 로만 답함). Clef 가 멈춰도 대화는 멈추지 않는다.
- 키·주소는 `.env` 에서만, 키는 로그·응답·브라우저에 절대 노출하지 않는다.
- 한 구성도에서 동시에 한 차례만 처리. 겹치면 409 와 "다른 응답을 처리하고 있어요. 끝난 뒤 다시 보내 주세요."
- 응답 1회 = 버전 1개(source `ai`). 적용된 명령이 0개면 버전을 만들지 않는다. 중단·오류로 끊기면 적용분까지 `status: "aborted"` 버전.
- 확정된 가정(`confirmed: true`)은 AI 가 바꾸지 못한다(1단계 `applyCommand` 가 이미 거부).

## Review Focus

1. **사용자가 응답 도중 "중단"하거나 탭을 닫음** → 적용분이 "중단됨" 버전으로 남고, 구성도 잠금이 풀려 다음 메시지를 바로 보낼 수 있다. → Task 7 `abort mid-stream saves aborted version and releases lock`, Task 8 `client disconnect aborts the turn`.
2. **LLM 이 깨진 줄·없는 id·허용 밖 kind 를 섞어 냄** → 그 줄만 건너뛰고 차례는 계속, 끝에 "적용 N · 건너뜀 M" 표시. → Task 7 `bad lines are skipped and counted`.
3. **두 탭에서 동시에 보냄** → 두 번째는 409 와 안내 문구, 첫 번째는 정상 완료. → Task 7 `second concurrent turn is rejected`.
4. **AI 서버가 꺼졌거나 키가 없음** → 대화 탭에 "AI 서버에 연결할 수 없어요. 잠시 뒤 다시 시도하거나 관리자에게 문의해 주세요." 가 뜨고 나머지 화면은 정상. → Task 1 `health reports missing key`, Task 10 `health banner shows when AI is down`.
5. **대화가 아주 길어짐** → 프롬프트에는 최근 메시지 20개만, 현재 구성도 요약은 항상 포함. → Task 5 `history is truncated to last 20 but state summary always present`.

---

## 파일 구조

```
src/
  env.ts                              (수정) Qwen·Clef 변수 추가(선택값)
  server/llm/
    config.ts                         normalizeQwenBaseUrl, llmConfig()
    jsonl.ts                          createJsonlParser (think·펜스·청크 경계)
    qwen.ts                           createQwenClient → streamCompletion
    clef.ts                           createClefClient → decide, classifyIntent
    health.ts                         checkLlmHealth
  server/chat/
    prompt.ts                         SYSTEM_PROMPT, summarizeState, buildMessages, parseMentions
    messages.ts                       createMessage, listMessages, addSystemMessage
    lock.ts                           withDiagramLock (pg advisory lock, 비차단)
    pipeline.ts                       runChatTurn (의존성 주입)
    events.ts                         ChatEvent 타입(서버·클라이언트 공용)
  domain/assumptions.ts               ASSUMPTION_CHOICES, confirmAssumption
  db/schema.ts                        (수정) messages 테이블, diagramVersions.messageId
  app/api/diagrams/[id]/chat/route.ts POST → NDJSON 스트림
  app/api/llm/health/route.ts         GET → 상태
  app/(app)/actions.ts                (수정) restore 시 시스템 메시지, confirmAssumptionAction, listMessagesAction
  ui/chat/
    useChatTurn.ts                    NDJSON 수신·중단·이벤트 처리
    ChatPanel.tsx                     메시지 목록·진행 줄·입력·중단·요약·배너
    MentionInput.tsx                  @참조 칩 입력
    AssumptionChips.tsx               가정 칩·대안·확정
  ui/RightPanel.tsx, ui/DiagramWorkspace.tsx, canvas/Canvas.tsx, ui/NodeInfo.tsx  (수정)
tests/
  unit/…  integration/…  e2e/phase2.spec.ts, e2e/fake-llm.ts
scripts/smoke-llm.ts                  실제 Qwen·Clef 로 1회 수동 점검(CI 제외)
```

---

### Task 1: 환경변수, URL 정규화, AI 상태 점검

**Files:**
- Modify: `src/env.ts`, `.env.example`, `README.md`(AI 변수 절)
- Create: `src/server/llm/config.ts`, `src/server/llm/health.ts`, `src/app/api/llm/health/route.ts`
- Test: `tests/unit/llm-config.test.ts`, `tests/unit/llm-health.test.ts`

**Interfaces:**
- Produces (`env.ts`): 선택값 `QWEN_CODER_KEY?`, `QWEN_MODEL`(기본 `"qwen3.8-flash-next"`), `QWEN_API_URL?`, `CLEF_API_KEY?`, `CLEF_API_URL`(기본 `"http://192.168.102.105:30000"`), `CLEF_MAX_CONCURRENCY`(정수, 기본 2). 없어도 앱은 뜬다.
- Produces (`config.ts`): `normalizeQwenBaseUrl(raw: string): string`; `llmConfig(): { qwen: { baseUrl: string; key: string; model: string } | null; clef: { url: string; key: string; maxConcurrency: number } | null }` — 키나 주소가 없으면 해당 항목 `null`.
- Produces (`health.ts`): `checkLlmHealth(deps?: { fetch?: typeof fetch }): Promise<{ qwen: "ok" | "missing" | "down"; clef: "ok" | "missing" | "down" }>` — Qwen `GET {baseUrl}/models`(키 헤더, 5초 타임아웃, 200 이고 `data[].id` 에 모델 포함이면 ok), Clef `GET {url}/health`(키 불필요). 결과는 60초 메모리 캐시.
- Produces (route): `GET /api/llm/health` → 로그인 필요, 위 객체를 JSON 으로. 키·주소는 응답에 넣지 않는다.

- [ ] **Step 1: Write the failing tests**

```ts
test.each([
  ["192.168.102.107:8000/v1/chat/completions", "http://192.168.102.107:8000/v1"],
  ["https://open-llm.cudo.co.kr:8877/v1/", "https://open-llm.cudo.co.kr:8877/v1"],
  ["http://192.168.102.105:8000/v1", "http://192.168.102.105:8000/v1"],
])("normalizes %s", (raw, out) => expect(normalizeQwenBaseUrl(raw)).toBe(out));
test("missing key → qwen null, app still parses env", () => { /* parseEnv 에 QWEN_* 없이 → 통과, llmConfig().qwen === null */ });
test("health reports missing key", async () => { /* qwen null → "missing", clef fetch 200 → "ok" */ });
test("health reports down when /models times out or model absent", async () => { /* fetch mock */ });
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. README 에 AI 변수(키는 `.env` 에만, 내부망/외부 URL 예시) 추가. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: AI 환경변수·URL 정규화·상태 점검`

---

### Task 2: JSON Lines 스트림 파서

**Files:**
- Create: `src/server/llm/jsonl.ts`
- Test: `tests/unit/jsonl.test.ts`

**Interfaces:**
- Produces: `createJsonlParser(onLine: (value: unknown) => void, onBadLine: (text: string) => void): { push(chunk: string): void; end(): void }` — 청크를 받아 줄 단위로 끊고, `<think>…</think>` 는 청크 경계를 넘어도 제거(열린 채 끝나면 그 뒤는 버림), ```` ``` ```` 로 시작하는 줄은 무시, 빈 줄 무시, `JSON.parse` 실패한 줄은 `onBadLine`(앞 160자). `end()` 는 남은 버퍼를 한 줄로 처리.

- [ ] **Step 1: Write the failing tests**

```ts
test("splits across chunk boundaries", () => { /* push('{"op":"say","te'), push('xt":"a"}\n{"op"'), push(':"say","text":"b"}'), end() → 2 values */ });
test("think block spanning chunks is removed", () => { /* "<thi" "nk>x\ny</think>{...}\n" → 1 value, 0 bad */ });
test("code fences are ignored", () => { /* "```jsonl\n{...}\n```\n" → 1 value, 0 bad */ });
test("bad line reported with first 160 chars", () => {});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. **Step 5: Commit** `feat: JSON Lines 스트림 파서`

---

### Task 3: Qwen 클라이언트

**Files:**
- Create: `src/server/llm/qwen.ts`
- Modify: `package.json`(`openai`)
- Test: `tests/unit/qwen.test.ts`

**Interfaces:**
- Consumes: `llmConfig().qwen` (Task 1)
- Produces:

```ts
export interface ChatMessage { role: "system" | "user" | "assistant"; content: string }
export interface QwenClient {
  streamCompletion(messages: ChatMessage[], opts: { signal: AbortSignal; onDelta(text: string): void }): Promise<{ text: string; finishReason: string | null }>;
}
export function createQwenClient(cfg: { baseUrl: string; key: string; model: string }, deps?: { fetch?: typeof fetch; sleep?: (ms: number) => Promise<void> }): QwenClient;
```

  `openai` SDK 를 `baseURL`·`apiKey`·`fetch`(주입) 로 만들고, 요청에 Global Constraints 의 파라미터를 그대로 넣는다(`chat_template_kwargs` 는 본문 최상위 — SDK 에 알 수 없는 필드로 넘김). 재시도는 응답 헤더를 받기 전 실패에만(429·503·5xx·연결 오류), 대기 2000/4000/8000ms. 스트림이 끝났는데 누적 텍스트가 공백뿐이면 1회 재호출. `signal` 중단 시 즉시 `AbortError` 를 던진다.

- [ ] **Step 1: Write the failing tests** (가짜 `fetch` 가 SSE 본문을 돌려줌)

```ts
test("sends model, stream, temperature 0.3, max_tokens 16000 and chat_template_kwargs at top level", async () => { /* 기록된 요청 본문 검사 */ });
test("retries 503 twice then succeeds; waits 2000 then 4000", async () => { /* sleep 기록 */ });
test("gives up after 3 retries with the last status", async () => {});
test("empty completion is retried once", async () => {});
test("abort stops streaming and rejects with AbortError", async () => {});
test("onDelta receives content deltas in order", async () => {});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. **Step 5: Commit** `feat: Qwen 스트리밍 클라이언트(재시도·빈 응답 재호출)`

---

### Task 4: Clef 클라이언트와 의도 분류

**Files:**
- Create: `src/server/llm/clef.ts`
- Test: `tests/unit/clef.test.ts`

**Interfaces:**
- Consumes: `llmConfig().clef`
- Produces:

```ts
export type Intent = "structure_change" | "question" | "missing_info_answer" | "history" | "other";
export interface ClefClient {
  decide(state: unknown, questions: Record<string, unknown>, signal?: AbortSignal): Promise<Record<string, any>>; // answers
  classifyIntent(input: string, context: { lastAssistant?: string }): Promise<{ intent: Intent; confidence: number } | null>; // 실패·키 없음 → null
}
export function createClefClient(cfg: { url: string; key: string; maxConcurrency: number } | null, deps?: { fetch?: typeof fetch; sleep?: (ms: number) => Promise<void> }): ClefClient;
export const INTENT_MIN_CONFIDENCE = 0.6;
```

  `classifyIntent` 질문(스파이크에서 8건 중 7건 정답이던 문구 그대로): `{ intent: { type: "choice", instructions: "인프라 구성도 도구에서 사용자가 입력한 문장의 의도", criteria: { structure_change: "구성도에 노드/연결/영역을 추가·삭제·수정해 달라는 요청", question: "용어·구성에 대한 질문이나 설명 요청", missing_info_answer: "IP·스펙·hostname 같은 빠진 정보에 대한 답", history: "이전 버전으로 되돌리기나 변경 이력 요청", other: "그 밖의 대화" } } }`. `state` 는 `직전 AI 메시지: <lastAssistant 앞 300자>\n사용자: <input>`(§12.2 — 맥락이 있어야 "10.0.2.11" 같은 답을 맞춤). 동시 호출은 세마포어로 `maxConcurrency` 이하. 재시도·타임아웃은 Global Constraints.

- [ ] **Step 1: Write the failing tests**

```ts
test("posts model, state with last assistant context, criteria (not options)", async () => {});
test("returns intent and confidence from answers.intent", async () => {});
test("429 retries after 1000ms; 503 after 5000 then 15000", async () => {});
test("returns null when cfg is null, on timeout, or after retries exhausted", async () => {});
test("never more than maxConcurrency requests in flight", async () => { /* 5개 동시 호출, 동시 진행 수 기록 ≤ 2 */ });
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. **Step 5: Commit** `feat: Clef 판정 클라이언트와 요청 의도 분류`

---

### Task 5: 프롬프트와 참조 해석

**Files:**
- Create: `src/server/chat/prompt.ts`
- Test: `tests/unit/prompt.test.ts`

**Interfaces:**
- Consumes: `NODE_KINDS`, `GROUP_KINDS`, `EDGE_KINDS`(catalog), `DiagramState`, `ChatMessage`(Task 3), `Intent`(Task 4)
- Produces:

```ts
export const SYSTEM_PROMPT: string;        // 구조 변경용
export const ANSWER_PROMPT: string;        // 질문·기타 답변용(글만, 명령 없음)
export function summarizeState(state: DiagramState): string;
export interface Mention { id: string; label: string }
export function parseMentions(text: string, state: DiagramState): { clean: string; mentions: Mention[] };
export function buildMessages(input: {
  intent: Intent | null; text: string; state: DiagramState; mentions: Mention[];
  history: { role: "user" | "assistant"; content: string }[];
}): ChatMessage[];
export const HISTORY_LIMIT = 20;
```

  - `SYSTEM_PROMPT` 는 `docs/superpowers/spike/spike.mjs` 의 `SYSTEM` 문자열(2차 규칙 포함 — 한국어 표시 문구, external_service 는 타사만, Kafka=stream/SQS=queue, CDN·WAF 는 VPC 밖, 사용자 진입 연결 필수)을 바탕으로 하되 현재 스키마에 맞춘다: `redundancy_pair`→`redundancy_group`(2대 이상), `az` 그룹 금지(AZ 는 `attrs.az`), edge_kind 는 `request|async|replication|aux`(모니터링·관리 연결은 `aux`), `warn`·`report_missing` 명령은 내지 않는다(3단계), id 규칙 `^[a-z0-9][a-z0-9-]{0,63}$` 이고 노드·그룹·연결 id 는 서로 겹치지 않는다, 확정된 가정은 바꾸지 않는다, 질문이면 명령 없이 `say` 로 1~2문장만 답한다, 허용값 목록은 catalog 에서 생성.
  - `summarizeState`: 스파이크 `summarizeState` 와 같은 줄 형식(그룹/노드/연결) + `가정 <key>=<value> (확정|미확정)` 줄.
  - `parseMentions`: 입력 안의 `@[라벨](node:<id>)` 토큰을 찾아 `clean` 에서는 `@라벨` 로 바꾸고, 상태에 있는 id 만 `mentions` 에 담는다(그룹 id 도 허용).
  - `buildMessages`: `[system, ...history(최근 HISTORY_LIMIT 개), user]`. user 내용 = `현재 구성:\n<summary>\n\n참조 노드:\n<id 라벨 목록>\n\n요청: <clean>`. 의도가 `question`·`other` 면 `ANSWER_PROMPT`, 그 외(null 포함) `SYSTEM_PROMPT`.

- [ ] **Step 1: Write the failing tests**

```ts
test("system prompt lists every catalog kind and no redundancy_pair/az", () => {});
test("mentions resolve to known ids only", () => { /* "@[WAS#1](node:was-1) 와 @[X](node:ghost)" → mentions [was-1], clean "@WAS#1 와 @X" */ });
test("history is truncated to last 20 but state summary always present", () => { /* 30개 history → messages 길이 22, 마지막 user 에 summary */ });
test("question intent uses ANSWER_PROMPT; null intent uses SYSTEM_PROMPT", () => {});
test("summary marks confirmed assumptions", () => {});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. **Step 5: Commit** `feat: 구성도 프롬프트·상태 요약·노드 참조 해석`

---

### Task 6: 메시지 저장과 버전 연결

**Files:**
- Modify: `src/db/schema.ts`, `src/server/versions.ts`, `src/app/(app)/actions.ts`(`restoreVersionAction`, `listMessagesAction`)
- Create: `src/db/migrations/*`(drizzle-kit), `src/server/chat/messages.ts`, `src/server/chat/events.ts`(이 Task 에서는 `MessageMeta` 만)
- Test: `tests/integration/messages.test.ts`

**Interfaces:**
- Produces (schema): `messages(id uuid pk, diagramId fk→diagrams cascade, role text not null /* user|assistant|system */, content text not null, meta jsonb not null default '{}', createdAt)` + 인덱스 `(diagram_id, created_at)`; `diagramVersions.messageId uuid null fk→messages set null`.
- Produces (`versions.ts`): `CreateVersionOpts` 에 `messageId?: string` 추가.
- Produces (`messages.ts`):

```ts
export type MessageRole = "user" | "assistant" | "system";
// MessageMeta 타입은 클라이언트도 쓰므로 src/server/chat/events.ts 에 정의하고 여기서 import 한다(Task 7 에서 events.ts 를 만들기 전이면 Task 6 에서 먼저 만든다)
export function createMessage(diagramId: string, role: MessageRole, content: string, meta?: MessageMeta): Promise<{ id: string; createdAt: Date }>;
export function listMessages(diagramId: string, limit?: number /* 기본 100, 오래된 순 */): Promise<{ id: string; role: MessageRole; content: string; meta: MessageMeta; createdAt: Date }[]>;
```

- `restoreVersionAction` 은 되돌린 뒤 시스템 메시지 `"v<원래 번호>로 되돌림 (새 버전 v<새 번호>)"` 를 남긴다(§9). `listMessagesAction(diagramId)` 은 소유권 확인 후 `listMessages`.

- [ ] **Step 1: Write the failing tests**

```ts
test("messages are listed oldest first and limited", async () => {});
test("version can link to the message that produced it; deleting the message keeps the version", async () => {});
test("restore adds a system message", async () => { /* restoreVersionAction 대신 그 내부 함수를 직접: 메시지 내용 "v1로 되돌림 (새 버전 v3)" */ });
test("other user's diagram messages are not found", async () => {});
```

- [ ] **Step 2:** `docker compose up -d db_test && npm run test:int -- messages` → FAIL. **Step 3:** 스키마·마이그레이션·구현. **Step 4:** PASS(기존 통합 테스트 포함). **Step 5: Commit** `feat: 대화 메시지 저장과 버전 연결`

---

### Task 7: 대화 차례 파이프라인

**Files:**
- Create: `src/server/chat/events.ts`, `src/server/chat/lock.ts`, `src/server/chat/pipeline.ts`
- Test: `tests/integration/pipeline.test.ts`

**Interfaces:**
- Consumes: Task 2~6 전부, `applyCommand`·`parseCommand`(domain), `getLatestState`·`createVersion`(versions), `getOwnedDiagram`(projects)
- Produces (`events.ts`, 클라이언트도 import — 서버 전용 모듈 import 금지. Task 6 이 먼저 만든 `MessageMeta` 도 여기 있다):

```ts
export interface MessageMeta { intent?: string; applied?: number; skipped?: number; version?: number | null; status?: "complete" | "aborted" | "error"; mentions?: string[]; says?: string[] }
export type ChatEvent =
  | { t: "start"; messageId: string; intent: string | null }
  | { t: "status"; phase: "thinking" | "drawing" | "answering" }
  | { t: "say"; text: string }
  | { t: "cmd"; cmd: Command }                      // 서버에서 적용 성공한 명령만
  | { t: "skip"; reason: string }                   // 깨진 줄·거부된 명령
  | { t: "answer"; delta: string }                  // 질문 답변 글(ANSWER_PROMPT)
  | { t: "open_history" }
  | { t: "done"; version: number | null; status: "complete" | "aborted"; applied: number; skipped: number; nodes: number; edges: number; assistantMessageId: string }
  | { t: "error"; message: string };
```

- Produces (`lock.ts`): `withDiagramLock<T>(diagramId: string, fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }>` — 전용 DB 연결에서 `pg_try_advisory_lock(hashtext('chat:'||id))`, `finally` 에서 반드시 unlock.
- Produces (`pipeline.ts`):

```ts
export interface ChatDeps { qwen: QwenClient | null; clef: ClefClient }
export function runChatTurn(args: { userId: string; diagramId: string; text: string; signal: AbortSignal; emit(e: ChatEvent): void }, deps: ChatDeps): Promise<void>;
```

  순서: 소유권 확인(`NotFoundError` 는 그대로 던짐) → 잠금(실패 시 `emit error "다른 응답을 처리하고 있어요. 끝난 뒤 다시 보내 주세요."` 후 종료, 호출자가 409 로 바꿈) → 최신 상태·최근 메시지 로드 → 사용자 메시지 저장(meta.mentions) → `qwen` 이 null 이면 `error "AI 서버에 연결할 수 없어요. 잠시 뒤 다시 시도하거나 관리자에게 문의해 주세요."` → `classifyIntent`(직전 assistant 메시지 맥락) → `history` 면 고정 답 `"변경 이력은 오른쪽 '이력' 탭에서 보고 되돌릴 수 있어요."` + `open_history`, 버전 없음 → 그 외 `buildMessages` → `status thinking` → `streamCompletion`: 구조 경로는 `createJsonlParser` 로 줄마다 — `op: "say"` → `say`; `parseCommand` 성공·`applyCommand` 성공 → 상태 갱신 + `cmd`(첫 cmd 에서 `status drawing`); 그 외 → `skip`. 답변 경로는 델타를 그대로 `answer`(첫 델타에서 `status answering`). → 끝: 적용 ≥1 이면 `createVersion(source "ai", status, messageId=사용자 메시지 id)`; assistant 메시지 저장(content = say 들을 줄바꿈으로 + 답변 글, meta {intent, applied, skipped, version, status}) → `done`. `signal` 중단이면 status `aborted`, 그 외 예외면 적용분은 `aborted` 버전으로 남기고 `error` 후 `done`. 차례 전체 상한 120초(넘으면 중단 처리).

- [ ] **Step 1: Write the failing tests** (실제 DB, 가짜 qwen/clef)

```ts
test("structure turn streams cmds, saves one ai version linked to the user message", async () => {
  // fake qwen 이 spike s2 의 명령 줄을 몇 청크로 나눠 돌려줌 → events 에 cmd 들, done.version === 2, 버전 messageId === start.messageId
});
test("bad lines are skipped and counted", async () => { /* 깨진 JSON 1, 없는 parent 1 → skip 2, done.skipped 2, 나머지 적용 */ });
test("zero applied commands creates no version", async () => {});
test("abort mid-stream saves aborted version and releases lock", async () => { /* 3번째 cmd 후 abort → done.status aborted, 버전 status aborted, 곧바로 두 번째 차례 성공 */ });
test("second concurrent turn is rejected", async () => { /* 첫 차례 진행 중 두 번째 → error 이벤트(문구 일치), 첫 차례 정상 done */ });
test("low-confidence or failed intent falls back to SYSTEM_PROMPT path", async () => {});
test("question intent streams answer deltas and creates no version", async () => {});
test("history intent replies fixed text and open_history", async () => {});
test("confirmed assumption change from the model is skipped", async () => {});
test("missing qwen config emits the AI-unavailable error", async () => {});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. **Step 5: Commit** `feat: 대화 차례 파이프라인(의도 분류·스트림 적용·버전·중단)`

---

### Task 8: 스트리밍 API

**Files:**
- Create: `src/app/api/diagrams/[id]/chat/route.ts`
- Test: `tests/integration/chat-route.test.ts`

**Interfaces:**
- Consumes: `runChatTurn`, `createQwenClient`, `createClefClient`, `llmConfig`, `auth()`
- Produces: `POST /api/diagrams/:id/chat` 본문 `{ text: string }`(1~4000자, 아니면 400 `{error}`), 미로그인 401, 남의 구성도 404, 잠금 실패 409, 그 외 200 `Content-Type: application/x-ndjson; charset=utf-8` 으로 `ChatEvent` 한 줄씩. `request.signal` 을 `runChatTurn` 에 넘겨 브라우저 연결이 끊기면 차례가 중단된다. 응답 헤더 `Cache-Control: no-store`, `X-Accel-Buffering: no`. `export const runtime = "nodejs"`, `dynamic = "force-dynamic"`.
- 의존성 생성은 `src/server/chat/deps.ts` 의 `defaultChatDeps(): ChatDeps` 한 곳(테스트에서 바꿔 끼울 수 있게 `setChatDepsForTest` 도 export — `NODE_ENV === "test"` 에서만 동작).

- [ ] **Step 1: Write the failing tests** (route 의 `POST` 를 직접 호출, `auth` 는 vi.mock)

```ts
test("streams ndjson events in order and ends with done", async () => {});
test("401 without session, 404 for another user's diagram, 400 for empty text", async () => {});
test("409 when a turn is already running", async () => {});
test("client disconnect aborts the turn", async () => { /* AbortController 로 request 생성, 첫 cmd 후 abort → 버전 status aborted */ });
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. **Step 5: Commit** `feat: 대화 스트리밍 API`

---

### Task 9: 클라이언트 대화 훅과 실시간 반영

**Files:**
- Create: `src/ui/chat/useChatTurn.ts`
- Modify: `src/ui/DiagramWorkspace.tsx`
- Test: `tests/unit/useChatTurn.test.tsx`

**Interfaces:**
- Consumes: `ChatEvent`(Task 7), `applyCommand`
- Produces:

```ts
export interface ChatLine { kind: "user" | "assistant" | "system" | "progress" | "error"; text: string; meta?: MessageMeta }
export function useChatTurn(args: {
  diagramId: string; initial: ChatLine[];
  onCommand(cmd: Command): void; onDone(e: Extract<ChatEvent, { t: "done" }>): void; onOpenHistory(): void;
}): { lines: ChatLine[]; busy: boolean; phase: "thinking" | "drawing" | "answering" | null; send(text: string): Promise<void>; stop(): void };
```

  `send` 는 `fetch` POST 후 `response.body` 를 줄 단위로 읽어 `ChatEvent` 처리: `say` → progress 줄 추가, `answer` → 현재 assistant 줄에 이어 붙임, `cmd` → `onCommand`, `skip` 은 개수만 셈, `done` → 요약 줄 `"노드 N · 연결 M · 적용 A · 건너뜀 S"`(중단이면 앞에 `"중단됨 · "`) + `onDone`, `error`/409/네트워크 오류 → error 줄(서버 문구 그대로, 없으면 "응답을 받지 못했어요. 다시 시도해 주세요."). `stop()` 은 `AbortController.abort()`.
- `DiagramWorkspace`: live 모드에서만 대화 가능. `onCommand` 는 `setCurrent(s => applyCommand(s.state, cmd).state)` 로 즉시 반영(1단계 `useDiagramView` 가 등장·수정 표시를 처리). `onDone` 에서 `router.refresh()` 로 서버 최신 버전을 다시 받고 이력 목록 갱신. 대화 중에는 이력 보기·비교·편집 모드·샘플 불러오기를 막는다.

- [ ] **Step 1: Write the failing tests** (가짜 `fetch` 가 NDJSON 스트림 반환)

```ts
test("cmd events are forwarded in order and say lines appear as progress", async () => {});
test("done adds the summary line and calls onDone", async () => {});
test("409 shows the server message as an error line", async () => {});
test("stop aborts the request and busy becomes false", async () => {});
test("events split across chunks are parsed", async () => {});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. **Step 5: Commit** `feat: 대화 스트림 수신과 캔버스 실시간 반영`

---

### Task 10: 대화 탭 화면

**Files:**
- Create: `src/ui/chat/ChatPanel.tsx`, `src/ui/chat/MentionInput.tsx`, `src/ui/chat/chat.module.css`
- Modify: `src/ui/RightPanel.tsx`(대화 탭 = ChatPanel, 샘플 목록은 빈 구성도일 때 ChatPanel 아래 "또는 샘플로 시작하기"로 유지), `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`(초기 메시지 로드)
- Test: `tests/unit/ChatPanel.test.tsx`, `tests/unit/MentionInput.test.tsx`

**Interfaces:**
- Consumes: `useChatTurn`(Task 9), `GET /api/llm/health`
- Produces: `ChatPanel(props: { lines; busy; phase; onSend(text: string): void; onStop(): void; health: { qwen; clef } | null; disabledReason?: string; mentionRef: React.RefObject<MentionInputHandle> })`; `MentionInput` 은 `forwardRef<MentionInputHandle>` — `insertMention(m: { id: string; label: string }): void`, 내부 값은 칩으로 보이고 전송 문자열은 `@[라벨](node:<id>)` 토큰으로 직렬화. Enter 전송, Shift+Enter 줄바꿈, 빈 입력·busy 일 때 전송 막음.
- 문구: 입력 자리표시 `"만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요."`, 전송 버튼 `"보내기"`, 중단 버튼 `"중단"`, 진행 표시 `thinking → "구성 검토 중…"`, `drawing → "그리는 중…"`, `answering → "답변 작성 중…"`, AI 불가 배너 `"AI 서버에 연결할 수 없어요. 잠시 뒤 다시 시도하거나 관리자에게 문의해 주세요."`(health 에서 qwen 이 ok 가 아니면), `disabledReason` 예: `"이전 버전을 보는 중에는 대화할 수 없어요."`. 메시지 목록은 새 줄이 오면 맨 아래로 스크롤(사용자가 위로 올려 둔 경우 제외). 색은 토큰만, 강조색 쓰지 않음.

- [ ] **Step 1: Write the failing tests**

```tsx
test("health banner shows when AI is down", () => {});
test("send is disabled while busy and stop is shown", () => {});
test("progress label follows phase", () => {});
test("insertMention adds a chip and serializes to @[label](node:id)", async () => {});
test("Enter sends, Shift+Enter inserts newline", async () => {});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. `npm run build` 성공. **Step 5: Commit** `feat: 대화 탭 화면과 노드 참조 입력`

---

### Task 11: 캔버스·설명에서 노드 참조 붙이기

**Files:**
- Modify: `src/canvas/Canvas.tsx`(`onNodeContextMenu`), `src/ui/NodeInfo.tsx`, `src/ui/DiagramWorkspace.tsx`
- Create: `src/canvas/NodeMenu.tsx`
- Test: `tests/unit/NodeMenu.test.tsx`, `tests/unit/NodeInfo.test.tsx`(추가)

**Interfaces:**
- Consumes: `MentionInputHandle.insertMention`(Task 10)
- Produces: `CanvasProps.onMention?(id: string): void` — 노드·영역 우클릭 시 작은 메뉴(`NodeMenu`, 항목 `"대화에 참조 붙이기"`), 선택하면 `onMention(id)`. `NodeInfo` 에 버튼 `"노드 링크 복사"`(설명 탭 → 대화 탭으로 전환 + 참조 삽입). `DiagramWorkspace` 가 `onMention` 에서 대화 탭을 열고 `insertMention({id, label})`. 메뉴는 Esc·바깥 클릭으로 닫힘, 키보드로 항목 선택 가능.

- [ ] **Step 1: Write the failing tests**

```tsx
test("context menu item calls onMention with the node id", async () => {});
test("NodeInfo copy-link button calls onMention", async () => {});
test("Escape closes the menu", async () => {});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. **Step 5: Commit** `feat: 노드 우클릭·링크 복사로 대화 참조 붙이기`

---

### Task 12: 가정 칩

**Files:**
- Create: `src/domain/assumptions.ts`, `src/ui/chat/AssumptionChips.tsx`
- Modify: `src/app/(app)/actions.ts`(`confirmAssumptionAction`), `src/ui/chat/ChatPanel.tsx`(칩 영역), `src/server/chat/pipeline.ts`(확정 메시지 처리)
- Test: `tests/unit/assumptions.test.ts`, `tests/unit/AssumptionChips.test.tsx`, `tests/integration/assumption.test.ts`

**Interfaces:**
- Produces (`assumptions.ts`):

```ts
export const ASSUMPTION_LABELS: Record<string, string>; // environment "환경", scale "규모", redundancy "이중화", deploy "배포 방식", replication "데이터 복제", external "외부 연동"
export const ASSUMPTION_CHOICES: Record<string, string[]>;
// environment: ["클라우드(AWS)","클라우드(기타)","사내 IDC","하이브리드"]
// scale: ["소규모(일 1천 명 이하)","중규모(일 1만 명)","대규모(일 10만 명 이상)"]
// redundancy: ["이중화 없음","핵심 구간 이중화","전 구간 이중화"]
// deploy: ["VM","컨테이너","Kubernetes","서버리스"]
// replication: ["복제 없음","비동기 복제","동기 복제"]
// external: ["외부 연동 없음","외부 연동 있음"]
export function confirmAssumption(state: DiagramState, key: string, value: string): DiagramState; // confirmed: true 로 설정(새 키도 허용), 불변
```

- `confirmAssumptionAction(diagramId, key, value): Promise<ActionResult<{ number: number }>>` — 소유권 확인, key 는 `/^[a-z_]{1,32}$/`, value 1~80자, 최신 상태에 `confirmAssumption` 적용 → 버전(source `form`).
- `AssumptionChips(props: { assumptions: Record<string, Assumption>; busy: boolean; onChoose(key: string, value: string): void; onConfirm(key: string): void })` — 대화 탭 상단 칩 `"<라벨>: <값>"`(확정이면 `"확정"` 표시와 굵은 글씨, 강조색 아님). 칩을 누르면 대안 목록(현재 값 포함 시 표시) + `"이대로 확정"` 버튼. 대안 선택 = `onChoose` → 워크스페이스가 먼저 `confirmAssumptionAction(key, value)` 로 확정해 저장한 뒤, 대화로 `"가정 변경: <라벨> → <값>. 이 가정에 맞게 구성을 조정해 줘."` 를 보낸다(확정 가정은 모델이 못 바꾸므로 조정만 한다).

- [ ] **Step 1: Write the failing tests**

```ts
test("confirmAssumption sets confirmed and does not mutate input", () => {});
test("choices exist for every label key", () => {});
```
```tsx
test("chip shows value and opens choices; choosing calls onChoose", async () => {});
test("confirmed chip shows 확정", () => {});
```
```ts
test("confirmAssumptionAction creates a form version and the model cannot override it", async () => { /* 확정 후 가짜 qwen 이 같은 키 set_assumption → skip */ });
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. **Step 5: Commit** `feat: 가정 칩(대안 선택·확정)`

---

### Task 13: E2E (가짜 AI 서버)

**Files:**
- Create: `tests/e2e/fake-llm.ts`, `tests/e2e/phase2.spec.ts`
- Modify: `playwright.config.ts`(가짜 서버 기동, webServer env 에 `QWEN_API_URL`·`QWEN_CODER_KEY`·`CLEF_API_URL`·`CLEF_API_KEY` 를 가짜 주소·가짜 키로)

**Interfaces:**
- Produces (`fake-llm.ts`): 포트 3199 의 HTTP 서버 — `GET /v1/models` → `{data:[{id:"qwen3.8-flash-next"}]}`; `POST /v1/chat/completions` → 요청 마지막 user 내용에 `"쇼핑몰"` 이 있으면 spike s1 명령 줄들을, `"@"` 참조가 있으면 `update_node` 한 줄을, 그 외는 `say` 한 줄을 SSE 로 줄당 80ms 간격 전송; `POST /v1/systemone` → 의도 `structure_change` 0.95; `GET /health` → 200. 1초 지연 모드(`x-fake-slow`)로 중단 테스트 지원.

- [ ] **Step 1: Write the tests**

```ts
test("대화로 구성도 생성 → 노드가 하나씩 나타남 → 요약·버전", async ({ page }) => {
  // 가입 → 새 프로젝트 → 대화 입력 "결제랑 카카오 로그인 붙는 쇼핑몰" → 보내기
  // "구성 검토 중…" 또는 "그리는 중…" 보임 → 노드 수가 늘어나는 과정을 2회 이상 관찰(expect.poll 로 1 < n < 최종)
  // 최종 노드 수 === fixture s1 노드 수, 요약 줄 "노드 12 · 연결" 포함, 이력 탭 최신 출처 "AI"
});
test("노드 우클릭 참조 → 수정 반영", async ({ page }) => { /* WAS 노드 우클릭 → "대화에 참조 붙이기" → 칩 보임 → 보내기 → 노드 "방금 수정됨" 표시 */ });
test("중단하면 '중단됨' 버전이 남고 바로 다시 보낼 수 있음", async ({ page }) => {});
test("가정 칩에서 대안을 고르면 확정되고 대화가 이어짐", async ({ page }) => {});
```

- [ ] **Step 2:** `npm run test:e2e` → 누락 구현이 있으면 FAIL, 고친 뒤 PASS(2회 연속, 고정 대기 금지).
- [ ] **Step 3:** 전체 `npm test && npm run test:int && npm run test:e2e` PASS.
- [ ] **Step 4: Commit** `test: 2단계 E2E(가짜 AI 서버)`

---

### Task 14: 실제 AI 서버 점검 스크립트

**Files:**
- Create: `scripts/smoke-llm.ts`
- Modify: `package.json`(`"smoke:llm": "tsx scripts/smoke-llm.ts"`), `README.md`(사용법)

**Interfaces:**
- Consumes: `createQwenClient`, `createClefClient`, `buildMessages`, `createJsonlParser`, `applyCommands`, `llmConfig`
- Produces: `.env` 의 실제 키로 (1) `checkLlmHealth`, (2) spike 시나리오 s1·s2 프롬프트로 구조 생성 1회씩 — 첫 명령까지 시간·전체 시간·적용/건너뜀 수·노드/연결 수를 표로 출력, (3) Clef 의도 분류 스파이크 8문장 정답률 출력. 키는 출력하지 않는다. DB 를 쓰지 않는다. CI·`npm test` 에 포함하지 않는다.

- [ ] **Step 1:** 구현. **Step 2:** `npm run smoke:llm` 실행 — 결과 표를 커밋 메시지가 아닌 보고서에 남긴다(실패해도 원인만 보고, 코드 수정은 범위 밖). **Step 3: Commit** `chore: 실제 AI 서버 점검 스크립트`

---

## 3단계로 넘기는 것
- 노드 설명 생성·용어 사전·Clef 품질 검사, 빠진 정보 체크리스트·배지·"대화로 물어보기", 경고 규칙 + Clef `noul` 판정과 Qwen 의 경고 문구, 구성 패턴 라이브러리, `warn`·`report_missing` 명령.
- 1단계 최종 검토에서 미룬 화면 맞춤 타이밍(같은 노드 집합일 때 새 배치 후 맞춤)은 Task 9 의 `onDone` 반영과 함께 손보는 것을 권장(필수 아님).
