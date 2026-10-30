# InfraSketch 3B단계: 경고·구성 패턴 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI 대화가 구성을 바꾸면 차례가 끝나기 전에 위험한 구성을 찾는다. 찾는 방법은 두 가지다.
- 코드 규칙: DB 공개 구역 배치, 단일 장애점, 외부→내부 직접 접근, 원본 DB 없는 캐시
- Clef `noul` 판정: 저장소가 외부에서 직접 접근 가능한지

새로 생긴 경고는 아래처럼 보여 준다.
- Qwen 이 쓴 짧은 문구로 대화 끝에 "주의: …" 줄을 보여 준다.
- 노드에 "!" 배지를 붙인다(빠진 정보 숫자 배지 옆).
- 설명 패널 "주의할 점" 절에 문구·가이드와 "의도된 구성" 버튼을 둔다.

구성 패턴 9종은 생성 프롬프트의 기준 지식이자 경고 규칙의 근거로 쓴다.

**Architecture:**
- 규칙·패턴·병합은 순수 도메인 코드다.
  - `src/domain/patterns.ts`: 패턴 9종 데이터
  - `src/domain/warnings.ts`: 코드 규칙 평가, 저장된 경고와의 병합
- 서버 `src/server/chat/warnings.ts` 가 차례 끝 상태에 대해 세 단계를 돈다.
  1. 코드 규칙
  2. Clef 판정(최대 5건)
  3. 새 경고만 Qwen 문구 작성(실패 시 정해진 문구)
- 결과는 `DiagramState.warnings` 로 버전에 함께 저장한다.
- "의도된 구성"은 `DiagramState.ignoredWarnings` 로 상태에 저장한다. 3A 의 `unknown` 과 같은 방식이고, 누를 때마다 "직접 입력" 버전이 하나 생긴다.
- 화면은 코드 규칙을 즉시 다시 계산해 폼 저장·되돌리기에도 맞게 보여 준다. Clef 판정 경고는 마지막 저장 결과를 쓴다.

**Tech Stack:** 3A 스택 그대로. 새 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md` — 이번 범위는 아래와 같다.
- §7.1, §7.2
- §4.6 의 이상 구성 판정(`noul`)과 장애 시 대체 동작
- §12.1 약점 3(경고 판단은 코드+Clef, Qwen 은 문구만)
- §8.1 의 "구간 방화벽 필요 여부"(외부→내부 직접 접근 규칙으로 흡수)
- 2026-10-30 사용자 결정(아래 Global Constraints 첫 묶음)

## Global Constraints

- 2026-10-30 사용자 결정은 다음과 같다.
  - 경고는 **대화 차례가 끝날 때 서버에서** 계산한다.
  - "의도된 구성" 무시는 **구성도 상태에** 저장한다(버전과 함께 되돌려진다).
  - AI 의 `warn` 명령은 **쓰지 않는다**. SYSTEM_PROMPT 의 "warn 과 report_missing 명령은 내지 않는다" 줄을 유지한다.
  - 구성 패턴은 **프롬프트 지식 + 경고 기준**으로만 쓰고, 패턴 선택 화면은 만들지 않는다.
  - 노드 배지는 빠진 정보 숫자와 경고 "!" 를 **나란히** 둔다.
  - 경고는 **대화 끝 안내 + 설명 패널**에만 보이고, 전체 목록 화면은 없다.
- 1·2단계·3A Global Constraints 전부 유지한다.
  - 한국어 UI, CSS 변수 토큰만 쓴다. 경고 색은 `--state-warn` 이고 `--accent` 는 금지다.
  - 이모지·글로우·그라데이션·사이드 바 금지.
  - 구조 변경은 `applyCommand` 로만 한다.
  - 소유자만 접근한다.
  - 키는 출력하지 않는다.
  - 테스트에서 실제 AI 를 부르지 않는다.
  - 사용자 글(라벨)은 프롬프트·Clef state 에 넣을 때 `JSON.stringify` 로 감싸거나 공백을 접어 줄을 위조하지 못하게 한다.
- Clef 판정
  - 질문 형식: `{ type: "noul", instructions }`
  - 대상: 데이터 노드 중 코드 규칙 `db_public` 에 안 걸린 것, 차례당 최대 5건
  - 판정 기준: 확률 ≥ 0.8 이면 `level: "warn"`, 0.5 ≤ 확률 < 0.8 이면 `level: "check"`("확인해 보세요"), 그 아래는 경고 없음
  - Clef 실패·키 없음이면 판정을 건너뛰고 코드 규칙만 쓴다.
- Qwen 문구
  - 새 경고(직전 상태의 `warnings` 에 없던 id)만 한 번의 호출로 쓴다. 출력은 JSON Lines `{"id":"…","text":"…"}` 다.
  - `text` 는 1~80자 한국어 한 문장이다.
  - 형식이 틀리거나, 80자를 넘거나, 없는 id 이거나, 실패·8초 초과면 그 경고는 규칙의 정해진 문구(template)를 쓴다.
- 화면 문구는 아래를 그대로 쓴다.
  - 상태: `위험 요소 점검 중…`
  - 대화 줄: `주의: <문구>`(level warn), `확인해 보세요: <문구>`(level check)
  - 설명 패널 절 제목: `주의할 점`, 등급 표시: `경고` / `확인 필요`
  - 버튼: `의도된 구성`
  - 무시한 목록 소제목: `의도된 구성으로 표시함`, 그 버튼: `다시 경고`
  - 배지 aria-label: `경고 N개`
- 경고 id 형식은 `<rule>:<nodeId>` 이고, 연결 규칙은 `<rule>:<edgeId>` 다. 같은 id 는 한 번만 나온다.

## Review Focus

1. **Clef 가 꺼져 있거나 429** → 코드 규칙 경고는 그대로 나오고 차례가 멈추지 않는다. → Task 2 `clef failure falls back to code rules`.
2. **Qwen 이 문구를 이상하게 쓰거나 실패함**(80자 초과·없는 id·깨진 줄·시간 초과) → 그 경고는 정해진 문구로 나온다. → Task 2 `bad or missing text uses the template`.
3. **"의도된 구성"으로 무시한 경고** → 다음 대화 차례에 다시 안내되지 않고, 배지에서도 빠진다. 그 전 버전으로 되돌리면 무시 표시도 되돌아간다. → Task 1 `ignored warnings are hidden`, Task 3 `ignored warning is not announced again`, Task 7 E2E.
4. **데이터 노드가 아주 많은 구성(40개 이상)** → Clef 는 5건까지만 부르고, 점검 단계가 차례를 크게 늘리지 않는다. → Task 2 `clef is called at most 5 times`.
5. **점검 단계 중 사용자가 "중단"** → 버전은 중단됨으로 저장되고, AI 점검(Clef·Qwen)은 건너뛰어 코드 규칙 경고만 저장된다. → Task 3 `abort skips AI checks and keeps code warnings`.

---

## 파일 구조

```
src/
  domain/
    types.ts            (수정) Warning, WarningLevel, DiagramState.warnings?, ignoredWarnings?
    patterns.ts         (새) PATTERNS(9종), patternPromptBlock()
    warnings.ts         (새) RULES, evaluateRules, mergeWarnings, warningsByNode
  server/
    chat/warnings.ts    (새) checkWarnings(state, prev, deps, signal)
    chat/prompt.ts      (수정) 패턴 블록, WARNING_PROMPT, buildWarningMessages
    chat/pipeline.ts    (수정) 점검 단계, warnings 이벤트, meta.warnings
    chat/events.ts      (수정) status phase "checking", warnings 이벤트, MessageMeta.warnings
    llm/clef.ts         (수정) noulProbability(answer)
    ignore.ts           (새) setWarningIgnoredFor (잠금 + form 버전)
  app/(app)/actions.ts  (수정) setWarningIgnoredAction
  canvas/Canvas.tsx, NodeCard.tsx (수정) 경고 배지
  ui/NodeInfo.tsx       (수정) 주의할 점 절
  ui/chat/useChatTurn.ts, lines.ts, ChatPanel.tsx (수정) 경고 줄, 상태 문구
  ui/DiagramWorkspace.tsx (수정) 연결
scripts/smoke-llm.ts    (수정) noul 응답 모양·판정 점검
tests/e2e/fake-llm.ts   (수정) noul 응답, 경고 문구 응답
```

---

### Task 1: 경고 규칙과 구성 패턴(도메인)

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/patterns.ts`, `src/domain/warnings.ts`
- Test: `tests/unit/warnings.test.ts`, `tests/unit/patterns.test.ts`

**Interfaces:**
- Produces:
  - `type WarningLevel = "warn" | "check"`
  - `interface Warning { id: string; rule: string; nodeId: string; edgeId?: string; level: WarningLevel; text: string; guide: string }`
  - `DiagramState.warnings?: Warning[]`, `DiagramState.ignoredWarnings?: string[]`. 둘 다 선택 필드다.
  - `PATTERNS: { id: string; name: string; summary: string }[]` — §7.1 의 9종을 이 순서로 둔다. 각 id 는 아래와 같다.
    - `web-was-db`, `lb-autoscale`, `cache`, `mq-async`, `k8s`, `cdn-static`, `serverless`, `dr`, `external`
    - `summary` 는 한국어 1~2문장이다. 정할 것: 핵심 구성요소와 연결 순서.
  - `patternPromptBlock(): string` → `구성 패턴(기준 지식):\n- <name>: <summary>` 9줄
  - `RULES` 는 code 규칙 4개와 Clef 규칙 1개다. 각 항목은 `{ rule, level, patternId, template(state, target): string, guide: string }` 다.

    | rule | 판정 | level | patternId | template | guide |
    |---|---|---|---|---|---|
    | `db_public` | kind 가 db_rdb·db_nosql·cache·search·db_proxy·file_storage 인 노드의 조상 그룹에 `subnet_public` 또는 `dmz` 가 있음 | warn | web-was-db | `{라벨}이(가) 공개 구역에 있어요.` | `DB·캐시는 내부 구역에 두고 WAS 를 거쳐서만 접근하게 하세요.` |
    | `spof` | kind 가 web_server·was·app_server·db_rdb·db_nosql·lb_l4·lb_l7 이고 조상에 `redundancy_group` 이 없음. 단 가정 `redundancy` 가 확정(`confirmed`)이고 값이 `이중화 없음` 이면 규칙 전체를 끈다 | warn | web-was-db | `{라벨}이(가) 1대뿐이라 멈추면 서비스도 멈춰요.` | `같은 역할 서버를 2대 이상 두고 이중화 묶음(VIP)으로 묶으세요.` |
    | `no_firewall` | edgeKind request·async 이고, 출발 노드 분류가 client 또는 external, 도착 노드 분류가 compute 또는 data. 대상 nodeId 는 도착 노드, edgeId 는 그 연결, id 는 `no_firewall:<edgeId>` | warn | lb-autoscale | `{출발}에서 {도착}(으)로 바로 들어와요.` | `외부 요청은 WAF·방화벽·로드밸런서를 거쳐 내부로 들어오게 하세요.` |
    | `cache_without_db` | cache 노드가 있는데 db_rdb·db_nosql 노드가 하나도 없음(대상: 각 cache 노드) | warn | cache | `{라벨}의 원본 데이터를 둘 DB 가 없어요.` | `캐시는 원본 DB 앞의 계층이에요(Cache-aside). 원본 DB 를 함께 두세요.` |
    | `db_exposed` | Clef 판정 전용(evaluateRules 는 만들지 않음). instructions: `이 저장소가 인터넷(외부 사용자·외부 서비스)에서 방화벽 없이 직접 접근 가능한 위치에 있거나 그렇게 연결돼 있는가?` | warn/check | web-was-db | `{라벨}이(가) 외부에서 직접 접근될 수 있어 보여요.` | `DB 는 내부 구역에 두고, 외부와의 연결은 WAS 나 API 게이트웨이를 거치게 하세요.` |

  - `evaluateRules(state: DiagramState): Warning[]` — code 규칙 4개만 평가한다. `text` 는 template 이다. 출력 순서는 RULES 순서, 그 안에서는 노드·연결 삽입 순서다.
  - `mergeWarnings(state: DiagramState): { active: Warning[]; ignored: Warning[] }` — 화면 표시용이다.
    - code 규칙은 `evaluateRules(state)` 의 결과만 쓴다. 지금 걸리는 것만 남는다.
    - 같은 id 가 `state.warnings` 에 있으면 그 `text` 를 쓴다(Qwen 문구 유지).
    - `db_exposed` 는 `state.warnings` 에 있고 노드가 아직 있는 것만 남긴다.
    - `ignoredWarnings` 에 든 id 는 `ignored` 로 간다.
  - `warningsByNode(active: Warning[]): Record<string, number>`

- [ ] **Step 1: 실패하는 테스트**
  - patterns: `nine patterns in spec order`, `prompt block has one line per pattern`
  - warnings:
    - `db in public subnet warns`
    - `db in private subnet does not`
    - `spof for a lone was, none inside redundancy_group`
    - `confirmed 이중화 없음 turns spof off`(미확정이면 켜져 있음)
    - `client to was directly warns with edge id, client to lb does not`
    - `cache without any db warns, with db does not`
    - `labels are filled into the template`
  - merge:
    - `stored qwen text wins for code rules that still fire`
    - `stale code warning in state is dropped when the rule no longer fires`
    - `db_exposed kept only while its node exists`
    - `ignored warnings are hidden`(active 에서 빠지고 ignored 로 간다)
    - `warningsByNode counts active only`
- [ ] **Step 2:** `npx vitest run tests/unit/warnings.test.ts tests/unit/patterns.test.ts` → FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4:** 같은 명령 → PASS, `npm test`, `npx tsc --noEmit`
- [ ] **Step 5: Commit** `feat: 경고 규칙과 구성 패턴`

---

### Task 2: 서버 점검 — Clef 판정과 Qwen 문구

**Files:**
- Create: `src/server/chat/warnings.ts`
- Modify: `src/server/llm/clef.ts`(`noulProbability`), `src/server/chat/prompt.ts`(`WARNING_PROMPT`, `buildWarningMessages`)
- Test: `tests/unit/server-warnings.test.ts`, `tests/unit/clef.test.ts`, `tests/unit/prompt.test.ts`

**Interfaces:**
- Consumes: `evaluateRules`, `RULES`, `Warning`(Task 1). `ClefClient.decide`, `QwenClient.streamCompletion`, `createJsonlParser`(기존).
- Produces:
  - `noulProbability(a: ClefAnswer | undefined): number | null`
    - 받는 모양: `a.probability` 가 숫자일 때, `a.probabilities.yes` 일 때, `a.choice` 가 `"yes"`/`"no"` 이고 `confidence` 가 있을 때(no 면 `1 − confidence`).
    - 그 밖이면 null 이다. 값은 0~1 로 자른다.
    - 실제 응답 모양은 스파이크 기록에 없다. 그래서 Task 6 smoke 가 원본 응답을 출력해 사용자가 확인한다.
  - `checkWarnings(state: DiagramState, prev: Warning[] | undefined, deps: { clef: ClefClient; qwen: QwenClient | null }, signal: AbortSignal, opts?: { clefLimit?: number /* 5 */; textTimeoutMs?: number /* 8000 */ }): Promise<{ warnings: Warning[]; fresh: Warning[] }>`
    - `warnings` 는 코드 규칙 결과에 Clef `db_exposed` 결과를 더한 것이다.
      - 같은 id 가 `prev` 에 있으면 그 `text` 를 다시 쓴다.
      - 새 것은 Qwen 문구를 쓰고, 실패하면 template 을 쓴다.
    - `fresh` 는 `prev` 에 없고 `state.ignoredWarnings` 에도 없는 것이다.
    - Clef 판정 1건은 `decide(stateText, { q: { type: "noul", instructions } }, signal)` 다.
      - `stateText` 는 대상 노드와 이웃(연결 상대·조상 그룹)을 요약한 줄이고, 라벨은 `JSON.stringify` 한다.
      - Clef 호출들은 `Promise.allSettled` 로 모은다. 동시성 제한은 기존 clef 클라이언트가 맡는다.
    - `signal.aborted` 면 AI 단계 없이 코드 규칙 결과만 돌려준다(text 는 prev 또는 template).
  - `WARNING_PROMPT`: 경고 문구 작성 지시. 규칙은 아래와 같다.
    - 한국어 한 문장, 80자 이내, 비전공자도 알 수 있게 쓴다.
    - JSON Lines `{"id","text"}` 만 출력한다.
    - 주어지지 않은 id 를 만들지 않는다.
  - `buildWarningMessages(items: { id: string; rule: string; facts: string }[]): ChatMessage[]`. `facts` 는 template 문구와 관련 노드 요약이다.

- [ ] **Step 1: 실패하는 테스트**(가짜 clef·qwen 주입)
  - clef: `noulProbability reads probability, probabilities.yes, and yes/no choice`, `unknown shape gives null`
  - server-warnings:
    - `code rules appear without AI`(qwen null, clef 키 없음)
    - `clef failure falls back to code rules`
    - `clef ≥0.8 warn, 0.5–0.8 check, below none`
    - `clef is called at most 5 times`(데이터 노드 12개)
    - `qwen text is used for fresh warnings only`(prev 에 있던 id 는 qwen 에 보내지 않는다)
    - `bad or missing text uses the template`. 사례는 다섯 가지다: 81자, 없는 id, 깨진 줄, 응답 없음, 시간 초과(`textTimeoutMs` 를 작게).
    - `ignored warnings are not fresh`
    - `aborted signal skips AI steps`
    - `labels are JSON-escaped in clef state`
  - prompt: `warning prompt lists ids and facts`, `pattern block is in SYSTEM_PROMPT`
- [ ] **Step 2:** `npx vitest run tests/unit/server-warnings.test.ts tests/unit/clef.test.ts tests/unit/prompt.test.ts` → FAIL
- [ ] **Step 3: 구현.** SYSTEM_PROMPT 끝의 규칙 목록 뒤에 `patternPromptBlock()` 을 붙인다.
- [ ] **Step 4:** 같은 명령 → PASS, `npm test`, `npx tsc --noEmit`, `npm run lint`
- [ ] **Step 5: Commit** `feat: 경고 점검(Clef 판정·Qwen 문구)`

---

### Task 3: 대화 차례에 점검 단계 넣기

**Files:**
- Modify: `src/server/chat/pipeline.ts`, `src/server/chat/events.ts`
- Test: `tests/integration/pipeline.test.ts`

**Interfaces:**
- Consumes: `checkWarnings`(Task 2)
- Produces:
  - `ChatEvent` 에 다음을 추가한다.
    - `{ t: "status"; phase: "checking" }`
    - `{ t: "warnings"; items: Warning[] }` (fresh 만)
  - `MessageMeta.warnings?: Warning[]` (fresh 만, 있을 때만)
- 규칙:
  - `applied > 0` 일 때만 점검한다.
  - status `complete` 면 `emit({t:"status",phase:"checking"})` 후 `checkWarnings(state, prev, deps, signal)` 를 부른다. `prev` 는 차례 시작 상태의 `warnings` 다.
  - 중단·오류면 이미 abort 된 signal 로 불러 코드 규칙만 받는다.
  - 결과 `warnings` 를 `state.warnings` 에 넣은 뒤 `createVersion` 한다. 다른 상태 필드는 그대로다.
  - `fresh.length > 0` 이면 `warnings` 이벤트를 `done` 앞에 보내고 `meta.warnings` 에 저장한다.
  - 점검 단계도 차례 전체 상한(120초) 안이다.

- [ ] **Step 1: 실패하는 통합 테스트**
  - `turn saves warnings into the version and emits fresh ones before done`. 가짜 qwen 이 공개 구역 DB 를 만들게 한다.
  - `ignored warning is not announced again`. 상태에 `ignoredWarnings:["db_public:db-1"]` 를 둔다.
  - `answer-only turn does not check`
  - `abort skips AI checks and keeps code warnings`. 가짜 clef 가 불리지 않았고, 버전의 `warnings` 는 template 문구다.
- [ ] **Step 2:** `npm run test:int -- pipeline` → FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4:** 같은 명령 → PASS, `npm test`, `npx tsc --noEmit`
- [ ] **Step 5: Commit** `feat: 대화 차례 끝 경고 점검`

---

### Task 4: "의도된 구성" 저장

**Files:**
- Create: `src/server/ignore.ts`
- Modify: `src/app/(app)/actions.ts`
- Test: `tests/integration/ignore.test.ts`

**Interfaces:**
- Produces:
  - `setWarningIgnoredFor(userId: string, diagramId: string, warningId: string, ignored: boolean): Promise<{ number: number | null }>`
    - 3A `saveFieldsFor` 와 같은 패턴이다: 소유 확인 → `withDiagramLock` → 최신 상태 → 바뀐 게 없으면 `null` → `createVersion(source:"form")`.
    - id 형식(`^[a-z_]{1,32}:[a-z0-9][a-z0-9-]{0,63}$`)이 틀리면 `ValidationError("경고를 찾을 수 없어요")` 다.
    - 잠금 실패는 `BUSY_MESSAGE` 다.
    - 무시할 때는 목록에 추가하고(중복 없음), 다시 경고할 때는 빼며, 목록이 비면 필드를 지운다.
  - `setWarningIgnoredAction(diagramId, warningId, ignored): Promise<ActionResult<{ number: number | null }>>`

- [ ] **Step 1: 실패하는 통합 테스트**
  - `ignore adds the id as a form version`
  - `unignore removes it and drops the empty field`
  - `ignoring twice makes no new version`
  - `bad id is rejected`
  - `busy while the chat lock is held`. 3A fields 테스트처럼 `gate` promise 로 잡되, `try/finally` 로 반드시 푼다.
  - `other user's diagram is not found`
- [ ] **Step 2:** `npm run test:int -- ignore` → FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4:** 같은 명령 → PASS, `npm test`, `npx tsc --noEmit`
- [ ] **Step 5: Commit** `feat: 경고 의도된 구성 저장`

---

### Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄

**Files:**
- Modify: `src/canvas/Canvas.tsx`, `src/canvas/NodeCard.tsx`, `src/canvas/canvas.css`, `src/ui/NodeInfo.tsx`, `src/ui/chat/useChatTurn.ts`, `src/ui/chat/lines.ts`, `src/ui/chat/ChatPanel.tsx`, `src/ui/DiagramWorkspace.tsx`
- Test: `tests/unit/Canvas.test.tsx`, `NodeCard.test.tsx`, `NodeInfo.test.tsx`, `useChatTurn.test.tsx`, `lines.test.ts`, `ChatPanel.test.tsx`, `DiagramWorkspace.test.tsx`(추가)

**Interfaces:**
- Consumes: `mergeWarnings`, `warningsByNode`(Task 1), `setWarningIgnoredAction`(Task 4), `warnings` 이벤트·`meta.warnings`(Task 3)
- Produces:
  - `NodeCardData.badge` 를 `badges?: { missing?: number; warn?: number }` 로 바꾼다.
    - 둘 다 있으면 경고 "!" 버튼(aria-label `경고 N개`, `nodrag nopan nokey`)이 빠진 정보 버튼 왼쪽에 나란히 놓인다.
    - 경고 배지 클릭은 `onWarnBadgeClick(nodeId)` → 그 노드를 선택한다(설명 탭으로 감).
    - 비교 모드에서는 두 배지 모두 숨긴다.
  - `CanvasProps.onWarnBadgeClick?(nodeId)`
  - NodeInfo `주의할 점` 절은 노드의 active 경고마다 `경고`/`확인 필요` 표시, 문구, 가이드, `의도된 구성` 버튼을 보여 준다.
    - ignored 가 있으면 `의도된 구성으로 표시함` 소제목 아래 문구와 `다시 경고` 버튼을 둔다.
    - 연결을 선택하면 `edgeId` 가 그 연결인 경고를 같은 모양으로 보여 준다.
    - 경고가 없으면 절이 없다.
    - `NodeInfoProps.onIgnoreWarning?(id: string, ignored: boolean)` 이 없으면 버튼을 숨긴다(이력 보기 등).
  - 대화 줄은 `ChatLine` 에 `kind: "warning"`, `nodeId`, `level` 을 추가한다.
    - 글은 `주의: <text>` 또는 `확인해 보세요: <text>` 다. 클릭하면 그 노드를 선택한다.
    - live 경로: `warnings` 이벤트를 받으면 요약 줄·빠진 정보 안내 줄 다음에 둔다.
    - reload 경로: `messagesToLines` 가 assistant 줄 뒤(빠진 정보 안내 다음)에 같은 줄을 넣는다.
  - ChatPanel 상태 문구에 `checking: "위험 요소 점검 중…"` 을 추가한다.

- [ ] **Step 1: 실패하는 테스트**
  - Canvas:
    - `warn and missing badges side by side`
    - `warn badge selects the node`
    - `no badges in compare mode`
    - `ignored warning has no badge`
  - NodeCard: `warn badge is a nodrag button with label`
  - NodeInfo:
    - `주의할 점 lists text, guide and level`
    - `의도된 구성 calls onIgnoreWarning(id, true)`
    - `ignored list shows 다시 경고`
    - `edge selection shows its warning`
  - useChatTurn: `warnings event adds lines after the summary and reminder`
  - lines: `reload adds warning lines after the reminder`
  - ChatPanel:
    - `checking phase label`
    - `warning line click selects node`
  - DiagramWorkspace: `ignore saves via action and the warning moves to the ignored list after adoption`
- [ ] **Step 2:** 해당 파일들 `npx vitest run …` → FAIL
- [ ] **Step 3: 구현.** 배지 두 개가 겹침 검사(`overlap.ts` 의 badge 반지름)를 깨지 않는지 `layout`/`overlap` 기존 테스트로 확인한다. `onWarnBadgeClick` 은 `useCallback` 으로 고정한다(3A 최종 리뷰 I1 교훈).
- [ ] **Step 4:** 같은 명령 → PASS, `npm test`, `npx tsc --noEmit`, `npm run lint`
- [ ] **Step 5: Commit** `feat: 경고 배지·주의할 점·대화 경고 줄`

---

### Task 6: smoke 와 가짜 AI 서버

**Files:**
- Modify: `scripts/smoke-llm.ts`, `tests/e2e/fake-llm.ts`

**Interfaces / 변경:**
- smoke:
  - 스파이크의 위험/안전 두 상태(`spike.mjs:211-214` 의 risky·safe 문자열)로 `db_exposed` instructions 의 `noul` 판정을 1회씩 부른다.
  - 결과로 Clef 원본 응답의 키 목록(값 아님)과 `noulProbability` 값을 출력한다.
  - 또 s1·s2 생성 결과에 `evaluateRules` 를 돌려 규칙별 개수를 표로 출력한다.
  - 실행은 사용자가 한다. 구현자는 `npx tsc --noEmit` 만 통과하면 된다.
- fake-llm:
  - Clef `/v1/systemone` 에서 `noul` 질문이면 `{ type: "noul", probability: 0.1 }` 을 돌려준다.
  - 단, state 문자열에 `"외부DB"` 가 있으면 0.95 다.
  - Qwen 요청의 system 이 WARNING_PROMPT 면 받은 id 마다 `{"id":…,"text":"가짜 경고 문구"}` 줄을 돌려준다.
  - 사용자 글에 `"공개DB"` 가 있으면 공개 구역 안에 db_rdb 를 만드는 명령 줄을 낸다.
- [ ] **Step 1:** 구현
- [ ] **Step 2:** `npx tsc --noEmit`, `npm test`, `npm run test:e2e`(기존 9개 유지)
- [ ] **Step 3: Commit** `test: 경고용 가짜 AI 응답과 smoke 점검`

---

### Task 7: E2E — 경고 흐름

**Files:**
- Create: `tests/e2e/phase3b.spec.ts`

- [ ] **Step 1:** E2E 를 쓴다(가짜 AI). `warnings: chat line, badge, ignore, restore`
  1. "공개DB 붙은 서비스" 를 보낸다.
  2. 대화에 `위험 요소 점검 중…` 이 지나간 뒤 `주의: 가짜 경고 문구` 줄이 보인다.
  3. 그 DB 노드에 `경고 1개` 배지가 보이고, 빠진 정보 배지와 함께 있다.
  4. 경고 줄을 클릭하면 설명 탭 `주의할 점` 에 문구·가이드가 보인다.
  5. `의도된 구성` 을 누르면 배지가 사라지고 `의도된 구성으로 표시함` 에 들어간다. 이력 최신 버전은 `직접 입력` 이다.
  6. 같은 요청을 다시 보내도 `주의:` 줄이 새로 생기지 않는다.
  7. 무시 전 버전으로 되돌리면 배지가 다시 보인다.
  8. 새로고침 뒤에도 처음의 `주의:` 줄이 대화에 남아 있다.
- [ ] **Step 2:** `npm run test:e2e` 연속 2회 통과, 기존 9개 유지, 고정 sleep 금지
- [ ] **Step 3: Commit** `test: 3B단계 E2E(경고)`

---

## 3C 로 넘기는 것
- 노드 설명 생성·캐시·Clef `score` 품질 검사, 용어 사전 DB·화면, 본문 용어 풀이
- §6.8 노드에 대해 물어보기
- 설명 패널 개편 시 "주의할 점" 절의 위치 조정
