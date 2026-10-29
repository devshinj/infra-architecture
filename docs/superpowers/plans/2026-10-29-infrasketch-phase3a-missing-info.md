# InfraSketch 3A단계: 빠진 정보 채우기 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 구성도가 그려지거나 바뀌면 노드 종류별 필수 항목과 연결 포트 중 빈 칸을 계산한다. 노드 오른쪽 위 배지와 대화 탭 상단 "채워야 할 정보 (N)" 체크리스트로 보여 주고, 폼으로 직접 채우거나 "모름"으로 표시하게 한다. 노드마다 저장하면 "직접 입력" 버전이 하나 생긴다. 대화로 값을 알려 주면("WAS 두 대 다 4코어 16기가야") AI 가 그 칸에 반영한다.

**Architecture:**
- 빈 칸 계산은 순수 함수 `computeMissing(state)` 하나다(`src/domain/missing.ts`). 화면(배지·체크리스트·설명 패널)과 서버(대화 끝 안내, Clef 문맥)가 같은 함수를 쓴다.
- "모름"은 노드·연결의 `unknown?: string[]`(항목 키 목록)로 구성도 상태에 저장한다. 그래서 버전과 함께 되돌려진다.
- 폼 저장은 서버 함수 `saveFieldsFor` 로 처리한다. 대화 차례와 같은 구성도 잠금을 잡고 `form` 버전을 만든다.

**Tech Stack:** 2단계 스택 그대로(Next.js 15, React 19, TS strict, zod v4, drizzle/postgres, vitest, Playwright + 가짜 AI 서버). 새 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md` — 이번 범위는 아래와 같다.
- §8 전체(2026-10-29 사용자 결정 반영본)
- §4.5 의 `report_missing` 제외 결정
- §4.6 의도 분류 중 `missing_info_answer` 정확도
- §12.2 의 "state 에 직전 AI 질문 / 열린 체크리스트 항목을 넣는다"

§6.8(노드에 대해 물어보기)은 3C, 경고(§7)는 3B 범위다.

## Global Constraints

- 1·2단계 Global Constraints 전부 유지한다.
  - 한국어 UI, CSS 변수 토큰 색만 쓴다.
  - `--accent` 는 흐름 빛 머리·선택 링·"방금 수정됨"에만 쓴다.
  - 글로우·그라데이션·사이드 바·이모지 금지.
  - 구조 변경은 `applyCommand` 로만 한다.
  - 소유자만 접근한다.
  - 키는 `.env` 에서만 읽고 절대 출력하지 않는다.
  - 테스트에서 실제 AI 서버를 부르지 않는다.
- 빠진 정보 대상(§8.1):
  - 노드: `src/domain/catalog.ts` 의 `NODE_KINDS[].requiredAttrs`. 이 칸은 `attrs[key]` 가 `undefined`·`null`·공백뿐인 문자열이면 빈 칸이다.
  - 연결: `edgeKind` 가 `request` 또는 `async` 인 연결의 `label`(프로토콜/포트). 항목 키는 `"label"` 이다.
  - 그룹은 대상이 아니다. 방화벽 필요 여부는 대상이 아니다(3B 경고로 넘긴다).
- "모름"으로 표시한 항목은 카운트(N·배지 숫자)에서 빠지지만 체크리스트 목록에는 "모름" 상태로 남는다. 값이 채워진 항목은 `unknown` 에 있어도 빈 칸으로 세지 않는다.
- `report_missing` 명령은 만들지 않는다. SYSTEM_PROMPT 의 "warn 과 report_missing 명령은 내지 않는다" 줄은 그대로 둔다.
- 화면 문구는 아래를 그대로 쓴다.
  - 체크리스트 머리: `채워야 할 정보 (N)`
  - 칸 옆 체크박스: `모름`
  - 버튼: `저장`
  - 대화 끝 안내: `빠진 정보 N개가 있어요`
  - 설명 패널: 모름 항목 값 `모름`, 빈 칸 값 `미입력`(기존 문구)
  - 체크리스트 안 연결 제목: `<출발 이름> → <도착 이름>`
- 폼 값 검증: 앞뒤 공백을 자르고 1~80자. 빈 문자열은 "입력 안 함"으로 보고 기존 값을 바꾸지 않는다.
- 폼 저장 1회 = 버전 1개(source `form`, 이력 표시 "직접 입력"). 대화 차례가 돌고 있으면 저장하지 않고 `BUSY_MESSAGE`("다른 응답을 처리하고 있어요. 끝난 뒤 다시 보내 주세요.")를 돌려준다.

## Review Focus

1. **필수 항목이 없는 노드 종류**(client_web, cdn, dns 등) → 배지가 없고 체크리스트에도 나오지 않는다. → Task 1 `kinds without required attrs produce no items`.
2. **이전 버전으로 되돌리기** → 그 버전의 값과 "모름" 표시가 함께 돌아오고, 배지·N 이 즉시 다시 계산된다. → Task 1 `unknown travels with the state`(순수 계산), Task 8 E2E `restore brings back missing count`.
3. **체크리스트에 입력해 두는 사이 AI 가 그 노드를 지움** → 저장하면 "대상을 찾을 수 없어요" 안내만 뜨고, 다른 노드의 입력은 그대로 남는다. → Task 2 `save on a removed target is rejected`, Task 4 `vanished target keeps other drafts`.
4. **공백만 넣고 저장** → 값이 바뀌지 않고 버전도 생기지 않는다. → Task 2 `whitespace-only values are ignored and no version is made when nothing changes`.
5. **대화 차례가 도는 중에 저장** → 저장 버튼이 비활성이고, 다른 탭에서 저장하면 서버가 BUSY 로 거절하며 입력은 남는다. → Task 2 `save while a chat turn holds the lock returns busy`, Task 4 `save disabled while busy`.

---

## 파일 구조

```
src/
  domain/
    types.ts                 (수정) DNode.unknown?: string[], Edge.unknown?: string[]
    missing.ts               (새) FIELD_LABELS, MissingItem, computeMissing, missingReminder
  server/
    fields.ts                (새) saveFieldsFor (잠금 + form 버전)
    chat/pipeline.ts         (수정) done.missing / meta.missing, Clef 문맥에 열린 항목
    chat/events.ts           (수정) MessageMeta.missing, done.missing
    chat/prompt.ts           (수정) 빠진 정보 답변 안내·열린 항목 목록, 가정 키 이스케이프
    chat/skips.ts            (수정) 건너뜀 집계 키에서 attrs 하위 경로 제거
    llm/clef.ts              (수정) classifyIntent 문맥에 openItems, 기준 문구 보강
  app/(app)/actions.ts       (수정) saveFieldsAction
  app/(app)/p/.../page.tsx   (수정) 다시 불러올 때 대화 끝 안내 줄 복원
  canvas/
    Canvas.tsx               (수정) 노드 배지 데이터, onBadgeClick
    NodeCard.tsx             (수정) 배지를 버튼으로(클릭 시 onBadgeClick)
  ui/
    NodeInfo.tsx             (수정) 모름 표시
    chat/MissingChecklist.tsx (새) 체크리스트·폼·모름·저장
    chat/ChatPanel.tsx       (수정) 체크리스트 자리
    chat/useChatTurn.ts      (수정) done 뒤 안내 줄
    DiagramWorkspace.tsx     (수정) 연결(계산·저장·배지 → 체크리스트 이동)
scripts/smoke-llm.ts         (수정) 문맥 있는 의도 분류 점검, unknown_op 라벨
package.json                 (수정) db:migrate 가 .env 를 읽음
tests/
  unit/missing.test.ts, MissingChecklist.test.tsx (새)
  integration/fields.test.ts (새)
  e2e/phase3a.spec.ts        (새)
```

---

### Task 1: 빈 칸 계산(도메인)

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/missing.ts`
- Test: `tests/unit/missing.test.ts`

**Interfaces:**
- Produces:
  - `DNode.unknown?: string[]`, `Edge.unknown?: string[]`. 둘 다 선택 필드라 기존 상태 JSON 과 호환된다.
  - `FIELD_LABELS: Record<string, string>`. 값은 아래와 같다.
    - 서버·공통: `hostname` 호스트명, `cpu` CPU, `ram` RAM, `disk` 디스크, `os` OS, `ip` IP, `sw` SW, `version` 버전
    - 네트워크: `port` 포트, `rules` 방화벽 규칙, `vip` VIP
    - 데이터·규모: `replication` 복제 방식, `nodes` 노드 수, `replicas` 파드 수, `brokers` 브로커 수
    - 기타: `runtime` 런타임, `service` 서비스, `integration` 연동 방식
    - 연결: `label` 프로토콜/포트
  - `interface MissingItem { targetKind: "node" | "edge"; targetId: string; key: string; label: string; unknown: boolean }`
  - `computeMissing(state: DiagramState): { items: MissingItem[]; count: number; byNode: Record<string, number> }`. 반환값의 의미는 아래와 같다.
    - `items` 는 모름 항목을 포함한다. 순서는 노드(삽입 순) → 그 노드의 requiredAttrs 순, 그다음 연결(삽입 순)이다.
    - `count` 는 모름을 뺀 개수다.
    - `byNode` 는 노드별 모름을 뺀 개수이고, 0 인 노드는 키가 없다.
  - `missingReminder(n: number): string` → `` `빠진 정보 ${n}개가 있어요` ``

- [ ] **Step 1: 실패하는 테스트**를 `tests/unit/missing.test.ts` 에 쓴다.
  - `server node lists every empty required attr`
    - `was` 노드(attrs `{sw:"Tomcat", ram:null}`) → 빈 칸은 hostname·cpu·ram·disk·os·ip 6개, `count` 6, `byNode.was-1` 6.
    - `sw` 는 값이 있으니 빠진다.
  - `whitespace counts as empty`: `ip: "  "` → 빈 칸.
  - `unknown is listed but not counted`
    - `unknown: ["ip"]` → `ip` 항목이 `unknown: true` 로 목록에 있다.
    - `count`·`byNode` 는 하나 줄어든다.
  - `filled value wins over unknown`: `ip:"10.0.0.1"` 이면서 `unknown:["ip"]` → `ip` 항목이 없다.
  - `kinds without required attrs produce no items`: client_web·cdn·dns 만 있는 상태 → `items` 빈 배열, `count` 0.
  - `request and async edges need a label, replication and aux do not`
    - request·async 연결은 label 이 없으면 `{targetKind:"edge", key:"label", label:"프로토콜/포트"}` 를 만든다.
    - replication·aux 연결은 label 이 없어도 항목을 만들지 않는다.
  - `unknown travels with the state`: 같은 상태를 `structuredClone` 한 뒤 `unknown` 을 뺀 상태와 비교한다. `count` 가 다르면 된다(되돌리기 = 상태 교체라는 전제를 고정한다).
  - `missingReminder(3)` → `"빠진 정보 3개가 있어요"`.
- [ ] **Step 2:** `npx vitest run tests/unit/missing.test.ts` → FAIL(모듈 없음).
- [ ] **Step 3: 구현.**
  - `types.ts` 에 `unknown` 필드를 추가한다.
  - `missing.ts` 는 catalog 의 `NODE_KINDS` 에서 requiredAttrs 를 찾는다.
  - `FIELD_LABELS` 에 없는 키는 키 그대로 라벨로 쓴다.
- [ ] **Step 4:** 같은 명령 → PASS. `npm test`, `npx tsc --noEmit` 도 통과(필드 추가로 기존 테스트가 깨지지 않음).
- [ ] **Step 5: Commit** `feat: 빠진 정보 계산`

---

### Task 2: 폼 저장(서버)

**Files:**
- Create: `src/server/fields.ts`
- Modify: `src/app/(app)/actions.ts` (`saveFieldsAction`, `confirmAssumptionAction` 과 같은 `runResult` 패턴)
- Test: `tests/integration/fields.test.ts`

**Interfaces:**
- Consumes:
  - `computeMissing` 에서 대상 키 목록만 쓴다. 대상 노드·연결의 필수 키 집합을 같은 규칙으로 얻는 내부 헬퍼를 `missing.ts` 에서 export 해도 된다(`requiredKeysFor(state, kind, id): string[] | null`, 대상이 없으면 null).
  - `withDiagramLock`, `createVersion`, `getLatestState`, `getOwnedDiagram`, `ValidationError`, `BUSY_MESSAGE`.
- Produces:
  - `saveFieldsFor(userId: string, diagramId: string, input: { targetKind: "node" | "edge"; targetId: string; values: Record<string, string>; unknown: string[] }): Promise<{ number: number | null }>`
    - `number` 은 새 버전 번호다. 바뀐 것이 없으면 `null` 이고 버전을 만들지 않는다.
  - `saveFieldsAction(diagramId, input): Promise<ActionResult<{ number: number | null }>>`
- 규칙:
  - `values`·`unknown` 의 키는 대상의 필수 키여야 한다(아니면 `ValidationError("입력할 수 없는 항목이에요")`).
  - 대상이 없으면 `ValidationError("대상을 찾을 수 없어요")`.
  - 값은 trim 한다. 빈 값은 무시하고, 80자를 넘으면 `ValidationError("값은 80자 이하로 입력해 주세요")`.
  - 노드 값은 `attrs[key]` 에 넣는다. 연결은 `label` 만 받는다.
  - 저장 뒤 `unknown` 은 (입력 `unknown` − 값을 채운 키)다. 비면 필드를 지운다.
  - 잠금을 못 잡으면 `ValidationError(BUSY_MESSAGE)`.

- [ ] **Step 1: 실패하는 통합 테스트**를 쓴다(`tests/integration/helpers.ts` 의 사용자·구성도 생성 헬퍼를 재사용).
  - `saves node attrs as a form version`: `ram:"32GB"` 저장 → 최신 상태 `attrs.ram === "32GB"`, 버전 source `form`.
  - `marks unknown and clears it when filled`
    - 첫 저장 `unknown:["ip"]` → `unknown` 은 `["ip"]`.
    - 두 번째 저장 `values:{ip:"10.0.0.1"}, unknown:["ip"]` → `unknown` 필드가 없다.
  - `edge label is saved`: request 연결 `label:"HTTPS 443"`.
  - `whitespace-only values are ignored and no version is made when nothing changes`: `{ram:"   "}`, `unknown:[]` → `{number:null}`, 버전 수가 그대로다.
  - `rejects keys that are not required for the target`: was 노드에 `{replicas:"3"}` → ValidationError.
  - `save on a removed target is rejected`: 없는 id → `"대상을 찾을 수 없어요"`.
  - `save while a chat turn holds the lock returns busy`
    - `withDiagramLock(diagramId, () => gate)` 로 잠금을 잡는다. `gate` 는 테스트가 나중에 resolve 하는 promise 다.
    - 그동안 `saveFieldsFor` 를 부르면 `BUSY_MESSAGE` ValidationError 가 나야 한다.
    - 그 뒤 `gate` 를 풀고, 다시 저장하면 성공해야 한다.
  - `other user's diagram is not found`: 다른 사용자 → NotFoundError.
- [ ] **Step 2:** `docker compose up -d db_test` 후 `npm run test:int -- fields` → FAIL.
- [ ] **Step 3: 구현.** `withDiagramLock` 안에서 최신 상태를 읽고 → 바꾸고 → `createVersion(…, {source:"form"})` 한다. 바뀐 게 없으면 버전을 만들지 않는다(깊은 비교는 `diffStates` 의 changed 로 판정해도 된다). 액션은 `refreshDiagram()` 을 부른다.
- [ ] **Step 4:** 같은 명령 → PASS. `npm test`, `npx tsc --noEmit`.
- [ ] **Step 5: Commit** `feat: 빠진 정보 폼 저장`

---

### Task 3: 노드 배지와 설명 패널의 "모름"

**Files:**
- Modify: `src/canvas/Canvas.tsx`, `src/canvas/NodeCard.tsx`, `src/ui/NodeInfo.tsx`
- Test: `tests/unit/Canvas.test.tsx`, `tests/unit/NodeCard.test.tsx`, `tests/unit/NodeInfo.test.tsx` (기존 파일에 추가)

**Interfaces:**
- Consumes: `computeMissing(state).byNode`
- Produces:
  - `CanvasProps.onBadgeClick?(nodeId: string): void`
  - `NodeCardData.onBadgeClick?: () => void`
  - 배지 데이터는 `badge: { kind: "missing", count }` 이고, `byNode[id] > 0` 일 때만 붙는다.
- 배지는 `<button type="button" aria-label="빠진 정보 N개">` 다.
  - 클릭은 `stopPropagation` 해서 노드 선택을 일으키지 않는다.
  - 비교 모드(`diffMarks` 있음)에서는 배지를 그리지 않는다.
- NodeInfo 는 `node.unknown` 에 든 키를 빈 값일 때 `모름` 으로 보인다(`styles.missing` 유지).

- [ ] **Step 1: 실패하는 테스트**
  - Canvas: `missing badge shows count and calls onBadgeClick without selecting`. RAM·IP 가 빈 was 노드에 배지 `6` 이 보인다. 클릭하면 `onBadgeClick("was-1")` 가 불리고 `onSelect` 는 불리지 않는다.
  - Canvas: `no badge in compare mode`.
  - NodeCard: `badge is a button with an accessible label`.
  - NodeInfo: `unknown attr shows 모름`.
- [ ] **Step 2:** `npx vitest run tests/unit/Canvas.test.tsx tests/unit/NodeCard.test.tsx tests/unit/NodeInfo.test.tsx` → FAIL.
- [ ] **Step 3: 구현.**
  - Canvas 는 `useMemo(() => computeMissing(state).byNode, [state])` 로 데이터를 만든다.
  - 배지 CSS(`.node__badge`)는 그대로 쓴다. 버튼 기본 스타일을 초기화하고 포커스 링은 기존 토큰을 쓴다.
- [ ] **Step 4:** 같은 명령 → PASS, `npm test`.
- [ ] **Step 5: Commit** `feat: 빠진 정보 노드 배지`

---

### Task 4: 체크리스트와 폼

**Files:**
- Create: `src/ui/chat/MissingChecklist.tsx` (스타일은 `chat.module.css` 에 추가)
- Modify: `src/ui/chat/ChatPanel.tsx`, `src/ui/RightPanel.tsx`, `src/ui/DiagramWorkspace.tsx`
- Test: `tests/unit/MissingChecklist.test.tsx`, `tests/unit/DiagramWorkspace.test.tsx`(추가)

**Interfaces:**
- Consumes: `computeMissing`, `saveFieldsAction`, `CanvasProps.onBadgeClick`
- Produces:
  - `MissingChecklistProps { state: DiagramState; busy: boolean; focusId: string | null; onSave(input: { targetKind: "node" | "edge"; targetId: string; values: Record<string, string>; unknown: string[] }): Promise<{ ok: true } | { ok: false; message: string }> }`
  - `ChatPanelProps.checklist?: ReactNode`. 가정 칩과 같은 상단 줄에 둔다.
  - `focusId` 가 바뀌면 체크리스트가 펼쳐지고, 그 대상 블록이 `scrollIntoView` 되며 첫 칸에 포커스가 간다.
- 동작:
  - `items` 가 0개면 아무것도 그리지 않는다.
  - 머리 버튼은 `채워야 할 정보 (N)` 이고 `aria-expanded` 를 쓴다. 기본은 접힘이다.
  - 펼치면 대상별 블록이 나온다. 제목은 노드는 라벨, 연결은 `A → B` 다. 각 줄은 항목 라벨, 텍스트 입력, `모름` 체크박스, 블록 끝의 `저장` 버튼이다.
  - 모름을 체크하면 그 줄의 입력은 비활성이다.
  - 입력 중인 값(초안)은 대상 id 별로 컴포넌트 상태에 둔다. `state` 가 바뀌어도 아직 있는 대상의 초안은 유지하고, 사라진 대상의 초안만 버린다.
  - 저장 성공 시 그 대상 초안만 지운다. 실패 시 `message` 를 그 블록 아래 `role="alert"` 로 보이고 초안은 유지한다.
  - `busy` 면 모든 `저장` 이 비활성이다.
- DiagramWorkspace 연결:
  - `onBadgeClick(id)` → 대화 탭으로 전환하고 `focusId=id` 로 둔다. 같은 id 를 다시 눌러도 동작하도록 클릭마다 새 토큰을 쓴다.
  - `onSave` → `saveFieldsAction` → 성공하면 기존 서버 상태 채택 경로로 새 버전을 반영한다(가정 확정과 같은 방식).

- [ ] **Step 1: 실패하는 테스트**(`MissingChecklist.test.tsx`)
  - `hidden when nothing is missing`
  - `header shows count excluding unknown`
  - `unknown checkbox disables the input and is sent on save`
  - `save sends trimmed values for that target only`
  - `failed save shows the message and keeps the draft`
  - `vanished target keeps other drafts`: 두 노드에 입력하고 → 한 노드가 사라진 `state` 로 rerender 한다. 남은 노드 초안이 그대로다.
  - `save disabled while busy`
  - `focusId expands and focuses the first input of that target`
  - DiagramWorkspace: `badge click opens the chat tab checklist at that node`
- [ ] **Step 2:** `npx vitest run tests/unit/MissingChecklist.test.tsx tests/unit/DiagramWorkspace.test.tsx` → FAIL.
- [ ] **Step 3: 구현.** 색은 기존 토큰만 쓴다. 숫자 강조는 `--state-missing` 이고 `--accent` 는 금지다.
- [ ] **Step 4:** 같은 명령 → PASS, `npm test`, `npx tsc --noEmit`.
- [ ] **Step 5: Commit** `feat: 빠진 정보 체크리스트와 입력 폼`

---

### Task 5: 대화 끝 안내 "빠진 정보 N개가 있어요"

**Files:**
- Modify: `src/server/chat/events.ts`, `src/server/chat/pipeline.ts`, `src/ui/chat/useChatTurn.ts`, `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- Create: `src/ui/chat/lines.ts`, `tests/unit/lines.test.ts`
- Test: `tests/integration/pipeline.test.ts`, `tests/unit/useChatTurn.test.tsx`(추가). 다시 불러올 때 쓰는 변환은 순수 함수 `messagesToLines` 로 빼서 `tests/unit/` 에서 테스트한다.

**Interfaces:**
- Produces:
  - `MessageMeta.missing?: number`
  - `done` 이벤트에 `missing: number`
  - `messagesToLines(rows: { id: string; role: MessageRole; content: string; meta: MessageMeta }[]): ChatLine[]`. 위치는 `src/ui/chat/lines.ts` 이고, 지금 page.tsx 의 map 을 옮긴다.
- 규칙:
  - 서버는 차례 끝 상태로 `computeMissing(state).count` 를 계산한다.
  - `done.missing` 은 항상 넣는다. `meta.missing` 은 `applied > 0 && count > 0` 일 때만 넣는다.
  - 클라이언트는 `done` 의 요약 줄 다음에, `applied > 0 && missing > 0` 일 때 `missingReminder(missing)` 를 system 줄로 추가한다.
  - 다시 불러올 때는 `messagesToLines` 가 `meta.missing > 0` 인 assistant 줄 바로 뒤에 같은 system 줄을 넣는다. 이 줄은 DB 메시지가 아니고, AI 에 보내는 대화 기록에도 들어가지 않는다.

- [ ] **Step 1: 실패하는 테스트**
  - 통합: `done carries the missing count and meta stores it when commands applied`. 가짜 Qwen 이 RAM 없는 was 노드를 만들면 `done.missing` 은 6 이고 assistant meta 의 `missing` 도 6 이다.
  - 통합: `answer-only turn stores no missing meta`
  - useChatTurn: `reminder line follows the summary when missing > 0`
  - lines: `reload adds the reminder after the assistant line`
- [ ] **Step 2:** `npm run test:int -- pipeline` 와 `npx vitest run tests/unit/useChatTurn.test.tsx tests/unit/lines.test.ts` → FAIL.
- [ ] **Step 3: 구현.**
- [ ] **Step 4:** 같은 명령 → PASS, `npm test`, `npx tsc --noEmit`.
- [ ] **Step 5: Commit** `feat: 대화 끝 빠진 정보 안내`

---

### Task 6: 대화로 알려 준 값 반영 — 의도 분류 문맥과 프롬프트

**Files:**
- Modify: `src/server/llm/clef.ts`, `src/server/chat/pipeline.ts`, `src/server/chat/prompt.ts`, `scripts/smoke-llm.ts`
- Test: `tests/unit/clef.test.ts`, `tests/unit/prompt.test.ts`, `tests/integration/pipeline.test.ts`(추가)

**Interfaces:**
- Produces:
  - `classifyIntent(input, context: { lastAssistant?: string; openItems?: string[] }, signal?)`.
    - Clef `state` 문자열은 `직전 AI 메시지: …\n채워야 할 정보: <openItems 를 ", " 로 이은 것>\n사용자: …` 이다.
    - openItems 는 앞 20개만, 전체 600자 이내로 자른다. 열린 항목이 없으면 그 줄을 뺀다.
  - `INTENT_QUESTION.intent.criteria.missing_info_answer` 문구를 `"채워야 할 정보에 대한 값만 알려 주는 답(예: '4코어 16기가', '10.0.2.11, 10.0.2.12', 'RAM 은 32GB'). 새 노드·연결을 만들라는 말이 없으면 이것"` 으로 바꾼다.
  - `buildMessages` 입력에 `missing?: MissingItem[]` 를 추가한다. `intent === "missing_info_answer"` 일 때만 user 내용의 `요청:` 앞에 `채워야 할 정보:\n` + 줄마다 `<targetId> <key>(<label>)` 블록을 넣는다(모름 항목 제외, 최대 40줄).
  - SYSTEM_PROMPT 에 다음 규칙 한 줄을 추가한다. `- 사용자가 채워야 할 정보의 값을 알려 주면 update_node(attrs) 또는 update_edge(label) 로 그 값만 반영한다. 노드·연결을 새로 만들지 않는다.`
  - pipeline 은 차례 시작 상태의 `computeMissing(state)` 에서 열린 항목(모름 제외)을 만든다. `openItems` 는 `"<노드 라벨> <항목 라벨>"` 형식으로 Clef 에 넘기고, items 는 `buildMessages` 에 넘긴다.
- smoke 스크립트에 "문맥 있는" 의도 분류 2건을 추가한다.
  - 스파이크 실패 2문장("WAS 두 대 다 4코어 16기가야", "10.0.2.11, 10.0.2.12")을 쓴다.
  - 문맥은 `lastAssistant: "WAS#1·WAS#2 의 CPU·RAM·IP 를 알려 주세요."`, `openItems: ["WAS#1 CPU","WAS#1 RAM","WAS#1 IP","WAS#2 CPU","WAS#2 RAM","WAS#2 IP"]` 다.
  - 결과 표에 "문맥 없음 6/8" 과 별도로 "문맥 있음 n/2" 를 출력한다. 실행은 사용자가 한다.

- [ ] **Step 1: 실패하는 테스트**
  - clef: `state includes open items line when given`, `open items are capped`, `criteria text for missing_info_answer`. 주입한 fetch 의 body 로 확인한다.
  - prompt: `missing block only for missing_info_answer`, `unknown items are excluded from the block`, `system prompt has the fill-only rule`
  - 통합 pipeline: `missing_info_answer turn passes open items to clef and the prompt`. 가짜 clef 가 받은 context 와 가짜 qwen 이 받은 messages 를 확인한다.
- [ ] **Step 2:** `npx vitest run tests/unit/clef.test.ts tests/unit/prompt.test.ts` 와 `npm run test:int -- pipeline` → FAIL.
- [ ] **Step 3: 구현.** smoke 스크립트 수정은 테스트 대상이 아니다. `npx tsc --noEmit` 만 통과하면 된다. 실제 실행 금지.
- [ ] **Step 4:** 같은 명령 → PASS, `npm test`, `npm run lint`.
- [ ] **Step 5: Commit** `feat: 빠진 정보 답변 의도 분류 문맥과 반영 규칙`

---

### Task 7: 정리 — 2단계 남은 선택 개선점과 마이그레이션 스크립트

**Files:**
- Modify: `package.json`, `README.md`, `src/server/chat/prompt.ts`, `src/server/chat/skips.ts`, `scripts/smoke-llm.ts`
- Test: `tests/unit/prompt.test.ts`, `tests/unit/skips.test.ts`(추가)

**Interfaces / 변경:**
- `package.json`: `"db:migrate": "node --env-file=.env node_modules/drizzle-kit/bin.cjs migrate"`
  - `.env` 가 없으면 Node 가 오류로 끝나는 것이 의도된 동작이다.
  - README "실행" 절에 "새 버전을 받은 뒤 `npm run db:migrate`"를 추가한다.
  - 2단계 병합 뒤 개발 DB 에 `messages` 테이블이 없어 화면이 500 이 났던 사례가 계기다.
- `summarizeState`: 가정 줄의 키도 `JSON.stringify(a.key)` 로 감싼다.
- `skipKey("invalid", …)` 는 zod 경로가 `attrs.` 로 시작하면 `attrs` 까지만 남긴다. AI 가 쓴 속성 이름이 로그에 들어가지 않게 하려는 것이다.
- smoke 스크립트의 집계 라벨을 파이프라인과 맞춘다. 허용 밖 op 는 `unknown_op` 다.

- [ ] **Step 1: 실패하는 테스트**
  - `assumption key with a newline cannot forge a line`
  - `invalid attrs path is reduced to attrs`
- [ ] **Step 2:** `npx vitest run tests/unit/prompt.test.ts tests/unit/skips.test.ts` → FAIL.
- [ ] **Step 3: 구현.**
- [ ] **Step 4:** 같은 명령 → PASS, `npm test`, `npm run lint`, `npx tsc --noEmit`. `.env` 를 수정하거나 출력하지 않는다.
- [ ] **Step 5: Commit** `chore: 마이그레이션 스크립트 .env 읽기와 2단계 남은 개선`

---

### Task 8: E2E — 빠진 정보 흐름

**Files:**
- Create: `tests/e2e/phase3a.spec.ts`
- Modify(필요 시): `tests/e2e/fake-llm.ts`. "RAM 은 32GB" 류 요청에 `update_node` 를 돌려주는 경로는 이미 있다. 새 트리거가 필요하면 기존 패턴으로 추가한다.

- [ ] **Step 1: E2E 를 쓴다.** 가짜 AI 로 s1 구성을 만든다(phase2.spec 의 `setup`/`buildS1` 패턴).
  - `missing info: badge, checklist, form save, unknown`
    1. 대화 끝에 `빠진 정보 N개가 있어요` 가 보인다.
    2. 한 서버 노드의 배지 숫자 k 를 읽고 배지를 클릭한다.
    3. 대화 탭 체크리스트가 펼쳐지고 그 노드 블록 첫 칸에 포커스가 간다.
    4. RAM 을 입력하고 IP 를 `모름` 체크한 뒤 `저장` 한다.
    5. 배지가 k−2 가 되고, 머리 `채워야 할 정보 (N−2)` 가 된다.
    6. 이력 탭 최신 버전이 `직접 입력` 이다.
    7. 설명 탭에서 IP 가 `모름` 이다.
  - `restore brings back missing count`: 위 저장 전 버전으로 되돌리면 배지가 다시 k 가 된다.
  - `reload keeps the reminder line`: 새로고침 뒤에도 대화에 `빠진 정보 N개가 있어요` 가 보인다.
- [ ] **Step 2:** `npm run test:e2e` → 새 테스트 통과, 기존 6개 유지. 고정 sleep(`waitForTimeout`) 금지.
- [ ] **Step 3: Commit** `test: 3A단계 E2E(빠진 정보)`

---

## 3B·3C 로 넘기는 것
- **3B(경고·패턴):**
  - 코드 규칙 + Clef `noul` 판정과 Qwen 경고 문구, `warn` 명령, 경고 배지(`badge.kind:"warn"` 자리 있음)
  - "의도된 구성" 무시
  - 구성 패턴 라이브러리
  - 구간 방화벽 필요 여부
- **3C(설명·용어 사전):**
  - 노드 설명 생성·캐시·무효화, Clef `score` 품질 검사·재작성(최대 2회)
  - 용어 사전 DB·시드·화면·미검수 배지, 본문 용어 풀이
  - §6.8 노드에 대해 물어보기(노드별 질문 → 대화 영역에 새 대화 세션 추가)
