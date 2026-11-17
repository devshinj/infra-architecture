# 연결선 경로와 가독성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 줄기를 누르면 가지를 색·꼬리표로 펼쳐 한 가닥을 따라가게 하고, 평소 화면·내보낸 그림의 연결 이름이 겹치지 않게 하며, 모든 선 사이 16px 간격과 교차를 지킨다.

**Architecture:** 이름 자리는 ELK 레이어드 배치에 "평소 화면에 보이는 이름"의 크기를 주어 확보하고(실험으로 `mergeEdges` 줄기가 유지됨을 확인), 배치가 끝난 뒤 순수 함수 `placeRestingLabels`가 실제 자리를 정해 `Layout.labels`에 담는다. 화면·내보내기·측정은 모두 이 결과를 쓴다. 줄기 펼치기는 순수 상태 모듈 `trunk.ts`(전이·먼 끝·색)와 `EdgeLayer`의 공유 조각 누르는 자리·겹선·꼬리표로 만들고, `DiagramWorkspace`가 선택과 배타적인 `trunk` 상태를 가진다.

**Tech Stack:** TypeScript, React 19, Next.js, elkjs(`elk.bundled.js`), Vitest(node·jsdom), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-16-edge-routing-readability-design.md`

## Global Constraints

- 평행선 최소 간격 16px(`LINE_GAP`), 노드 끝 `END_TRIM` 8px 제외. 외부 열 선만 16px 줄을 못 찾으면 `ROW_GAP_TIGHT`(5px)로 물러서는 예외 유지. 물러서기 전에 틈 벌리기를 먼저 시도.
- 규칙이 부딪히면 이 차례로 앞의 것이 이긴다: 노드 통과 0 → 평소 화면 이름 겹침 0 → 교차 기준선 이하 → 평행선 16px → 이름 알약 통과 기준선 이하 → 꺾임(늘어도 됨, 기준선 새로 잼).
- 이름 상자(`labelBox`)는 노드 상자+`NODE_RING`, 펼친 영역 이름 알약(`zoneHeadPill`), 다른 이름 상자와 `ROW_GAP`(4px) 미만으로 붙지 않고, 자기 줄기 식구(자기와 공유 조각을 같이 쓰는 선)가 아닌 선의 토막과 겹치지 않는다.
- 자리를 확보하는 이름 = 평소 화면에 보이는 이름(같은 글자·같은 끝 묶음은 "<이름> ×N" 하나). 출구선(`egress`) 이름은 늘 보임 대상·측정에서 뺀다.
- 고정 노드(`pinned`)는 절대 움직이지 않는다. 고정 노드가 있으면 틈 벌리기를 하지 않고, 자리 없는 이름은 겹쳐도 보이며 `labelBlocked`로 센다.
- 펼침 색 6개를 돌려 쓴다. 색은 `src/styles/tokens.css` 토큰으로만, 흰 바탕 짝은 `exportImage.ts` `LIGHT_TOKENS`에.
- 내보낸 그림은 평상시 모습: 펼침 겹선·꼬리표·공유 조각 누르는 자리·흐림을 걷고, 이름은 `Layout.labels` 그대로(합친 이름과 구성원 이름이 같이 들어가는 일 0).
- 고른 노드·펼친 줄기 때 풀려 나오는 이름은 그린 뒤 빈자리를 찾고(`mergedLabels`·`placeAlong`), 자리가 없으면 겹쳐도 보인다.
- 줄기 펼치기는 포인터 기능. 공유 조각을 `roving.ts` 화살표 이동에 넣지 않는다. 펼친 뒤 설명 탭 목록은 키보드로 고를 수 있다. 공유 조각 누르는 자리 굵기 24px.
- 흐름 보기 중에는 줄기 펼치기를 하지 않는다. `prefers-reduced-motion`에서는 전환을 끈다.
- 커밋은 작업마다, 메시지 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- 펼친 동안 대화 차례·되돌리기·가져오기로 구성도가 바뀌어 펼친 선이 사라지면 → 펼침이 풀린다(빈 강조가 남지 않는다). Task 8에서 검사.
- 먼 쪽 끝이 접힌 영역이면 → 꼬리표에 그 영역 이름이 나온다. Task 6·7에서 검사.
- 표시 연결이 여러 원래 연결을 합친 것(`sourceEdgeIds`·`origins`)이면 → 가지를 눌러 좁혀도 지금 연결 고르기와 같은 설명 탭이 뜬다. Task 8에서 검사.
- "연결 이름은 마우스를 올릴 때만"을 켠 채 내보내면 → 지금처럼 이름이 모두 들어가고 자리는 겹치지 않는다(배치는 옵션과 상관없이 같은 자리). Task 4에서 검사.
- 고정 노드가 있는 구성도 → 노드는 고정 좌표 그대로이고 이름은 모두 있다(겹치면 `labelBlocked`에 든다). Task 3에서 검사.

---

### Task 1: 사용자포털 기준 구성도와 지금 값 기록

**Files:**
- Create: `tests/fixtures/layout/state-portal.json`
- Modify: `tests/fixtures/layout/baseline.json`
- Modify: `tests/unit/layoutRegression.test.ts` (머리 주석에 기록 이유 한 줄)

**Interfaces:**
- Produces: 기준 구성도 이름 `state-portal`(기존 `load()`가 `state-` 접두로 파일을 읽는다).

- [ ] **Step 1: 기준 구성도 만들기.** 개발 DB(`docker exec infrasketch-db psql -U postgres -d infrasketch`)에서 구성도 `9aaa19d9-71bd-47a7-b153-0cdbeb404404`의 `number=3` `state`를 꺼낸다. 다음을 걷어 `state-portal.json`으로 저장한다.
  - 모든 노드의 `attrs`를 `{}`로, `unknown`을 지운다.
  - 노드·영역 `label`·`sub`, 연결 `label` 속 IPv4(`/\b\d{1,3}(\.\d{1,3}){3}\b/`)와 `10.178.224.x` 꼴(`/\b\d{1,3}(\.\d{1,3}){2}\.x\b/`)을 `10.0.0.x`로 바꾼다. `klid-`로 시작하는 호스트명 토막은 `host-`로 바꾼다.
  - `warnings`, `ignoredWarnings`, `assumptions`는 비운다(배치와 무관).
- [ ] **Step 2: 지금 값을 기준선에 넣기.** `baseline.json`에 `"state-portal": { "default": …, "expanded": … }`를 지금 코드의 `defaultViewLayout`·모두 펼친 화면 측정값으로 넣는다(다른 항목과 같은 방법으로 잰다).
- [ ] **Step 3: 확인.** Run: `npx vitest run tests/unit/layoutRegression.test.ts` — Expected: 모두 PASS(새 항목 포함).
- [ ] **Step 4: 커밋.** `test(layout): 사용자포털 기준 구성도를 회귀 기준에 넣는다`

### Task 2: 평소 화면 이름 배치 함수와 측정값

**Files:**
- Create: `src/canvas/restingLabels.ts`
- Modify: `src/canvas/edgeLabels.ts` (`alongCandidates` export, `restingLabelClusters`가 `restingLabelGroups`를 쓰게)
- Modify: `src/canvas/layoutMetrics.ts` (`rectHit` export, `LayoutMetrics`에 두 값)
- Test: `tests/unit/restingLabels.test.ts`, `tests/unit/layoutMetrics.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // restingLabels.ts
  export interface RestingLabelInput { id: string; label: string; from: string; to: string; points: Pt[]; egress?: boolean }
  export interface RestingLabelGroup { text: string; edgeIds: string[] } // edgeIds 는 id 정렬, 하나면 text=label, 둘 이상이면 "<label> ×N"
  export interface PlacedRestingLabel { edgeIds: string[]; text: string; x: number; y: number } // edgeIds[0] 이 이름을 단 선
  export interface RestingPlacement { placed: PlacedRestingLabel[]; blocked: string[] } // blocked: 합법 자리가 없어 첫 후보에 둔 이름의 edgeIds[0]
  export function restingLabelGroups(items: RestingLabelInput[]): RestingLabelGroup[]
  export function placeRestingLabels(
    layout: Pick<Layout, "nodes" | "groups" | "edges">,
    items: RestingLabelInput[],
    groupLabels: Record<string, string>,
    preferred?: ReadonlyMap<string, Pt>, // 묶음 대표 선 id → 먼저 볼 자리(ELK 이름 가운데)
  ): RestingPlacement
  // layoutMetrics.ts
  export function rectHit(s: { a: Pt; b: Pt }, r: Rect, pad?: number): boolean
  // LayoutMetrics 에 추가: labelViolations: number; labelMissing: number
  ```

- [ ] **Step 1: 실패하는 테스트 쓰기** (`tests/unit/restingLabels.test.ts`)
  - `restingLabelGroups`: 같은 이름 "NFS"인 세 선이 같은 `to`를 쓰면 `{ text: "NFS ×3", edgeIds: [정렬된 셋] }` 하나. 이름이 같아도 끝을 함께 안 쓰면 따로. `egress: true`인 선은 결과에 없다.
  - `placeRestingLabels`, 노드 상자 피하기: 선 가운데가 다른 노드 상자 안에 들어가는 배치에서 놓인 이름의 `labelBox`가 그 노드의 `NODE_RING` 상자와 `ROW_GAP` 미만으로 붙지 않는다.
  - 남의 선 피하기: 이름 후보 자리를 가로지르는 다른 선이 있으면 그 선의 토막과 이름 상자가 겹치지 않는 자리로 비킨다. 자기와 공유 조각을 같이 쓰는 선의 토막은 겹쳐도 된다.
  - 이름끼리: 같은 자리를 원하는 두 이름의 상자가 `ROW_GAP` 이상 떨어진다.
  - 알약: 펼친 영역(자식이 있는 영역)의 `zoneHeadPill` 자리와 붙지 않는다.
  - 대표 고르기: 묶음은 함께 쓰는 끝 노드 가운데에 가장 가까운 선에 이름을 단다(지금 `restingLabelClusters` 규칙).
  - `preferred`가 합법이면 그 자리를 그대로 쓴다.
  - 자리가 없으면 첫 후보에 두고 `blocked`에 그 선 id가 든다. 이름은 결과에서 빠지지 않는다.
- [ ] **Step 2: 실패 확인.** Run: `npx vitest run tests/unit/restingLabels.test.ts` — Expected: FAIL(모듈 없음).
- [ ] **Step 3: 구현.** 묶음 소속 계산은 지금 `restingLabelClusters`의 union 로직을 `restingLabelGroups`로 옮기고, `restingLabelClusters`는 그것을 써서 결과를 그대로 내게 한다(동작 불변). 후보는 `preferred` → `alongCandidates(points, 가운데)`. 남의 선 판정은 `rectHit`로 이름 상자와 각 토막을 잰다. 줄기 식구는 0.5px 안으로 겹치는 토막을 가진 선들이다.
- [ ] **Step 4: 측정값 추가.** `measureLayout`에 선택 인자 `labels?: { placed: PlacedRestingLabel[]; items: RestingLabelInput[] }`를 더하고, 주면 `labelViolations`(「지킬 것」 위반 이름 수)와 `labelMissing`(이름이 있고 출구선이 아닌 선 가운데 `placed`의 어느 `edgeIds`에도 없는 수)을 센다. 안 주면 둘 다 0. `layoutMetrics.test.ts`에 겹친 이름 하나 → `labelViolations: 1`, 빠진 이름 하나 → `labelMissing: 1` 테스트를 더한다.
- [ ] **Step 5: 통과 확인.** Run: `npx vitest run tests/unit/restingLabels.test.ts tests/unit/layoutMetrics.test.ts tests/unit/edgeLabels.test.ts` — Expected: PASS.
- [ ] **Step 6: 커밋.** `feat(labels): 평소 화면 이름을 노드·알약·이름·남의 선과 겹치지 않게 놓는 함수`

### Task 3: 배치에서 이름 자리 확보

**Files:**
- Modify: `src/canvas/layout.ts` (ELK 이름, 결과에 `labels`·`labelBlocked`, `labelAt` 갱신, 이름용 틈 벌리기)
- Modify: `src/canvas/layoutMetrics.ts` (`viewLayout`이 `layout.labels`로 이름 측정값을 채움)
- Modify: `tests/unit/layoutRegression.test.ts`, `tests/fixtures/layout/baseline.json`
- Test: `tests/unit/layout.test.ts`

**Interfaces:**
- Consumes: Task 2의 `restingLabelGroups`, `placeRestingLabels`, `PlacedRestingLabel`.
- Produces: `Layout`에 `labels: PlacedRestingLabel[]`, `labelBlocked: string[]`. 이름을 단 선(`labels[i].edgeIds[0]`)의 `LaidOutEdge.labelAt`은 그 이름 자리다. 묶음에 숨은 선의 `labelAt`은 지금처럼 경로 가운데다.

- [ ] **Step 1: 실패하는 테스트 쓰기** (`tests/unit/layout.test.ts`)
  - 한 노드에서 같은 층 세 노드로 가는, 이름이 다른 세 선: 결과 `labels`가 셋이고 서로·노드와 「지킬 것」을 지킨다. 그리고 세 선의 첫 점이 같다(줄기 유지).
  - 이름 없는 같은 그래프보다 결과 높이가 크거나 같다.
  - 같은 이름·같은 끝 세 선: `labels`에 `"<이름> ×3"` 하나.
  - 고정 노드 하나가 있는 그래프: 그 노드 좌표가 고정값 그대로이고, 이름 있는 모든 비출구선이 `labels` 어딘가에 든다.
  - 출구선 이름은 `labels`에 없다.
- [ ] **Step 2: 실패 확인.** Run: `npx vitest run tests/unit/layout.test.ts` — Expected: 새 테스트 FAIL.
- [ ] **Step 3: ELK에 이름 주기.** `runElk`가 ELK 선을 만들 때(`elkById.get(lca)!.edges!.push(...)`), `restingLabelGroups(g.edges 중 이름 있는 것)`의 각 묶음 대표(`edgeIds[0]`)에만 `labels: [{ text, width: textWidth(text, 11) + 3, height: LABEL_LINE, layoutOptions: { "elk.edgeLabels.placement": "CENTER" } }]`를 단다. 결과의 이름 좌표(컨테이너 오프셋 더함)의 가운데를 `preferred`로 모은다.
- [ ] **Step 4: 마지막 자리 정하기.** 모든 후처리(외부 열, 고정 노드 `elbowRoute`, 묶음 가로선)가 끝난 뒤 `placeRestingLabels(out, items, groupLabels, preferred)`를 부르고 결과를 `out.labels`·`out.labelBlocked`에 담는다. `labelAt`을 위 Interfaces대로 바꾼다.
- [ ] **Step 5: 이름용 틈 벌리기.** `labelBlocked`가 있고 고정 노드가 없으면, 막힌 이름 자리의 y를 포함하는 가로 틈을 `openGap`으로 `LINE_GAP`씩 최대 `GAP_ROUNDS`번 벌려 다시 배치하고, 노드 통과 0·교차 수가 처음보다 늘지 않는 것 가운데 `labelBlocked`가 가장 적은 것을 쓴다.
- [ ] **Step 6: 측정에 이름 넣기.** `viewLayout`이 `measureLayout`에 넘길 수 있게 `MeasuredView`에 `labels`(placed·items)를 담는다. `layoutRegression.test.ts`의 두 테스트(기본·펼친 화면)에 "모든 기준 구성도 `labelViolations` 0, `labelMissing` 0"을 더한다.
- [ ] **Step 7: 기준선 새로 재기.** 꺾임(`bends`)과 크기(`aspect`)는 새 값으로 `baseline.json`을 갱신하고, 교차·평행·노드 통과·이름 알약은 이전 값 이하인지 확인한다(나빠지면 Step 5의 수용 조건을 고친다). `layoutRegression.test.ts` 머리 주석에 전후 값과 "이름 자리 확보로 꺾임·크기가 늘었다(사용자 결정)"를 적는다.
- [ ] **Step 8: 통과 확인.** Run: `npx vitest run tests/unit/layout.test.ts tests/unit/layoutRegression.test.ts tests/unit/layout-order.test.ts` — Expected: PASS.
- [ ] **Step 9: 커밋.** `feat(layout): 평소 화면 이름 자리를 배치에서 확보하고 Layout.labels 로 돌려준다`

### Task 4: 화면과 내보내기가 같은 이름 자리를 쓴다

**Files:**
- Modify: `src/canvas/EdgeLayer.tsx` (평소 화면 `resting`을 `layout.labels`로)
- Modify: `src/canvas/exportImage.ts` (`edgeLabels`, `neutralizeClone`)
- Test: `tests/unit/EdgeLayer.test.tsx`, `tests/unit/exportImage.test.ts`, `tests/unit/exportImage.dom.test.tsx`

**Interfaces:**
- Consumes: Task 3의 `Layout.labels`.
- Produces: `edgeLabels(layout: Pick<Layout, "labels">): EdgeLabel[]`(인자에서 `edges` 제거, `{ id: edgeIds[0], label: text, x, y }`). `neutralizeClone`은 `g[data-edge-id]` 안의 기존 `.edge-label`을 모두 지우고 `labels`로 다시 채운다.

- [ ] **Step 1: 실패하는 테스트 쓰기.**
  - `EdgeLayer.test.tsx`: 아무것도 고르지 않았을 때 그려지는 `.edge-label`의 글자·좌표가 `layout.labels`와 같다("NFS ×3" 하나, 숨은 구성원 이름 없음).
  - `exportImage.dom.test.tsx`: 노드를 고른 상태(구성원 이름이 따로 보이는 상태)의 복제본을 `neutralizeClone(clone, edgeLabels(layout))`하면 `.edge-label`은 `layout.labels`와 정확히 같은 글자·좌표이고, "NFS ×3"과 "NFS"가 같이 있지 않다.
  - `exportImage.test.ts`: `diagramBounds`가 `layout.labels` 이름 상자를 포함한다.
- [ ] **Step 2: 실패 확인.** Run: `npx vitest run tests/unit/EdgeLayer.test.tsx tests/unit/exportImage.test.ts tests/unit/exportImage.dom.test.tsx` — Expected: FAIL.
- [ ] **Step 3: 구현.** `EdgeLayer`의 `resting`은 `layout.labels`에서 `shown`(edgeIds[0] → text)·`hidden`(나머지 edgeIds)을 만든다. 평소 화면 이름 좌표는 `labelAt`(Task 3에서 이미 그 자리)을 그대로 쓴다. `exportDiagramImage`의 호출부를 새 시그니처로 바꾼다.
- [ ] **Step 4: 통과 확인.** 같은 명령 — Expected: PASS. 이어서 `npx vitest run tests/unit/Canvas.test.tsx tests/unit/edgeLabels.test.ts` PASS.
- [ ] **Step 5: 커밋.** `fix(labels): 화면과 내보낸 그림이 같은 이름 자리를 쓰고 합친 이름이 겹쳐 들어가지 않게 한다`

### Task 5: 모든 선 16px 간격과 교차

**Files:**
- Create: `src/canvas/separate.ts`
- Modify: `src/canvas/layout.ts` (후처리에서 호출, 외부 열 5px 물러서기 전에 틈 벌리기)
- Modify: `tests/unit/layoutRegression.test.ts`, `tests/fixtures/layout/baseline.json`
- Test: `tests/unit/separate.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // separate.ts
  export function separateParallels(
    edges: Map<string, Pt[]>,              // 선 id → 꺾은선(바꾼 것을 새 Map 으로 돌려준다)
    ends: Map<string, [string, string]>,
    boxes: Map<string, Rect>,              // 노드·접힌 영역 상자(통과 판정)
    minGap: number,                        // 16
  ): Map<string, Pt[]>
  ```
  공유 조각(0.5px 안) 쌍은 건드리지 않는다. 0.5 < 간격 < minGap으로 나란한 안쪽 토막 쌍을 찾아 한쪽을 수직 방향으로 밀어 간격을 맞추고 앞뒤 토막을 이어 직교를 유지한다. 밀어서 노드 통과가 생기거나 교차가 늘면 그 밀기는 버린다.

- [ ] **Step 1: 실패하는 테스트 쓰기** (`tests/unit/separate.test.ts`): 8px 간격으로 나란한 두 세로 토막이 16px 이상으로 벌어지고, 두 선 모두 끝점이 그대로이며 직교다. 같은 자리(0px)의 공유 토막은 그대로다. 밀면 노드 상자를 지나는 경우는 그대로 둔다. 결과의 `measureLayout(...).crossings`가 입력보다 크지 않다.
- [ ] **Step 2: 실패 확인.** Run: `npx vitest run tests/unit/separate.test.ts` — Expected: FAIL.
- [ ] **Step 3: 구현하고 `layout.ts`에 넣기.** 외부 열 처리 뒤, 이름 자리 정하기(Task 3 Step 4) 앞에서 고정 노드가 없을 때 `separateParallels`를 부른다. 외부 열 선이 `LINE_GAP` 줄을 못 찾아 `ROW_GAP_TIGHT`로 물러서기 전에 그 틈을 `openGap`으로 벌리는 시도를 먼저 한다.
- [ ] **Step 4: 기준 바꾸기.** `layoutRegression.test.ts`의 기본 화면 테스트에 `parallelPx === 0`(모든 기준 구성도, state-25·state-portal 포함), `state-portal` 기본 화면 `crossings`가 Task 1 기록값보다 작음을 더한다. 펼친 화면은 기준선 이하. 새 값으로 `baseline.json`을 갱신하고 머리 주석에 전후 값을 적는다.
- [ ] **Step 5: 통과 확인.** Run: `npx vitest run tests/unit/separate.test.ts tests/unit/layout.test.ts tests/unit/layoutRegression.test.ts` — Expected: PASS.
- [ ] **Step 6: 커밋.** `feat(layout): 모든 선을 16px 이상 띄우고 교차를 줄인다`

### Task 6: 줄기 펼치기 상태 모듈

**Files:**
- Create: `src/canvas/trunk.ts`
- Test: `tests/unit/trunk.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface TrunkClick { segKey: string; edgeIds: string[]; at: Pt } // edgeIds: 누른 조각을 지나는 표시 연결
  export interface TrunkSelection { segKey: string; edgeIds: string[]; at: Pt }
  export interface TrunkStep { trunk: TrunkSelection | null; select: string | null }
  export function nextTrunk(cur: TrunkSelection | null, click: TrunkClick): TrunkStep
  export function farEnd(points: Pt[], at: Pt, from: string, to: string): string
  export const TRUNK_COLOR_COUNT = 6;
  export function trunkColor(i: number): number // i % 6, 1..6 이 아니라 0..5
  export function branchSpot(points: Pt[], at: Pt, segments: { edgeIds: string[]; d: string }[], edgeId: string): Pt | null
  ```

- [ ] **Step 1: 실패하는 테스트 쓰기** (`tests/unit/trunk.test.ts`)
  - `nextTrunk(null, {edgeIds: [a,b,c]})` → `{ trunk: {…edgeIds [a,b,c]}, select: null }`.
  - 같은 `segKey`를 다시 누르면 `cur` 그대로.
  - `{a,b,c}`를 펼친 상태에서 `[b,c]` 조각 → `{b,c}`로 다시 펼침.
  - `{a,b,c}`에서 `[a]`만 지나는 조각 → `{ trunk: null, select: "a" }`.
  - `{a,b,c}`에서 `[d,e]`(대상 밖) 조각 → `{d,e}`로 새로 펼침.
  - `nextTrunk(null, {edgeIds: [a]})` → `{ trunk: null, select: "a" }`.
  - `farEnd`: 출발 쪽 줄기 위 점이면 `to`, 도착 쪽 줄기 위 점이면 `from`, 정확히 가운데면 `to`.
  - `trunkColor(0..7)` → `0,1,2,3,4,5,0,1`.
  - `branchSpot`: 누른 점에서 먼 끝 쪽으로 가며 처음 만나는 `edgeIds`가 `[edgeId]` 하나인 조각의 시작점에서 `LABEL_OFFSET`(14px)만큼 들어간 점. 그런 조각이 없으면 `null`.
- [ ] **Step 2: 실패 확인.** Run: `npx vitest run tests/unit/trunk.test.ts` — Expected: FAIL.
- [ ] **Step 3: 구현.** `farEnd`는 꺾은선을 따라 `at`까지의 길이와 전체 길이의 반을 비교한다.
- [ ] **Step 4: 통과 확인.** 같은 명령 — Expected: PASS.
- [ ] **Step 5: 커밋.** `feat(trunk): 줄기 펼치기 전이·먼 끝·색 차례를 순수 함수로`

### Task 7: EdgeLayer — 공유 조각 누르기, 펼침 겹선·꼬리표, 토큰, 내보내기

**Files:**
- Modify: `src/canvas/EdgeLayer.tsx`
- Modify: `src/canvas/edges.css`
- Modify: `src/styles/tokens.css`, `src/canvas/exportImage.ts` (`LIGHT_TOKENS`, `CHROME`)
- Test: `tests/unit/EdgeLayer.test.tsx`, `tests/unit/exportImage.dom.test.tsx`

**Interfaces:**
- Consumes: Task 6의 `TrunkSelection`, `TrunkClick`, `farEnd`, `trunkColor`, `branchSpot`; 기존 `tagSpots`.
- Produces: `EdgeLayerProps`에
  ```ts
  trunk?: TrunkSelection | null;
  onTrunkClick?(c: TrunkClick): void;
  /** 노드·영역 id → 꼬리표에 쓸 이름(접힌 영역이면 영역 이름). */
  endName?(id: string): string;
  ```
  클래스: 공유 조각 누르는 자리 `edge-seg-hit`(`data-seg-key`), 펼침 겹선 묶음 `edge-trunk`(선마다 `g[data-trunk-edge][data-trunk-color="0..5"]`), 꼬리표 `edge-trunk-tag`. 토큰 `--edge-trunk-0` … `--edge-trunk-5`, `--edge-trunk-tag-text`.

- [ ] **Step 1: 실패하는 테스트 쓰기** (`tests/unit/EdgeLayer.test.tsx`)
  - 공유 조각마다 `.edge-seg-hit`가 하나씩 있고, 혼자 가는 조각에는 없다.
  - `.edge-seg-hit`를 누르면 `onTrunkClick`이 그 조각의 `segKey`·`edgeIds`로 불리고 `onSelect`는 불리지 않는다.
  - `trunk`를 주면 `edge-trunk` 아래에 펼친 선마다 겹선이 있고 `data-trunk-color`가 입력 차례대로 `0,1,2`다. 선 종류 클래스(`edge-line--async` 등)도 그대로 붙는다.
  - 꼬리표 글자가 `endName(farEnd(...))`이다. 먼 끝이 접힌 영역이면 영역 이름이다.
  - 펼친 동안 펼친 선의 이름이 각각 보이고, 펼친 선이 아닌 선은 `edge--dim`이다.
  - 공유 조각에 마우스를 올리면 그 조각의 선 전부가 호버 겹선(`edge-emph[data-mode="hover"]`)으로 보이고 색·꼬리표는 없다.
  - `exportImage.dom.test.tsx`: 펼친 상태의 복제본을 `neutralizeClone`하면 `.edge-trunk`, `.edge-trunk-tag`, `.edge-seg-hit`가 남지 않는다.
- [ ] **Step 2: 실패 확인.** Run: `npx vitest run tests/unit/EdgeLayer.test.tsx tests/unit/exportImage.dom.test.tsx` — Expected: FAIL.
- [ ] **Step 3: 구현.** 공유 조각 누르는 자리는 선별 `edge-hit`보다 위(4번 층 뒤)에 그려 먼저 잡히게 하고 굵기는 `--hit`(24px)를 쓴다. 누른 점은 `svg.getScreenCTM().inverse()`로 캔버스 좌표로 바꿔 `at`에 담는다. `trunk`가 있으면 강조 집합을 `{ edges: trunk.edgeIds, nodes: 두 끝들 }`로 두고 선택처럼 흐린다. 꼬리표 자리는 `branchSpot` 결과를 첫 후보로 `tagSpots`에 넘겨 서로·노드와 겹치지 않게 한다. 토큰 6색(어두운 바탕)과 `LIGHT_TOKENS` 짝은 선 종류 색(`--edge-request` 등)과 구분되는 값으로 정한다. `CHROME`에 `edge-trunk`, `edge-trunk-tag`, `edge-seg-hit`를 더한다.
- [ ] **Step 4: 통과 확인.** 같은 명령 — Expected: PASS. `npx vitest run tests/unit/segments.test.ts tests/unit/useHoverEmphasis.test.tsx` PASS.
- [ ] **Step 5: 커밋.** `feat(trunk): 줄기를 누르면 가지를 색과 먼 끝 꼬리표로 펼친다`

### Task 8: 펼침 상태 연결 — 선택과 배타, 풀기, 설명 탭 목록

**Files:**
- Modify: `src/ui/DiagramWorkspace.tsx` (`trunk` 상태)
- Modify: `src/canvas/Canvas.tsx` (`trunk`·`onTrunkChange` props, `EdgeLayerPortal`에 전달, Esc·빈 곳)
- Modify: `src/ui/RightPanel.tsx`, `src/ui/NodeInfo.tsx` (줄기 목록)
- Test: `tests/unit/DiagramWorkspace.test.tsx`, `tests/unit/Canvas.test.tsx`, `tests/unit/NodeInfo.test.tsx`, `tests/unit/RightPanel.test.tsx`

**Interfaces:**
- Consumes: Task 6 `nextTrunk`, `TrunkSelection`; Task 7 `EdgeLayerProps.trunk`·`onTrunkClick`·`endName`.
- Produces:
  ```ts
  // CanvasProps
  trunk?: TrunkSelection | null;
  onTrunkChange?(t: TrunkSelection | null): void;
  // RightPanelProps · NodeInfoProps
  trunk?: { edges: { id: string; from: string; to: string; label?: string; color: number }[]; onPick(id: string): void };
  ```
  목록 머리 글자는 `이 줄기의 선 ${n}개`, 줄은 `${출발 이름} → ${도착 이름}`과 이름이 있으면 ` · ${이름}`.

- [ ] **Step 1: 실패하는 테스트 쓰기.**
  - `Canvas.test.tsx`: `onTrunkClick` → `nextTrunk` 결과의 `trunk`로 `onTrunkChange`, `select`가 있으면 `onSelect(select)`. Esc와 빈 곳 누르기는 펼친 상태에서 `onTrunkChange(null)`. 펼친 동안 펼친 선의 두 끝이 아닌 노드는 `node--dimmed`, 두 끝 노드와 그 조상 영역은 밝다.
  - `DiagramWorkspace.test.tsx`:
    - 펼친 동안 노드를 고르면 펼침이 풀린다. 펼치면 선택이 풀린다.
    - 흐름 보기 중에는 `trunk`가 Canvas에 넘어가지 않는다.
    - 새 서버 상태를 받아 펼친 선 가운데 하나라도 없어지면 펼침이 풀린다(Review Focus 1).
    - 펼치면 오른쪽 설명 탭이 열린다.
  - `NodeInfo.test.tsx`: `trunk`를 주면 `이 줄기의 선 3개` 머리와 줄 3개(버튼)가 있고, 줄을 누르면 `onPick(id)`. 버튼은 Tab으로 닿는다.
  - 가지를 눌러 좁힌 표시 연결이 원래 연결 여럿을 합친 것이어도, 지금 연결 고르기와 같은 설명 탭 내용이 뜬다(Review Focus 3).
- [ ] **Step 2: 실패 확인.** Run: `npx vitest run tests/unit/Canvas.test.tsx tests/unit/DiagramWorkspace.test.tsx tests/unit/NodeInfo.test.tsx tests/unit/RightPanel.test.tsx` — Expected: 새 테스트 FAIL.
- [ ] **Step 3: 구현.** 노드·영역 흐림은 `Canvas`가 강조 집합으로 정하므로(`emphasisOf`·`litZones`), 펼친 동안은 `Canvas`가 `{ edges: trunk.edgeIds, nodes: 그 선들의 from·to }`를 강조 집합으로 써서 노드 흐림과 `EdgeLayerPortal`의 `emphasis`에 함께 넘긴다. `DiagramWorkspace`가 `trunk`를 `useState`로 갖고, `setOptions`로 `selectedId`를 non-null로 바꾸는 모든 길에서 `trunk`를 비운다. 서버 상태를 채택할 때(`setCurrent(latest)` 근처) 펼친 `edgeIds`가 새 표시 그래프에 다 있지 않으면 비운다. `endName`은 Canvas가 표시 그래프의 노드·영역 이름으로 만든다. 목록 줄의 출발·도착 이름은 표시 그래프 이름을 쓴다.
- [ ] **Step 4: 통과 확인.** 같은 명령 — Expected: PASS. 이어서 `npm test` 전체 PASS.
- [ ] **Step 5: 커밋.** `feat(trunk): 펼친 줄기를 선택과 배타로 두고 설명 탭에 선 목록을 보인다`

### Task 9: e2e와 전후 보고

**Files:**
- Create: `tests/e2e/trunk.spec.ts`
- Modify: `tests/e2e/*.spec.ts` (이름 자리·구성도 크기 변화로 깨지는 기대값만)

**Interfaces:**
- Consumes: Task 7 클래스(`edge-seg-hit`, `edge-trunk`, `edge-trunk-tag`), Task 8 목록 글자.

- [ ] **Step 1: e2e 쓰기** (`tests/e2e/trunk.spec.ts`): 가짜 LLM으로 공유 조각이 생기는 구성도를 그린다(`[data-seg-shared="true"]`가 있는 요청을 고른다; 쇼핑몰 S1에 없으면 `fake-llm.ts`에 그런 요청을 더한다). 확대한 뒤 `.edge-seg-hit` 하나를 누르면 `.edge-trunk-tag`가 지나는 선 수만큼 보이고 설명 탭에 `이 줄기의 선 N개`가 나온다. 가지를 누르면 `.edge-trunk`가 사라지고 연결 하나를 고른 상태가 된다. Esc로 풀린다. 펼친 채 「이미지 저장 → SVG」로 받은 파일에 `edge-trunk`가 없다.
- [ ] **Step 2: 전체 e2e 돌리기.** Run: `npx playwright test --reporter=line` — Expected: 모두 PASS. 다른 워크트리에서 테스트 DB를 쓰지 않을 때 돌린다. 이름 자리·크기 변화로 기대값이 바뀐 곳은 의도한 변경인지 확인하고 고친다.
- [ ] **Step 3: 전후 보고 만들기.** 같은 입력(샘플 5개, state-25~200, state-portal)의 측정값 전후 표와, 사용자포털(v3·v4) 흰 바탕 PNG 전후 한 쌍을 job tmp에 만들어 사용자에게 보인다(만드는 법: 테스트 DB에 상태를 넣고 「이미지 저장」으로 받는 일회용 spec, 커밋하지 않는다).
- [ ] **Step 4: 커밋.** `test(e2e): 줄기 펼치기와 펼친 상태가 내보낸 그림에 남지 않음을 확인한다`
