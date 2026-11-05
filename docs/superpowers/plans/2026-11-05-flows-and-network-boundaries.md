# 흐름 보기와 망 경계 표시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 구성도마다 "흐름"(사용자 행동·시스템 흐름의 단계 목록)을 AI가 제안하고 대화로 고치며, 고르면 캔버스에 번호·짧은 설명과 함께 밝히고, 업무망·인터넷망 같은 망 경계를 넘는 연결을 표시·검사한다.

**Architecture:**
- 흐름은 버전이 붙는 `DiagramState` 밖의 새 테이블에 저장한다(설명과 같은 방식). 흐름 명령(add/update/remove_flow)은 같은 JSONL 차례를 타지만, 파이프라인이 `applyCommand` 전에 따로 모아 차례 끝에 저장한다.
- 망 경계는 상태 안에 있다. 새 영역 종류 `network_zone`, 새 노드 종류 `network_link`, 연결의 `payload`·`direction`을 둔다. 경계를 넘는지 판정하는 순수 함수가 경고, 채워야 할 정보, 캔버스 표시에 공통으로 쓰인다.
- 화면은 오른쪽 패널의 "흐름" 탭과 정보 카드의 "지나는 흐름" 목록으로 이루어진다. 캔버스는 흐름 강조(1단계 겹선 재사용), 단계 글자, 경계 점·표시를 그린다.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Drizzle/Postgres, zod, @xyflow/react, Vitest, Playwright(가짜 LLM).

**Spec:** `docs/superpowers/specs/2026-11-04-flows-and-network-boundaries-design.md` — 실행자는 반드시 함께 읽는다.

## Global Constraints

- **사용자 결정(스펙)**
  - 구성과 흐름은 한 차례에 같이 바꾼다.
  - 흐름은 구성도와 따로 저장한다. 되돌리기를 해도 흐름은 남고, 없는 연결을 가리키는 단계만 "끊김"이 된다.
  - 망을 넘는 통신은 방화벽·망연계·VPN 노드를 거치게 그린다.
  - AI가 만든 흐름은 기계 검사를 거치고 "AI 제안" 표시를 붙인다. 사용자가 "맞아요"를 누르면 표시가 사라진다.
  - 흐름 목록은 오른쪽 패널의 새 "흐름" 탭에 둔다. 휴대폰에서는 아래 탭 줄에 들어간다.
  - 단계는 요청 방향만 번호를 붙인다. 응답은 마지막 한 줄(`result`)로 쓴다.
  - 자동 제안은 흐름이 없는 구성도를 처음 그린 차례 뒤 한 번만 한다. 그 밖에는 "흐름 제안받기" 버튼으로 한다.
  - 흐름 상태로 이미지를 내보내는 기능은 넣지 않는다.
  - 캔버스 단계 표시는 "번호 + 짧은 설명"이다(예: `4. 인증 요청`).
  - 망 경계 표시는 평소엔 작은 금색 점 하나다. 흐름을 보거나 그 연결·노드를 고르면 "망 넘음"과 `API ↔`·`파일 →`가 보인다.
- **정한 값**
  - 흐름 id는 명령 `id` 규칙(`/^[a-z0-9][a-z0-9-]{0,63}$/`)을 따른다.
  - 캔버스 짧은 설명은 12자 이내다. 넘으면 자른다(`…`).
  - 한 구성도의 흐름은 최대 20개, 흐름 하나의 단계는 최대 20개다.
  - 자동·버튼 제안은 3~5개다.
  - `direction`은 데이터가 흐르는 방향이다. `one_way` 연결은 from → to로만 지난다.
  - 경계를 넘는 연결의 `payload`·`direction`이 비면 "채워야 할 정보"로 센다. 라벨은 `payload` "전달물", `direction` "방향"이다.
- **1단계 화면 규칙**
  - 색은 tokens.css 토큰으로만 쓰고, `LIGHT_TOKENS`에 짝을 둔다.
  - 내보내기는 평상시 모습이다. 흐름 강조·단계 글자·경계 자세히 표시는 `CHROME`에 넣어 걷는다. 평소 경계 점은 그림에 남긴다.
  - `prefers-reduced-motion`을 따른다.
  - 쌓는 순서는 stacking.ts를 따른다.
  - Tab 한 칸 + 화살표로 움직인다. 누르는 자리는 24px 이상이다.
  - 사용자에게 보이는 글은 쉬운 한국어로 쓴다. 코드 주석은 한국어로 쓴다.
- **작업 환경**
  - worktree `../infra-flows`, 브랜치 `feat/flows`에서 한다. worktree마다 `npm ci`를 하고, `.env`는 복사만 하고 읽지 않는다.
  - 통합 테스트와 E2E는 테스트 DB(5433)를 같이 쓰므로 동시에 돌리지 않는다.
  - 마이그레이션은 `0006`이다. drizzle-kit으로 만든다. 개발 DB 적용과 푸시는 사용자가 요청할 때만 한다.
- **회귀**
  - 1단계 배치 회귀 테스트(`layoutRegression.test.ts`)와 기존 테스트 전체가 통과해야 한다.

## Review Focus

- **흐름 단계가 가리키는 연결이 표시 단계에서 합쳐질 때.** 버스 단순화, 중복 합치기, 접힌 영역으로 다시 이어질 때를 말한다. 합쳐진 표시 연결이 밝아지고 단계 번호는 하나만 붙어야 한다. → Task 7
- **같은 차례에서 새로 만든 연결을 흐름이 가리킬 때.** 차례가 끝난 상태로 검사하므로 받아들여야 한다. → Task 5
- **노드를 지워 흐름 연결이 사라진 뒤 되돌리기로 다시 나타날 때.** 끊김이 저절로 풀려야 한다. 끊김은 저장하지 않고, 볼 때마다 계산한다. → Task 3, Task 4
- **망 영역이 하나도 없는 구성도.** 경계 점, 경고, 채워야 할 정보가 하나도 생기지 않아야 한다. → Task 2
- **흐름 탭에서 흐름을 보는 중에 노드를 클릭할 때.** 흐름 보기가 풀리고 보통 선택으로 바뀐다. 흐름을 다시 고르면 선택이 풀린다. 둘이 동시에 켜지지 않는다. → Task 8

---

### Task 1: 망 영역·망연계 노드·연결 전달물/방향

**Files:**
- Modify: `src/domain/catalog.ts`, `src/domain/types.ts:6`, `src/domain/commands.ts:17,19`, `src/domain/apply.ts:52,68-77`, `src/server/chat/normalize.ts:169-177`, `src/server/chat/prompt.ts`, `src/canvas/display.ts:12,87`, `src/styles/tokens.css`, `src/canvas/exportImage.ts`(LIGHT_TOKENS), `src/ui/NodeInfo.tsx:132-146`
- Test: `tests/unit/commands.test.ts`, `apply.test.ts`, `normalize.test.ts`, `prompt.test.ts`, `display.test.ts`, `tokens.test.ts`, `NodeInfo.test.tsx`

**Interfaces:**
- Produces:
  - `GROUP_KINDS`의 `{ kind: "network_zone", labelKo: "망", zoneToken: "--zone-region", tintToken: "--zone-tint-network", innerDirection: "DOWN", dashed: true }`
  - `NODE_KINDS`의 `nk("network_link", "망연계 솔루션", "network", ["sw"])`
  - `export type EdgePayload = "api" | "file"; export type EdgeDirection = "one_way" | "two_way";` (types.ts)
  - `Edge`에 `payload?: EdgePayload; direction?: EdgeDirection` (types.ts)
  - `add_edge`·`update_edge` 명령에 `payload?: "api"|"file"`, `direction?: "one_way"|"two_way"` (선택)
  - `DisplayEdge`에 `payload?`·`direction?`. 합칠 때는 대표 연결의 값을 쓴다.
  - `summarizeState`의 연결 줄 끝에 ` payload=api direction=two_way`(값이 있을 때만)

- [ ] **Step 1: 테스트를 쓴다.**
  - `commands.test.ts`
    - `add_edge accepts payload and direction`
    - `update_edge rejects payload "ftp"`
  - `apply.test.ts`
    - `add_edge stores payload/direction`
    - `update_edge merges payload/direction and keeps label`
  - `normalize.test.ts`: `payload "API"/"File" → "api"/"file", direction "단방향"/"양방향"/"oneway" → "one_way"/"two_way"`
  - `prompt.test.ts`: `summarizeState prints payload and direction`. 각 종류가 프롬프트에 들어가는 기존 검사도 `network_zone`·`network_link`를 포함한다.
  - `display.test.ts`: `display edge carries payload/direction`
  - `tokens.test.ts`: 예상 영역 색조 목록에 `--zone-tint-network`를 추가하고 명도 대비 4.5:1 이상을 확인한다.
  - `NodeInfo.test.tsx`: `edge info shows 전달물 API and 방향 양방향`
- [ ] **Step 2: 실패를 확인한다.** `npx vitest run tests/unit/commands.test.ts tests/unit/apply.test.ts tests/unit/normalize.test.ts tests/unit/prompt.test.ts tests/unit/display.test.ts tests/unit/tokens.test.ts tests/unit/NodeInfo.test.tsx`
- [ ] **Step 3: 구현한다.**
  - SYSTEM_PROMPT에 다음을 문서로 넣는다.
    - add_edge 예시에 `"payload":"api","direction":"two_way"`를 넣는다.
    - 규칙 두 줄:
      - "업무망·인터넷망처럼 분리된 망은 `network_zone` 영역으로 그리고 망 이름을 label에 쓴다"
      - "서로 다른 망을 잇는 통신은 방화벽(firewall)·망연계 솔루션(network_link)·VPN 노드를 거치게 그리고, 망을 넘는 연결에는 payload와 direction을 쓴다"
  - 새 색조 토큰 값은 대비 검사를 통과하는 보라 계열로 정한다. `LIGHT_TOKENS` 짝도 둔다.
  - NodeInfo 연결 `dl`에 "전달물"(API/파일)과 "방향"(단방향/양방향) 줄을 둔다. 값이 있을 때만 보인다.
- [ ] **Step 4: `npm test`로 PASS를 확인한다.**
- [ ] **Step 5: 커밋한다.** `feat(domain): 망 영역·망연계 노드와 연결의 전달물·방향`

### Task 2: 망 경계 판정·경고·채워야 할 정보

**Files:**
- Create: `src/domain/boundary.ts`
- Modify: `src/domain/warnings.ts`, `src/domain/patterns.ts`(필요하면 patternId), `src/domain/missing.ts:96,136-179`, `src/server/fields.ts:206-250`, `src/ui/chat/MissingChecklist.tsx`, `src/server/chat/prompt.ts:18`(MISSING_FORMAT_NOTE)
- Test: `tests/unit/boundary.test.ts`, `warnings.test.ts`, `missing.test.ts`, `MissingChecklist.test.tsx`, `tests/integration/fields.test.ts`

**Interfaces:**
- Consumes: Task 1의 `network_zone`, `network_link`, `Edge.payload/direction`
- Produces (boundary.ts):
  ```ts
  export const BOUNDARY_NODE_KINDS: ReadonlySet<NodeKind>; // firewall, network_link, vpn
  /** 노드의 가장 가까운 network_zone 조상 id(없으면 null). */
  export function networkZoneOf(state: DiagramState, nodeId: string): string | null;
  /** 구성도에 network_zone 이 하나라도 있고, 두 끝의 망이 서로 다르면(한쪽이 망 밖이어도) true. */
  export function crossesBoundary(state: DiagramState, edge: Edge): boolean;
  /** 경계를 넘고 두 끝 어느 쪽도 경계 노드가 아닌 연결. */
  export function isDirectCrossing(state: DiagramState, edge: Edge): boolean;
  ```
  - 경고 규칙 `network_direct`(level `"warn"`):
    - 문구: `${from}에서 ${to}(으)로 망을 바로 넘어가요.`
    - 안내: `서로 다른 망 사이 통신은 방화벽·망연계 솔루션·VPN 을 거치게 그리세요.`
    - 대상 노드는 `to`이고, `edgeId`를 붙인다.
  - `requiredKeysForEdge(state: DiagramState, edge: Edge): string[]`. 경계를 넘으면 기존 키에 `"payload"`, `"direction"`을 더한다.
  - `FIELD_LABELS.payload = "전달물"`, `FIELD_LABELS.direction = "방향"`
  - `saveFieldsFor` 연결 분기는 `payload`·`direction`을 enum 검증 뒤 저장한다. 값이 아니면 ValidationError다.

- [ ] **Step 1: 테스트를 쓴다.**
  - `boundary.test.ts`
    - `node in 업무망 → zone id; node outside any network_zone → null`
    - `no network_zone in diagram → crossesBoundary false for every edge`
    - `WAS(업무망) → network_link(망 밖) crosses`
    - `network_link → 인증(인터넷망) crosses`
    - `same zone does not cross`
    - `isDirectCrossing true only when neither end is firewall/network_link/vpn`
  - `warnings.test.ts`
    - `network_direct warns on WAS(업무망) → API(인터넷망) direct edge`
    - `no warning through network_link`
  - `missing.test.ts`
    - `crossing edge without payload/direction adds two items labelled 전달물/방향`
    - `filled values clear them`
    - `non-crossing edge unchanged`
  - `MissingChecklist.test.tsx`: `payload and direction render as selects with 쉬운 말 options (API/파일, 단방향/양방향)`
  - `fields.test.ts`(통합)
    - `saves payload/direction on edge`
    - `rejects payload "x"`
- [ ] **Step 2: 실패를 확인한다.**
- [ ] **Step 3: 구현한다.**
  - `computeMissing`의 연결 반복은 키별로 값을 읽는다: `label`은 `edge.label`, `payload`·`direction`은 각 필드.
  - `MISSING_FORMAT_NOTE`에 "연결 전달물·방향은 update_edge 의 payload·direction 으로"를 더한다.
- [ ] **Step 4: `npm test`와 `npm run test:int`를 PASS로 확인한다.** E2E는 동시에 돌리지 않는다.
- [ ] **Step 5: 커밋한다.** `feat(domain): 망을 바로 넘는 연결 경고와 경계 연결의 전달물·방향 채우기`

### Task 3: 흐름 도메인(모양·검사·끊김)

**Files:**
- Create: `src/domain/flows.ts`
- Test: `tests/unit/flows.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type FlowOrigin = "user" | "system";
  export interface FlowStep { edge: string; from: string; short: string; text: string } // edge=연결 id, from=이 단계를 시작하는 노드
  export interface Flow { id: string; name: string; origin: FlowOrigin; summary?: string; result?: string; steps: FlowStep[] }
  export type FlowProblem =
    | { kind: "missing_edge"; step: number }          // 연결이 지금 구성에 없음
    | { kind: "bad_start"; step: number }             // from 이 그 연결의 끝 노드가 아님
    | { kind: "disconnected"; step: number }          // 시작 노드가 앞 단계에서 도달한 노드가 아님(첫 단계 제외)
    | { kind: "against_direction"; step: number };    // one_way 연결을 to → from 으로 지남
  export const FLOW_LIMITS = { flows: 20, steps: 20, short: 12 } as const;
  export function checkFlow(state: DiagramState, flow: Flow): FlowProblem[];
  /** 단계의 도착 노드. */
  export function stepEnd(state: DiagramState, step: FlowStep): string | null;
  /** 이 노드·연결을 지나는 흐름(끊긴 단계는 세지 않는다). */
  export function flowsThrough(state: DiagramState, flows: Flow[], id: string): Flow[];
  /** 캔버스용 짧은 설명: 12자 넘으면 11자 + "…". */
  export function shortLabel(s: string): string;
  /** 단계 설명에 덧붙는 경계 넘김 문장(경계를 안 넘으면 null). 예: "여기서 업무망 → 인터넷망으로 넘어가요(망연계 거침)". */
  export function crossingNote(state: DiagramState, step: FlowStep): string | null;
  ```
  - 검사 규칙:
    - 갈래를 허용한다. 단계의 `from`은 첫 단계의 `from`이거나, 앞선 어느 단계의 도착 노드면 된다.
    - 끊김은 저장하지 않는다. 늘 `checkFlow` 결과로 계산한다.

- [ ] **Step 1: 테스트를 쓴다.** 고정 데이터는 브라우저 → 방화벽 → 웹 → WAS → 망연계 → 인증(인터넷망), WAS → DB다.
  - `valid signup flow has no problems`
  - `step pointing to deleted edge → missing_edge`
  - `from not an endpoint → bad_start`
  - `branch from earlier node allowed`
  - `unreachable start → disconnected`
  - `one_way edge traversed backwards → against_direction`
  - `two_way either way ok`
  - `flowsThrough returns flows touching node, ignoring missing steps`
  - `shortLabel("휴대폰 본인 인증 요청 보냄") === "휴대폰 본인 인증 요…"` (11자 + …)
  - `crossingNote names zones and the boundary node`
- [ ] **Step 2: 실패를 확인한다.**
- [ ] **Step 3: 구현한다.** `crossingNote`는 Task 2의 `networkZoneOf`·`BOUNDARY_NODE_KINDS`를 쓴다. 영역 이름은 영역의 label이다.
- [ ] **Step 4: PASS를 확인한다.**
- [ ] **Step 5: 커밋한다.** `feat(domain): 흐름 모양과 단계 검사`

### Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/0006_*.sql`(drizzle-kit generate), `src/server/flows.ts`, `src/app/api/diagrams/[id]/flows/route.ts`
- Modify: `src/app/(app)/actions.ts`, `src/server/projects.ts`(구성도 복제 시 흐름 복사)
- Test: `tests/integration/flows.test.ts`

**Interfaces:**
- Consumes: Task 3의 `Flow`, `checkFlow`, `FLOW_LIMITS`
- Produces:
  - 테이블 `flows`
    - 열: `id uuid pk defaultRandom`, `diagramId uuid FK diagrams onDelete cascade`, `key text`(흐름 id), `data jsonb $type<Flow>`, `source text $type<"ai"|"user">`, `reviewed boolean default false`, `createdAt`, `updatedAt`
    - 유일 조건: `unique(diagramId, key)`
  - `diagrams.flowsSuggestedAt timestamptz null`. 자동 제안을 한 번만 하기 위한 표식이다.
  - `export interface StoredFlow extends Flow { source: "ai" | "user"; reviewed: boolean; problems: FlowProblem[] }`
  - `listFlows(userId, diagramId): Promise<StoredFlow[]>`. 최신 상태로 `problems`를 계산하고, 만든 순서로 돌려준다.
  - `applyFlowOps(diagramId, state, ops: FlowCommand[], source: "ai"): Promise<{ saved: number; rejected: { id: string; reason: string }[] }>`
    - add는 key가 있으면 거절한다. update/remove는 없으면 거절한다.
    - 저장 전 `checkFlow`에 걸리면 거절한다(`reason`에 문제 종류).
    - 개수가 상한을 넘으면 거절한다.
    - `FlowCommand`는 Task 5에서 정의한다. 이 Task에서는 같은 모양의 로컬 타입으로 시작하고, Task 5가 commands.ts 타입으로 바꾼다.
  - `renameFlow(userId, diagramId, key, name)`, `deleteFlow(userId, diagramId, key)`, `confirmFlow(userId, diagramId, key)`(reviewed=true)
    - 셋 다 `withDiagramLock`을 쓴다. 차례가 진행 중이면 `BusyError`다.
  - `copyFlows(fromDiagramId, toDiagramId)`: 구성도를 복제할 때 부른다.
  - 라우트 `GET /api/diagrams/:id/flows` → `{ flows: StoredFlow[] }` (401/404 매핑은 explain 라우트와 같다)
  - 서버 액션 `renameFlowAction`, `deleteFlowAction`, `confirmFlowAction`. ActionResult 형식은 기존 액션과 같다.

- [ ] **Step 1: 통합 테스트를 쓴다.** `makeOwnedDiagram`을 쓴다.
  - `applyFlowOps saves valid add_flow as ai/unreviewed`
  - `rejects flow with missing edge`
  - `update replaces steps`
  - `remove deletes`
  - `listFlows recomputes problems after the edge is removed in a new version and clears them after restore`
  - `rename/delete/confirm require owner`
  - `confirm sets reviewed`
  - `diagram delete cascades flows`
  - `duplicate copies flows`
  - `more than 20 flows rejected`
- [ ] **Step 2: 실패를 확인한다.** `npm run test:int -- flows`
- [ ] **Step 3: 구현한다.** 스키마를 고치고 `npx drizzle-kit generate`로 0006을 만든다. 메타 저널과 스냅샷도 함께 커밋한다. 이어서 서버 모듈, 라우트, 액션을 만든다.
- [ ] **Step 4: `npm run test:int`와 `npm test`를 PASS로 확인한다.**
- [ ] **Step 5: 커밋한다.** `feat(server): 흐름 저장소와 조회·이름 바꾸기·삭제·확인`

### Task 5: 대화 차례의 흐름 명령

**Files:**
- Modify: `src/domain/commands.ts`, `src/domain/apply.ts`, `src/server/chat/normalize.ts`, `src/server/chat/pipeline.ts:133,243-264,328-377`, `src/server/chat/prompt.ts`(SYSTEM_PROMPT, buildMessages), `src/server/chat/events.ts:238,281`, `src/ui/DiagramWorkspace.tsx:301-306`, `src/ui/chat/lines.ts`, `tests/e2e/fake-llm.ts`
- Test: `tests/unit/commands.test.ts`, `normalize.test.ts`, `prompt.test.ts`, `lines.test.ts`, `tests/integration/pipeline.test.ts`

**Interfaces:**
- Consumes: Task 4의 `applyFlowOps`, `listFlows`
- Produces:
  - 명령
    - `add_flow { id, name, origin: "user"|"system", summary?, result?, steps: { edge, from, short, text }[] }`
    - `update_flow { id, name?, summary?, result?, steps? }`
    - `remove_flow { id }`
  - `export const FLOW_OPS: ReadonlySet<Command["op"]>`, `export type FlowCommand = Extract<Command, { op: "add_flow" | "update_flow" | "remove_flow" }>`, `export function isFlowCommand(c: Command): c is FlowCommand`
  - `isStructural`은 흐름 명령에 false다.
  - `applyCommand`는 흐름 명령을 받으면 `{ ok: true, state }`를 그대로 돌려준다. 클라이언트 재생도 안전해진다.
  - `buildMessages` 입력에 `flows?: Flow[]`. 사용자 메시지의 `현재 구성:` 뒤에 `흐름:` 블록을 넣는다. 줄 형식: `흐름 ${id} [${origin}] "${name}": ${steps.map(s => s.edge).join(" > ")}`.
  - `done` 이벤트와 메타에 `flows?: number`(저장된 흐름 명령 수).
  - 요약 문장에 흐름 수가 있으면 `흐름 N개 바꿨어요`를 덧붙인다(`lines.ts`).

- [ ] **Step 1: 테스트를 쓴다.**
  - `commands.test.ts`
    - `add_flow parses`
    - `steps over 20 rejected`
    - `isStructural(add_flow) === false`
  - `normalize.test.ts`: `flow step edge/from ids are normalized like other ids`
  - `prompt.test.ts`
    - `SYSTEM_PROMPT documents add_flow/update_flow/remove_flow`
    - `buildMessages includes 흐름 block with existing flow ids`
  - `pipeline.test.ts`(통합, 가짜 Qwen)
    - `turn with add_edge + add_flow referencing that new edge saves one version and one flow`
    - `flow-only turn creates no version but saves the flow and done.flows === 1`
    - `invalid flow is reported as skip and not saved`
    - `changed counts only structural`
  - `lines.test.ts`: `summary mentions 흐름 1개 바꿨어요`
- [ ] **Step 2: 실패를 확인한다.**
- [ ] **Step 3: 구현한다.**
  - **명령 걸러 받기:** pipeline `onLine`에서 `parseCommand` 뒤 `isFlowCommand`이면 `pendingFlowOps`에 쌓는다. 그다음 `applied++`, `emit({t:"cmd"})`를 하고 넘어간다.
  - **차례 끝:** 버전 저장 조건을 `structural changes or assumptions > 0`으로 바꾼다. 흐름만 있으면 버전을 만들지 않는다. 이어서 `applyFlowOps(diagramId, finalState, pendingFlowOps, "ai")`를 부른다. 거절된 명령은 기존 `skip`으로 알리고 `skipped`에 더한다.
  - **이어 쓰기:** 이어 쓰기 사이에 모인 흐름 명령을 잃지 않는다. 같은 `pendingFlowOps`를 쓴다.
  - **흐름을 프롬프트에 넣기:** 파이프라인은 프롬프트를 만들 때 `listFlows`로 흐름을 읽어 넘긴다.
  - **규칙 문구:** SYSTEM_PROMPT에 다음 두 줄을 넣는다.
    - "흐름을 바꾸라는 요청이면 구성 명령과 함께 흐름 명령을 쓴다. 단계 edge 는 현재 구성(또는 이번에 만든) 연결 id 만 쓴다."
    - "요청에 흐름 이야기가 없으면 흐름 명령을 쓰지 않는다"
  - **가짜 LLM:** `fake-llm.ts`에 `흐름` 요청 분기를 추가한다. s1 구성의 연결 id를 쓰는 add_flow 한 줄을 돌려준다.
- [ ] **Step 4: `npm test`와 `npm run test:int`를 PASS로 확인한다.**
- [ ] **Step 5: 커밋한다.** `feat(chat): 구성 명령과 같은 차례에 흐름을 만들고 고친다`

### Task 6: AI 흐름 제안(처음 그린 뒤 자동 + 버튼)

**Files:**
- Create: `src/server/flowSuggest.ts`, `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- Modify: `src/server/chat/prompt.ts`(FLOW_SUGGEST_PROMPT, buildFlowSuggestMessages), `tests/e2e/fake-llm.ts`
- Test: `tests/unit/server-flow-suggest.test.ts`, `tests/integration/flows.test.ts`

**Interfaces:**
- Consumes: Task 4·5의 `applyFlowOps`, `listFlows`, `FlowCommand`, JSONL 파서(`createJsonlParser`)
- Produces:
  - `FLOW_SUGGEST_PROMPT`: add_flow JSONL만 쓴다. 사용자 행동 흐름과 시스템·네트워크 흐름을 섞어 3~5개다. 단계 `short`는 12자 이내, `text`는 비전문가용 한 문장, `result`는 응답 한 줄이다.
  - `suggestFlows(userId, diagramId, opts: { auto: boolean; signal? }, deps): Promise<{ ok: true; saved: number } | { ok: false; message: string }>`
    - `auto`이면 `flowsSuggestedAt`이 있거나 흐름이 이미 있을 때 아무것도 하지 않는다(`saved: 0`).
    - 실행하면 `flowsSuggestedAt = now()`를 적는다.
    - `withDiagramLock` 안에서 돌린다. 차례가 진행 중이면 `{ ok:false, message:"지금은 구성도를 그리는 중이에요. 잠시 뒤 다시 눌러 주세요." }`
    - Qwen 호출은 30초 제한에 1회 재시도한다. 거절된 흐름은 버린다.
    - 하나도 못 만들면 `{ ok:false, message:"흐름을 만들지 못했어요. 다시 시도해 주세요." }`
  - `POST /api/diagrams/:id/flows/suggest` body `{ auto?: boolean }` → `{ saved }` 또는 4xx/409, `maxDuration = 150`

- [ ] **Step 1: 테스트를 쓴다.**
  - 단위(가짜 deps)
    - `auto skips when flowsSuggestedAt set`
    - `auto skips when flows exist`
    - `button runs even when flows exist and appends`
    - `invalid lines dropped`
    - `zero valid → failure message`
  - 통합: `suggest saves 3 flows as ai/unreviewed and stamps flowsSuggestedAt`
- [ ] **Step 2: 실패를 확인한다.**
- [ ] **Step 3: 구현한다.** 가짜 LLM에는 `FLOW_SUGGEST_PROMPT` 시스템 메시지 분기를 추가한다. s1 연결로 add_flow 3줄을 돌려준다.
- [ ] **Step 4: PASS를 확인한다.**
- [ ] **Step 5: 커밋한다.** `feat(server): 구성도 흐름 제안`

### Task 7: 캔버스 흐름 강조·단계 글자·경계 표시

**Files:**
- Modify: `src/canvas/Canvas.tsx`(CanvasProps, Flow 안 `sel` 결정), `src/canvas/EdgeLayer.tsx`, `src/canvas/edgeLabels.ts`, `src/canvas/emphasis.ts`, `src/canvas/edges.css`, `src/styles/tokens.css`, `src/canvas/exportImage.ts`(CHROME)
- Test: `tests/unit/emphasis.test.ts`, `edgeLabels.test.ts`, `EdgeLayer.test.tsx`, `Canvas.test.tsx`, `exportImage.dom.test.tsx`

**Interfaces:**
- Consumes: Task 1의 `DisplayEdge.payload/direction`, Task 2의 `crossesBoundary`, Task 3의 `Flow`, `shortLabel`
- Produces:
  - `CanvasProps.flow?: { steps: { edge: string; n: number; short: string }[] } | null`. 흐름을 보는 중이면 값이 있다. 이때 `options.selectedId`는 null이다(Task 8이 보장).
  - `export function flowEmphasis(edges: DisplayEdge[], stepEdgeIds: string[]): Emphasis` (emphasis.ts)
    - 원래 연결 id는 `sourceEdgeIds`로 표시 연결에 맞춘다.
    - 노드 집합은 지나는 연결의 두 끝이다.
  - `EdgeLayerProps.flowSteps?: { displayEdgeId: string; n: number; short: string }[]`
    - 같은 표시 연결에 여러 단계가 걸리면 가장 작은 번호 하나를 쓰고, 설명은 첫 단계 것을 쓴다.
    - 흐름 강조는 선택 강조와 같은 겹선·빛을 쓴다(`data-mode="select"` 재사용).
  - `export function stepLabels(steps: { text: string; points: Pt[]; labelAt?: Pt }[], avoid: Rect[]): PlacedLabel[]` (edgeLabels.ts)
    - 글자는 `${n}. ${short}`다.
    - `labelBox`/`tooClose`/`ROW_GAP`을 재사용해 서로, 그리고 `avoid` 노드 상자(+NODE_RING)와 겹치지 않게 선을 따라 민다.
    - 자리가 없으면 `${n}`만 남긴다.
    - 흐름을 보는 동안 단계 연결의 일반 연결 이름은 숨긴다.
  - `EdgeLayerProps.crossing?: ReadonlySet<string>`(경계를 넘는 표시 연결 id)
    - 평소에는 연결 중점(`labelAt`)에 반지름 3의 `--boundary-mark` 점을 그린다. 클래스는 `edge-boundary-dot`이고 내보내기에 남는다.
    - 고른 대상에 닿은 연결이거나 흐름 단계 연결이면 `edge-boundary-tag`를 그린다. 내용은 "망 넘음" 알약 + `API ↔`/`파일 →`(payload·direction이 있을 때)이고, `CHROME`에서 걷는다.
  - 토큰 `--boundary-mark`(금색 계열, `--accent`와 같은 값). `LIGHT_TOKENS` 짝도 둔다.
  - 단계 글자 클래스는 `edge-step-label`이고 `CHROME`에서 걷는다.

- [ ] **Step 1: 테스트를 쓴다.**
  - `emphasis.test.ts`
    - `flowEmphasis maps merged source ids to the display edge`
    - `nodes are step endpoints`
  - `edgeLabels.test.ts`
    - `stepLabels places "1. 가입 정보 보냄" without overlapping node rects or each other`
    - `falls back to "3" when crowded`
  - `EdgeLayer.test.tsx`
    - `flowSteps render edge-step-label per display edge with smallest n`
    - `step edges overlaid, others dimmed`
    - `normal labels hidden on step edges`
    - `crossing dot rendered without selection; tag only when selected or in flow`
    - `tag shows "망 넘음" and "API ↔"`
  - `Canvas.test.tsx`: `flow prop dims zones without step nodes and nodes outside the flow`
  - `exportImage.dom.test.tsx`: `export keeps boundary dot, removes step labels/tag/overlay`
- [ ] **Step 2: 실패를 확인한다.**
- [ ] **Step 3: 구현한다.**
  - `Flow` 안에서 `sel`은 `flow ? flowEmphasis(...) : emphasisOf(display.edges, selected)`다. `lit`과 노드 흐림이 그대로 따라온다.
  - `crossing` 집합은 Canvas에서 `crossesBoundary`로 원래 연결을 판정한 뒤 표시 연결 id로 바꿔 넘긴다.
- [ ] **Step 4: `npm test`로 PASS를 확인한다.** 배치 회귀 테스트도 포함한다.
- [ ] **Step 5: 커밋한다.** `feat(canvas): 흐름 단계 강조·번호 설명과 망 경계 점·표시`

### Task 8: "흐름" 탭·지나는 흐름·연동

**Files:**
- Create: `src/ui/flows/FlowPanel.tsx`, `src/ui/flows/useFlows.ts`, `src/ui/flows/flows.module.css`
- Modify: `src/ui/RightPanel.tsx:13-14,101-108`, `src/ui/MobileTabBar.tsx`, `src/ui/DiagramWorkspace.tsx`, `src/ui/NodeInfo.tsx`
- Test: `tests/unit/FlowPanel.test.tsx`, `useFlows.test.tsx`, `RightPanel.test.tsx`, `NodeInfo.test.tsx`, `DiagramWorkspace.test.tsx`

**Interfaces:**
- Consumes: Task 4의 GET 라우트·액션, Task 6의 suggest 라우트, Task 3의 `flowsThrough`·`crossingNote`·`checkFlow` 결과(`problems`), Task 7의 `CanvasProps.flow`
- Produces:
  - `useFlows({ diagramId, live, busy, versionKey })`
    - 돌려주는 것: `{ flows: StoredFlow[]; activeKey: string | null; setActive(key|null); suggest(): Promise<void>; suggesting: boolean; rename(key, name); remove(key); confirm(key); refresh() }`
    - `versionKey`(최신 버전 번호)가 바뀌거나 차례가 끝나면 다시 불러온다.
    - 차례가 끝났고(`done`), `changed > 0`이고, 흐름이 없을 때 `POST suggest {auto:true}`를 한 번 보낸다. 서버가 한 번만 하도록 막으므로 클라이언트는 중복 호출을 신경 쓰지 않는다.
  - `Tab`에 `"흐름"`(대화·설명·이력 뒤), `MOBILE_VIEWS`와 `ICONS`에 `"흐름"`
  - FlowPanel
    - 맨 위에 `흐름 제안받기` 버튼(제안 중에는 "만드는 중…").
    - "사용자 행동", "시스템·네트워크" 두 묶음.
    - 행은 이름, `AI 제안` 배지(`isUnreviewedAi({source, reviewed})`, sr 문구 재사용), 끊김이면 `끊김` 표시, RowMenu(이름 바꾸기·삭제·맞아요)로 이루어진다.
    - 행을 고르면 아래에 단계 목록이 보인다: `①…` + `text` + `crossingNote`. 마지막에 `result`.
    - 단계를 누르면 그 연결로 카메라를 옮긴다(`focusRequest`).
    - 끊긴 흐름에는 `흐름 다시 맞추기` 버튼이 있다. 대화로 `"${name}" 흐름을 지금 구성에 맞게 다시 맞춰 줘`를 보낸다.
    - 흐름이 없을 때 빈 상태 문구: `아직 흐름이 없어요. "흐름 제안받기"를 누르면 AI가 주요 흐름을 만들어 드려요.`
    - `!live || busy`이면 바꾸는 동작을 막는다.
  - NodeInfo: 노드·연결 정보에 `이 노드를 지나는 흐름` / `이 연결이 들어간 흐름` 절을 둔다. 흐름 이름 칩을 누르면 `setActive(key)`를 하고 흐름 탭으로 간다.
  - DiagramWorkspace
    - 흐름을 고르면 `options.selectedId = null`로 만들고 `Canvas.flow`를 넘긴다. 노드를 고르면 흐름 보기를 푼다.
    - Esc를 누르면 흐름 보기를 푼다.

- [ ] **Step 1: 테스트를 쓴다.**
  - `FlowPanel.test.tsx`
    - `groups by origin`
    - `AI 제안 badge until 맞아요`
    - `끊김 row shows 다시 맞추기 which calls onRepair with name`
    - `selecting shows numbered steps with crossing note and result`
    - `empty state text`
    - `actions disabled when busy`
  - `useFlows.test.tsx`
    - `auto-suggest once after done with changed>0 and no flows`
    - `not when flows exist`
    - `refetch on versionKey change`
  - `RightPanel.test.tsx`: `흐름 tab present and switches`
  - `NodeInfo.test.tsx`: `lists flows through node and click activates`
  - `DiagramWorkspace.test.tsx`
    - `activating a flow clears node selection and passes flow to Canvas`
    - `selecting a node clears active flow`
- [ ] **Step 2: 실패를 확인한다.**
- [ ] **Step 3: 구현한다.** 이름 바꾸기와 삭제 대화상자는 `dialogs.tsx`의 `DialogView`/`RowMenu`를 재사용한다. 패턴은 SessionPicker를 따른다.
- [ ] **Step 4: `npm test`로 PASS를 확인한다.**
- [ ] **Step 5: 커밋한다.** `feat(ui): 흐름 탭과 지나는 흐름`

### Task 9: E2E·화면 확인·문서

**Files:**
- Create: `tests/e2e/flows.spec.ts`
- Docs worktree: `website/docs/guide/architecture.md`(명령 표, 데이터 모델, 캔버스 절)

- [ ] **Step 1: E2E를 쓴다.** 가짜 LLM s1 쇼핑몰과 흐름 분기를 쓴다.
  - `after first draw, flows tab lists suggested flows with AI 제안`
  - `selecting a flow shows step labels "1." on canvas and dims others`
  - `맞아요 removes badge`
  - `chat "흐름" request adds a flow`
  - `node info lists flows through node`
  - `망 경계 sample: crossing dot visible, tag on select, network_direct warning shown`
    - 가짜 LLM에 `망분리` 분기를 둔다. 업무망·인터넷망, 망연계, 직접 연결 하나를 그린다.
- [ ] **Step 2: 실행한다.** `npm run test:int`가 끝난 뒤 `npm run test:e2e`를 돌린다. 기존 E2E가 탭 추가 등으로 깨지면 의도한 변경인지 확인하고 고친다.
- [ ] **Step 3: 화면을 확인한다.** 빌드한 앱을 3300 포트로 띄워 망분리 예시와 회원가입 흐름을 캡처하고, 단계 글자가 겹치지 않는지 직접 본다.
- [ ] **Step 4: `npm run lint`와 `npx tsc --noEmit`을 돌린다.**
- [ ] **Step 5: 커밋한다.** main 합치기, 문서 동기화, 마이그레이션 적용, 푸시는 사용자 확인 뒤에 한다.
