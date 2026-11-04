# 구성도 배치 조화 1단계 — 선택 강조와 선 간격 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 노드·영역·연결을 고르면 이어진 것이 확실히 도드라지게 한다. 평소 화면에서 서로 다른 선이 16px 미만으로 붙지 않게 한다. 영역 이름을 읽을 수 있게 한다. 이 측정값들을 회귀 테스트로 남긴다.

**Architecture:**
- **배치 측정.** 배치 결과(`Layout`)를 재는 순수 함수 모듈 `layoutMetrics.ts`를 둔다. 실측 입력(샘플 5개, state-25/50/100/200)을 테스트 고정 데이터로 넣고, 기준선과 목표를 단위 테스트로 지킨다.
- **선택 강조.** 그리는 쪽(`EdgeLayer`)은 층을 나눠 그린다.
  - 바닥 선, 그다음 강조 겹선, 그 위에 움직임 층, 맨 위에 화살표·누르는 자리·이름을 놓는다.
  - 고른 동안 이어진 선은 자기 종류 모양으로 겹쳐 그린다.
  - 노드와 영역의 흐림은 `Canvas`가 `emphasis.ts`의 집합으로 정한다.
- **이름 합치기.** 순수 함수 `edgeLabels.ts`가 같은 이름을 합친 이름 배치를 계산한다.

**Tech Stack:** React 19, TypeScript, @xyflow/react, elkjs, Vitest(jsdom/node), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-layout-harmony-stage1-design.md` — 실행자는 반드시 함께 읽는다.

## Global Constraints

- 색은 `src/styles/tokens.css` 토큰으로만 쓴다. 새 토큰은 모두 `src/canvas/exportImage.ts`의 `LIGHT_TOKENS`에도 둔다. 빠지면 기존 단위 테스트가 잡는다.
- 이미지 내보내기 결과는 늘 평상시 모습이다. 강조 겹선, 흐림 클래스, 영역 흐림이 남지 않는다. 연결 이름은 모두 들어간다. 이름 합치기는 화면에서 고른 동안에만 적용한다.
- `prefers-reduced-motion: reduce`에서는 전환을 끈다. 빛은 정지한 모양이라 남긴다.
- 쌓는 순서는 `stacking.ts`를 따른다: 영역 0~8, 선 층 9, 노드 10.
- 흐름 표시 움직임은 지금처럼 동작한다. 노드가 40개를 넘으면 고른 것과 닿은 묶음만 움직인다.
- 접근성은 그대로 유지한다: Tab 한 번 + 화살표, 누르는 자리 24px, `ariaLabels.ts`.
- 사용자에게 보이는 글은 한국어다. 코드 주석은 기존 파일 관례(한국어)를 따른다.
- 파일은 CRLF일 수 있다. 스크립트로 치환할 때는 `\r?\n`을 처리한다.
- 작업은 새 worktree(`../infra-layout-stage1`, 브랜치 `feat/layout-stage1`)에서 한다. worktree마다 `npm ci`를 하고 junction은 쓰지 않는다.
- 통합 테스트와 E2E는 테스트 DB(5433)를 같이 쓰므로 동시에 돌리지 않는다.
- 강조 값의 시작점(스펙): 이어진 선 2.5px, 빛 폭 6px·흐림 2.4px·불투명 0.35, 화살표 6.5. 흐린 선 0.12, 흐린 노드 0.18, 흐린 영역 0.35. 호버는 이어진 선 1.8px·빛 없음, 나머지 0.45.
- 평행 기준: 서로 다른 선이 16px 미만(0.5px 초과)으로 나란한 길이가 0이어야 한다. 각 선의 양 끝 8px은 뺀다(`END_TRIM = 8`, 내가 정한 값). 공유 조각(간격 0.5px 이하)은 평행으로 치지 않는다.
- 영역 이름 글자는 `clamp(11px, 10px / zoom, 19px)`로 정한다(캔버스 좌표 기준). 머리 칸 30px 안에서만 커진다.

## Review Focus

- 접힌 영역을 고를 때: 접힌 영역 상자에 붙은 연결이 겹선으로 밝아지고, 그 영역과 바깥 영역은 흐리지 않는다. → Task 3·4 테스트
- 합쳐진 연결(`sourceEdgeIds`가 여럿)의 원래 연결 id를 고를 때: 그 표시 연결 하나만 겹선이 된다. → Task 4 테스트
- 경로를 못 찾아 평범한 꺾은선이 된 연결(`degraded`)이나 고정 위치 노드의 연결을 고를 때: 겹선과 이름이 그 경로를 따른다. → Task 4·5 테스트
- 고른 상태에서 흰 바탕으로 내보낼 때: 겹선, 영역 흐림, 합친 이름이 없고 원래 이름이 모두 있다. → Task 4·5 테스트
- 같은 이름의 연결 가운데 일부는 고른 노드에서 나가고 일부는 들어올 때: 방향과 상관없이 한 번만 쓰고, 고른 노드 쪽에 놓는다. → Task 5 테스트

---

### Task 1: 배치 측정 모듈과 기준선 테스트

**Files:**
- Create: `src/canvas/layoutMetrics.ts`
- Create: `tests/fixtures/layout/state-25.json`, `state-50.json`, `state-100.json`, `state-200.json`. `C:\Users\devsh\Desktop\new-study\infra-layout-recon\public\recon\`에서 그대로 복사한다.
- Create: `tests/fixtures/layout/baseline.json`
- Create: `tests/unit/layoutMetrics.test.ts`, `tests/unit/layoutRegression.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface LayoutMetrics {
    crossings: number;          // 두 선이 서로의 안쪽에서 직각으로 만나는 점 수(양 끝 1px 제외)
    sharedPx: number;           // 간격 0.5px 이하로 겹친 길이
    parallelPx: number;         // 서로 다른 선이 0.5 < 간격 < minGap 으로 나란한 길이(각 선 양 끝 END_TRIM 제외)
    throughNode: number;        // 끝점이 아닌 노드(또는 접힌 영역) 상자 안쪽을 지나는 선 수
    bends: number;              // 꺾임 수 합
    aspect: number;             // width / height
  }
  export const END_TRIM = 8;
  export function measureLayout(layout: Layout, ends: Record<string, [string, string]>, minGap = 16): LayoutMetrics;
  export function defaultViewLayout(state: DiagramState): Promise<{ layout: Layout; ends: Record<string, [string, string]> }>;
  ```
  - `defaultViewLayout`은 `layoutDiagram(buildDisplayGraph(st, defaultDisplayOptions(st)), {})`의 결과와 표시 연결의 `[from, to]`를 돌려준다. 노드 40개를 넘으면 접힌 기본 화면이 된다.
  - 측정 알고리즘은 recon `scripts/recon/measure.mjs` `analyze()`의 교차·평행 계산을 옮기되, 두 가지를 바꾼다.
    - 평행 기준을 `minGap`으로 한다.
    - 각 선에서 첫 점과 마지막 점으로부터 `END_TRIM` 안쪽 부분은 평행 길이에서 뺀다.

- [ ] **Step 1: 작은 합성 배치로 측정 테스트를 쓴다** (`tests/unit/layoutMetrics.test.ts`)
  - `parallel lines 12px apart over 100px count as 100 parallel px`
    - 두 세로선 x=0, x=12, 둘 다 y 0→116.
    - 끝 8px을 빼면 겹친 길이는 100이다.
    - 기대값: `parallelPx === 100`, `sharedPx === 0`.
  - `lines 16px apart are not parallel`: 위와 같되 간격 16. 기대값: `parallelPx === 0`.
  - `identical segments count as shared, not parallel`: 간격 0. 기대값: `sharedPx > 0`, `parallelPx === 0`.
  - `perpendicular crossing counts once`: 십자 두 선. 기대값: `crossings === 1`.
  - `edge through a non-endpoint node is counted`: 기대값: `throughNode === 1`.
- [ ] **Step 2: `npx vitest run tests/unit/layoutMetrics.test.ts`를 돌려 실패를 확인한다.** 모듈이 없다는 오류로 실패해야 한다.
- [ ] **Step 3: `measureLayout`과 `defaultViewLayout`을 구현한다.**
- [ ] **Step 4: 같은 명령으로 PASS를 확인한다.**
- [ ] **Step 5: 기준선을 기록한다.**
  - 일회성 스크립트를 쓴다(scratchpad에 두고 커밋하지 않는다).
  - 입력 9개(`fx("s1")`…`fx("s5")`, state-25/50/100/200)마다 두 값을 잰다.
    - `defaultViewLayout`의 `measureLayout(…, 16)`.
    - 모두 펼친 화면(`collapsed: new Set()`)의 `measureLayout(…, 16)`.
  - 결과를 `baseline.json`에 `{ "<input>": { "default": LayoutMetrics, "expanded": LayoutMetrics } }` 형태로 저장한다.
- [ ] **Step 6: 회귀 테스트를 쓴다** (`tests/unit/layoutRegression.test.ts`). 입력마다 다음을 확인한다.
  - `default` 화면에서
    - `crossings <= baseline.crossings`
    - `throughNode === 0`
    - `bends <= baseline.bends * 1.05`
  - `expanded` 화면에서
    - `parallelPx <= baseline.parallelPx`
    - `crossings <= baseline.crossings * 1.05`
  - 평행 0 목표는 Task 2에서 추가한다.
  - ELK 적재가 느리므로 파일 맨 위에서 import한다(`tokens.test.ts` 주석 참고). 테스트 제한 시간은 30초로 둔다.
- [ ] **Step 7: `npx vitest run tests/unit/layoutRegression.test.ts`로 PASS를 확인한다.**
- [ ] **Step 8: 커밋한다.** `test(canvas): 배치 측정 모듈과 기준선 회귀 테스트`

### Task 2: 평소 화면 평행선 16px

**Files:**
- Modify: `src/canvas/layout.ts:27` (`CHANNEL_STEP`), `src/canvas/layout.ts:39` (`elk.spacing.edgeEdge`)
- Modify: 실측에서 원인으로 확인된 곳. 예: `src/canvas/segments.ts`의 `normalize` 1px 합치기, 외부 열 통로(`layout.ts` 451~540).
- Modify: `tests/unit/layoutRegression.test.ts`, `tests/fixtures/layout/baseline.json`

**Interfaces:**
- Consumes: Task 1의 `measureLayout`, `defaultViewLayout`, `END_TRIM`.

- [ ] **Step 1: 목표 테스트를 추가한다.** `default view has no parallel lines closer than 16px`
  - 입력: 샘플 5개, state-25, state-50, state-100. 모두 `defaultViewLayout`.
  - 기대값: `measureLayout(...).parallelPx === 0`.
- [ ] **Step 2: 돌려서 실패를 확인하고, 입력별 `parallelPx`를 기록한다.**
- [ ] **Step 3: 간격 값을 올린다.** `CHANNEL_STEP = 16`, `"elk.spacing.edgeEdge": "16"`.
- [ ] **Step 4: 남은 평행 구간이 어디서 생기는지 찾아 고친다.**
  - 측정 함수에 디버그용 쌍 목록을 잠시 출력해서 원인을 본다.
  - 고칠 수 있는 원인의 예: ELK가 영역 경계를 넘는 선끼리 붙여 놓는 곳, 외부 통로가 ELK 선과 나란한 곳.
  - **멈춤 조건:** 배치 방향이나 줄바꿈을 바꿔야만 없앨 수 있다면 고치지 않는다. 해당 입력과 쌍을 기록해 보고하고, 사용자 판단을 받는다(3단계 몫).
- [ ] **Step 5: 회귀 테스트 전체를 돌린다.** 기준선(교차·꺾임·노드 관통 0)이 나빠지지 않았는지 확인한다.
  - 교차나 꺾임이 기준선을 넘으면 그 수치를 보고하고 멈춘다.
  - 나아진 값은 `baseline.json`에 새로 적는다. 기준선은 낮추기만 한다.
- [ ] **Step 6: `npm test`를 돌려 PASS를 확인한다.** `layout.test.ts`의 기존 배치 기대값이 간격 변화 때문에 바뀌면, 의도한 변경인지 확인하고 고친다.
- [ ] **Step 7: 커밋한다.** `fix(layout): 평소 화면에서 서로 다른 선을 16px 이상 벌린다`

### Task 3: 강조 토큰과 노드·영역 흐림

**Files:**
- Modify: `src/styles/tokens.css`, `src/canvas/exportImage.ts` (`LIGHT_TOKENS`, `NEUTRAL_SWAPS`)
- Modify: `src/canvas/emphasis.ts`, `src/canvas/Canvas.tsx:343-352`, `src/canvas/GroupBox.tsx`, `src/canvas/canvas.css:59`, `src/canvas/edges.css:4`
- Test: `tests/unit/emphasis.test.ts`, `tests/unit/Canvas.test.tsx`, `tests/unit/exportImage.dom.test.tsx`

**Interfaces:**
- Produces:
  - 토큰
    - `--edge-request-lit`, `--edge-async-lit`, `--edge-replication-lit`, `--edge-aux-lit`: 종류별 밝은 색. 같은 색 계열이어야 한다. 요청선 시작값은 `#B9C8DE`.
    - `--edge-glow`: 시작값 `#AFC3E0`.
    - 다섯 개 모두 `LIGHT_TOKENS`에 흰 바탕용 짝을 둔다.
  - `export function litZones(parentOf: (id: string) => string | null, emph: Emphasis, selectedId: string | null): Set<string>`
    - `emph.nodes`의 모든 id와 `selectedId`(영역이면)에 대해, 그 id가 영역이면 자기 자신을 넣고, 모든 조상 영역을 넣는다.
  - `GroupBoxData.dimmed?: boolean` → `.group--dimmed`.

- [ ] **Step 1: `litZones` 테스트를 쓴다** (`emphasis.test.ts`)
  - `lit zones are ancestors of emphasized nodes`: 노드 a가 subnet ⊂ vpc 안에 있으면 `{subnet, vpc}`.
  - `a selected zone and its ancestors stay lit`: 고른 id가 영역이면 그 영역과 조상이 남는다.
  - `collapsed zone that is an edge endpoint is lit`: 접힌 영역 id가 `emph.nodes`에 있으면 그 영역이 남는다.
- [ ] **Step 2: Canvas 테스트를 쓴다** (`Canvas.test.tsx`)
  - `selection dims zones without any linked node`: 이어진 노드가 없는 영역에는 `.group--dimmed`가 붙고, 이어진 노드를 가진 영역에는 붙지 않는다.
  - `hover does not dim zones`: 호버만 있을 때는 영역을 흐리지 않는다. 내가 정한 것: 호버는 선택보다 약하게.
- [ ] **Step 3: 내보내기 테스트를 쓴다** (`exportImage.dom.test.tsx`)
  - `export clears group--dimmed`
  - `every new edge token has a light pair`: 기존 전수 테스트가 있으면 그것으로 충분하다.
- [ ] **Step 4: 실패를 확인한다.** `npx vitest run tests/unit/emphasis.test.ts tests/unit/Canvas.test.tsx tests/unit/exportImage.dom.test.tsx`
- [ ] **Step 5: 구현한다.**
  - `litZones`를 만든다.
  - `Canvas`에서 `sel`이 있을 때 `litZones`에 없는 영역에 `dimmed: true`를 준다. `parentOf`는 `display.groups`/`display.nodes`의 parent를 쓴다.
  - CSS 값을 바꾼다.
    - `.group--dimmed { opacity: 0.35 }`
    - `.node--dimmed { opacity: 0.18 }`
    - `.edge--dim { opacity: 0.12 }`
    - `.group`에 opacity 전환 0.35s를 넣고, 움직임 줄이기에서는 끈다.
  - `NEUTRAL_SWAPS`에 `["group--dimmed", null]`을 추가한다.
  - 토큰을 추가한다.
- [ ] **Step 6: `npm test`로 PASS를 확인한다.**
- [ ] **Step 7: 커밋한다.** `feat(canvas): 고르면 이어지지 않은 영역도 흐리고 흐림을 더 깊게`

### Task 4: 강조 겹선 층(선택·호버)과 갈림점·움직임 층

**Files:**
- Modify: `src/canvas/EdgeLayer.tsx`, `src/canvas/edges.css`, `src/canvas/exportImage.ts` (`CHROME`)
- Test: `tests/unit/EdgeLayer.test.tsx`, `tests/unit/motion.test.tsx`, `tests/unit/exportImage.dom.test.tsx`

**Interfaces:**
- Consumes: Task 3의 토큰 `--edge-*-lit`, `--edge-glow`.
- Produces: DOM 계약. E2E와 Task 5가 이 계약에 기댄다.
  - SVG 안의 층 순서
    1. `g.edge-base`: 지금의 묶음·조각·갈림점.
    2. `g.edge-emph[data-mode="select"|"hover"]`: 이어진 표시 연결마다 `g[data-emph-edge=<id>]` 하나. 그 안에 다음을 둔다.
       - `path.edge-emph__glow`: select일 때만.
       - `path.edge-emph__line.edge-line--<kind>`: 종류 모양(점선·겹선 등)을 그대로 쓴다.
       - `path.edge-emph__arrow`.
    3. `g.edge-motion`: 조각마다 `g.edge-motion__seg[data-motion-seg=<key>]`. 흐림 클래스는 바닥 조각과 같은 규칙을 따르되, 이어진 선이 지나는 조각은 흐리지 않는다.
    4. 지금의 `g.edge[data-edge-id]`: 화살표, 누르는 자리, 이름.
  - 고른 동안 바닥 조각과 바닥 화살표의 흐림
    - 이어진 선이 하나도 지나지 않으면 지금처럼 `edge--dim`을 쓴다.
    - 이어진 선이 지나면 `edge--under`를 쓴다. 바닥 선만 0.12로 흐리고 움직임은 따로 남는다.
  - 갈림점 `circle[data-junction]`: 고른 동안 겹선의 점 위에 있지 않으면 흐린다.

- [ ] **Step 1: 테스트를 쓴다** (`EdgeLayer.test.tsx`, 기존 `fanOutLayout` 활용)
  - `selecting a node overlays each incident edge once with its own kind`
    - `selectedId: "w1"`.
    - `[data-emph-edge="e1"]`이 하나 있다. `[data-emph-edge="e2"]`는 없다.
    - 겹선 path에 `edge-line--request` 클래스가 있다.
  - `async edge on a shared request trunk is overlaid as async`
    - e2를 `async`로 바꾸고 e2를 고른다.
    - 겹선에 `edge-line--async` 클래스가 있다.
  - `junction off the selected path is dimmed`: 갈래 끝 쪽에 갈림점이 있는 배치로 만든다. 고른 경로 밖의 갈림점에는 `edge--dim`이 붙는다.
  - `trunk under the overlay is dimmed but its motion is not`
    - `motion: true`로 둔다.
    - 공유 조각의 바닥 `g.edge-seg`에는 `edge--under`가 있다.
    - `[data-motion-seg]` 조각은 `g.edge-motion` 아래에 있고 흐림 클래스가 없다.
  - `hover overlays without glow`: `hoverId: "w1"`이면 `.edge-emph[data-mode="hover"]`이 생기고 `.edge-emph__glow`는 0개다.
  - `selecting an original id of a merged edge overlays the display edge`: `sourceEdgeIds: ["a","b"]`인 표시 연결에서 `selectedId: "b"`를 주면 그 표시 연결 하나가 겹선이 된다.
  - `degraded edge is overlaid along its elbow`: `degraded: true` 연결을 고르면 겹선의 `d`가 그 points와 같다.
- [ ] **Step 2: 움직임 테스트를 확인한다** (`motion.test.tsx`). 움직임 컨테이너가 `g.edge-motion` 아래로 옮겨져도 `startBundleMotion`이 `data-motion-seg`로 찾는지 본다. 기존 테스트가 통과하면 추가하지 않는다.
- [ ] **Step 3: 내보내기 테스트를 쓴다** (`exportImage.dom.test.tsx`). `export removes emphasis overlay`: 고른 상태를 복제해 `neutralizeClone`을 거치면 `.edge-emph`이 0개이고 `edge--under`가 남지 않는다.
- [ ] **Step 4: 실패를 확인한다.** `npx vitest run tests/unit/EdgeLayer.test.tsx tests/unit/exportImage.dom.test.tsx`
- [ ] **Step 5: 구현한다.**
  - **그리는 쪽**
    - EdgeLayer 렌더를 위 층 순서로 나눈다.
    - 빛은 SVG `filter` 대신 CSS로 준다: `.edge-emph__glow { stroke: var(--edge-glow); stroke-width: 6; opacity: .35; filter: blur(2.4px); }`. 복제본 id 지우기와 부딪치지 않는다.
    - 겹선 굵기: select 2.5px, hover 1.8px.
    - 겹선 색: `.edge-emph .edge-line--request { stroke: var(--edge-request-lit) }` 식으로 종류별로 준다.
    - 복제(replication) 겹선의 가운데 줄(core)도 지금처럼 그린다.
  - **흐림**
    - 호버 흐림은 지금처럼 `edge--faded`(0.45)를 쓴다.
    - 호버 겹선은 이어진 선에만 그린다.
  - **내보내기**
    - `CHROME`에 `"edge-emph"`를 추가한다.
    - `NEUTRAL_SWAPS`에 `["edge--under", null]`을 추가한다.
  - **움직임 줄이기:** 새 전환도 끈다.
- [ ] **Step 6: `npm test`로 PASS를 확인한다.**
- [ ] **Step 7: 커밋한다.** `feat(canvas): 고른 선을 제 종류 모양으로 굵게 겹쳐 그리고 은은한 빛을 준다`

### Task 5: 같은 연결 이름 합치기

**Files:**
- Create: `src/canvas/edgeLabels.ts`
- Modify: `src/canvas/EdgeLayer.tsx` (이름 그리기)
- Test: `tests/unit/edgeLabels.test.ts`, `tests/unit/EdgeLayer.test.tsx`, `tests/unit/exportImage.dom.test.tsx`

**Interfaces:**
- Consumes: `Layout["edges"]`, `DisplayEdge[]`, 선택된 표시 노드 id와 그 상자 `Rect`.
- Produces:
  ```ts
  export interface PlacedLabel { text: string; x: number; y: number; edgeIds: string[] }
  /** 고른 노드에 이어진 연결의 이름 배치. 같은 이름(글자 그대로)은 하나로 합치고 2개 이상이면 "<이름> ×N". */
  export function mergedLabels(selectedId: string, selectedRect: Rect, incident: { id: string; label?: string; points: Pt[]; labelAt?: Pt; from: string; to: string }[]): PlacedLabel[];
  ```
  - 이름이 하나뿐인 무리는 그 선의 `labelAt`에 둔다.
  - 이름이 2개 이상인 무리는 다음 순서로 둔다.
    1. 각 선의 points를 고른 노드 쪽 끝에서 시작하도록 맞춘다. 방향은 `from`/`to`로 판단한다.
    2. 모든 선이 같은 시작점에서 같은 점들을 함께 지나는 앞부분을 찾는다. 그 길이가 `MIN_TRUNK = 12`px 이상이면 그 구간의 가운데에 둔다.
    3. 그렇지 않으면 고른 노드 상자의 변 가운데 선들의 시작점이 가장 많이 놓인 변에서 `LABEL_OFFSET = 14`px 바깥, 시작점들의 평균 위치에 둔다.

- [ ] **Step 1: 테스트를 쓴다** (`edgeLabels.test.ts`)
  - `four same labels on a shared trunk merge onto the trunk`
    - 결과: `[{ text: "HTTP 8080 ×4", ... }]`.
    - x, y가 공유 구간 안에 있다.
  - `same labels without a trunk go next to the node on the leaving side`
    - 네 선이 노드 오른쪽 변의 서로 다른 점에서 나간다.
    - 기대값: `x === rect.x + rect.width + 14`.
  - `different labels stay on their own edges`: 결과 두 개이고, 각자 `labelAt`에 있다.
  - `incoming and outgoing edges with the same label merge`: 방향이 섞여도 하나로 합친다.
  - `pinned-node elbow routes are handled`: elbow points에서도 둘 곳이 정해진다.
- [ ] **Step 2: EdgeLayer 테스트를 쓴다** (`EdgeLayer.test.tsx`)
  - `selected node shows each label text once`: `.edge-label`의 글자가 서로 겹치지 않는다.
  - `hoverLabels off: labels of non-incident edges are hidden while selected`: 내가 정한 것이다. 흐린 선의 같은 이름이 남지 않게 한다.
  - `edge selection shows its own label unchanged`: 연결을 고르면 그 이름 하나만, 원래 자리에 나온다.
- [ ] **Step 3: 내보내기 테스트를 쓴다.** `export keeps every original label while a node is selected`: `edgeLabels()`가 채우는 원래 이름이 모두 있고, `×N` 글자는 없다.
  - 합친 이름은 `text.edge-label--merged`로 그린다.
  - 그 클래스를 `CHROME`에 넣는다.
- [ ] **Step 4: 실패를 확인한다.**
- [ ] **Step 5: 구현한다.**
  - `mergedLabels`를 만든다.
  - EdgeLayer는 고른 대상이 노드나 접힌 영역일 때만 이 결과로 이름을 그린다. 고른 대상의 상자는 새 prop `selectedRect?: Rect`로 받는다. Canvas가 `layout.nodes[selected] ?? layout.groups[selected]`를 넘긴다.
  - `[data-zoom="far"]`에서 이름을 숨기는 지금 규칙은 그대로 둔다.
- [ ] **Step 6: `npm test`로 PASS를 확인한다.**
- [ ] **Step 7: 커밋한다.** `feat(canvas): 고른 노드의 같은 연결 이름은 한 번만 ×N 으로`

### Task 6: 영역 이름 크기 보정과 접힌 상자 폭

**Files:**
- Modify: `src/canvas/canvas.css:141-153, 232`, `src/canvas/layout.ts:22, 220`
- Test: `tests/unit/layout.test.ts`, `tests/unit/tokens.test.ts`(CSS 규칙 검사 관례), `tests/unit/hitTargets.test.tsx`(필요하면)

**Interfaces:**
- Produces:
  - `export const COLLAPSED_MAX_WIDTH = 320;` (내가 정한 값)
  - `export function collapsedGroupWidth(label: string, hiddenCount: number): number` (`layout.ts`)
    - `clamp(EMPTY_GROUP.width, need, COLLAPSED_MAX_WIDTH)`를 돌려준다.
    - `need`는 다음을 더한 값이다.
      - 머리 좌우 여백 20 + 이름 알약 좌우 18 + `textWidth(label, 11)`
      - 사이 8
      - 접기 단추: `textWidth(`펼치기 · 노드 ${hiddenCount}개`, 11)` + 12 + 테두리 2
    - 단추는 화면에 보이는 글만 잰다. 숨긴 보조기기용 이름은 빼고 잰다.

- [ ] **Step 1: 테스트를 쓴다.**
  - `layout.test.ts`
    - `collapsed group widens to fit its name`: 긴 이름의 접힌 영역은 `width === collapsedGroupWidth(label, n)`이고 160보다 크다.
    - `collapsed group width is capped`: 아주 긴 이름은 320이다.
  - CSS 규칙 테스트: `.group__name` 본문에 `clamp(11px, calc(10px / var(--zoom, 1)), 19px)`가 있다. `[data-zoom="far"] .group__name` 규칙은 없다.
- [ ] **Step 2: 실패를 확인한다.**
- [ ] **Step 3: 구현한다.**
  - 접힌 영역의 ELK 상자 폭을 `collapsedGroupWidth`로 바꾼다. 영역 이름은 `layoutDiagram` 입력 그래프의 영역에서 읽는다.
  - `.group__name`의 font-size를 위 clamp로 바꾸고, far 규칙을 지운다.
  - 잘린 이름은 이미 있는 `title` 속성으로 전체를 보여 준다.
- [ ] **Step 4: `npm test`로 PASS를 확인한다.** 회귀 테스트의 기준선(교차 등)이 나빠지지 않는지도 본다. 상자가 넓어지면 배치가 바뀐다.
- [ ] **Step 5: 커밋한다.** `feat(canvas): 영역 이름은 확대에 맞춰 커지고 접힌 상자는 이름만큼 넓다`

### Task 7: 화면 확인, 전후 비교, E2E, 문서 동기화

**Files:**
- Modify: 필요한 E2E 기대값(`tests/e2e/phase3e.spec.ts` 등)
- Create: `tests/e2e/emphasis.spec.ts`
- Docs worktree: `C:\Users\devsh\Desktop\new-study\infra-architecture-docs` → `website/docs/guide/architecture.md`

- [ ] **Step 1: E2E를 쓴다** (`tests/e2e/emphasis.spec.ts`). 샘플 s4(쇼핑몰)를 연다.
  - `selecting API node overlays its edges and dims unrelated zones`
    - `.edge-emph [data-emph-edge]` 수가 이어진 연결 수와 같다.
    - 흐린 영역이 1개 이상 있다.
  - `zone names are at least 10px on screen at default view`: 모든 `.group__name`에서 `getBoundingClientRect().height / 1.5 >= 10`이다. 기본 배율은 0.5 이상이다.
- [ ] **Step 2: 실행한다.** `npm run test:int`를 먼저 돌리고 끝난 뒤 `npm run test:e2e`를 돌린다. 기존 호버·선택 E2E가 흐림 값 변화로 깨지면, 의도한 변경인지 확인하고 기대값을 고친다.
- [ ] **Step 3: 화면을 확인한다.**
  - recon 측정 페이지(spike worktree)에서 바뀐 코드로 s4의 'API #1 선택'과 state-100 기본 화면을 캡처한다.
  - 이전 캡처(`scratchpad/layout-recon/`)와 나란히 비교한다.
  - Task 1 측정값의 전후 표(입력 × 교차·평행·꺾임·비율)를 만든다.
- [ ] **Step 4: `npm run lint`와 `npx tsc --noEmit`을 돌린다.** 무시 경로의 `.superpowers/check/repro.mts` 오류는 기존 것이므로 손대지 않는다.
- [ ] **Step 5: 커밋하고 문서를 동기화한다.**
  - 브랜치를 `git merge --no-ff`로 main에 합친다. 사용자 확인 뒤에 한다.
  - docs worktree에서 다음 순서로 한다.
    1. `git merge main`
    2. `architecture.md`의 캔버스 강조·배치 절을 갱신하고 커밋한다.
    3. `cd website && npm run docs:refresh && npm run build`를 돌린다.
    4. 그래프를 따로 커밋한다.
