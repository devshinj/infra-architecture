# InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 구성도를 더 읽기 쉽게 만든다. 마우스를 올린 대상과 이어진 것만 강조하고, 연결 종류 범례를 두고, 글자를 키우고 대비를 맞추고, 잘린 이름을 말풍선으로 보이고, 주의 항목을 누르면 그 노드로 바로 간다.

**Architecture:** 선택과 호버가 같은 "강조 집합" 계산(`src/canvas/emphasis.ts`)을 쓴다. 선택이 있으면 선택 기준(22% 흐림), 없을 때만 호버 기준(45% 흐림, 120ms 지연)이다. 글자 크기는 레이아웃 측정 상수(`layout.ts`)와 CSS를 함께 바꾸고, 최소 글자 크기와 대비는 단위 테스트로 고정한다. 범례는 캔버스 오른쪽 아래의 접히는 카드(`src/ui/canvas/Legend.tsx`)다. 주의 항목 클릭은 기존 선택 경로에 3D의 `focusRequest`(위치 보기) 경로를 더한다.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, @xyflow/react, ELK, vitest + Testing Library, Playwright(가짜 AI).

**Spec:** `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md` (§5.2 디자인 규칙). 각 태스크는 바꾼 규칙을 이 문서 §5.2 에 한 줄씩 더한다.

## Global Constraints

- 금색 `--accent` 는 흐름 머리·선택 링·"방금 수정됨"(그리고 로고 브랜드 예외)에만 쓴다. 새 강조는 금색을 쓰지 않는다.
- 이모지·글로우·그라디언트·그림자·장식용 옆줄 금지. 아이콘은 SVG.
- 새 유리 표면은 `--glass-bg`·`--glass-line`·`--radius-panel` 토큰을 쓴다.
- `prefers-reduced-motion` 이면 흐림 전환과 말풍선 등장에 애니메이션을 쓰지 않는다.
- 모든 문구는 한국어, 이 계획에 적힌 문구는 글자 그대로 쓴다.
- `.env` 를 읽거나 출력·수정·커밋하지 않는다. 진짜 AI 를 부르지 않는다(`npm run smoke:llm` 금지). `npm run db:migrate` 금지. 그냥 `npm run build` 금지(E2E 는 `npm run test:e2e` 가 `.next-e2e` 로 빌드). `.superpowers/` 아래 `git add -f` 금지. 맨 `git stash` 금지.
- 커밋 끝 줄: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` 과 `Claude-Session: https://claude.ai/code/session_015RDJUjHKUdnZuHRmcFJJV2`.

## Review Focus

1. 대화가 스트리밍되며 노드가 계속 생길 때 마우스가 캔버스 위에 머물러 있다 → 강조가 깜빡이거나 새 노드가 흐린 채로 등장하지 않는다(새로 생긴 노드는 다음 호버까지 강조 집합 밖이어도 `appearing` 이 우선). Task 2 테스트.
2. 접힌 영역(collapsed group)으로 합쳐진 연결에 호버 → `sourceEdgeIds` 로 원래 연결 id 를 따라가 끝점 노드가 강조된다. Task 2 테스트.
3. 편집 모드에서 노드를 끄는 중 → 호버 강조가 생기지 않고, 끌기를 마친 뒤에도 남지 않는다. Task 2 테스트.
4. 띄어쓰기 없는 긴 한글 이름(예: `결제승인처리배치서버클러스터`)과 보조 글자만 잘린 노드 → 말풍선이 뜨고, 안 잘린 노드는 뜨지 않는다. Task 3 테스트.
5. `보조 연결 숨기기` 를 켠 상태에서 범례 → 보조 줄은 그대로 보이되 "숨김" 표시가 붙는다(범례가 옵션 상태와 어긋나지 않음). Task 4 테스트.

---

### Task 1: 글자 크기와 대비

**Files:**
- Modify: `src/canvas/layout.ts` (`NODE`, `LABEL_PX`, `SUB_PX`), `src/canvas/canvas.css`, `src/canvas/edges.css`, `src/ui/panel.module.css`, `src/ui/chat/chat.module.css`, `src/ui/canvas/infoCard.module.css`, `src/ui/glossary/glossary.module.css`, `src/ui/app.module.css`, 필요 시 `src/styles/tokens.css`
- Test: `tests/unit/tokens.test.ts`, `tests/unit/layout.test.ts`, 영향받는 E2E 기대값

**Interfaces:**
- Produces: `NODE = { height: 52, minWidth: 132, maxWidth: 240, padLeft: 38, padRight: 18, gap: 28, layerGap: 52 }`, `LABEL_PX = 14`, `SUB_PX = 11` (Task 3 의 잘림 판정이 이 값을 쓴다).

결정(사용자 선택):
- 캔버스: 노드 제목 14px, 보조·AZ 11px, 영역 이름 11px 이상(멀리 볼 때 14px 유지), 영역 개수·접기 버튼 11px, 연결 이름 11px. 노드 높이 52px, 최대 너비 240px.
- 패널(대화·설명·구성 정보 카드·용어 사전·이력): 본문 13px, 메타·캡션 최소 11px.
- 앱 전체 최소 글자 크기 11px. 예외는 대화 아바타 `IS` 모노그램 하나.
- 글자 대비 4.5:1 이상: `--text-primary`·`--text-secondary` 를 `--bg-canvas`·`--bg-panel`·`--glass-bg`(불투명 근사로 `--bg-canvas` 위 합성) 위에서, 영역 이름표 글자를 이름표 배경(`color-mix(--tint 22%, --bg-canvas)`) 위에서 `tokens.css` 의 `--zone-tint-*` 모두.

- [ ] **Step 1: 실패하는 테스트**
  - `tokens.test.ts`: `no css font-size below 11px` — `src/**/*.css` 의 모든 `font-size: Npx` 가 11 이상, 허용 목록은 아바타 모노그램 선택자 하나.
  - `tokens.test.ts`: `text contrast is at least 4.5:1` — 위 조합 각각의 WCAG 대비 ≥ 4.5 (sRGB 상대 휘도 공식, `color-mix` 는 sRGB 선형 보간으로 계산하는 작은 도우미를 테스트 안에 둔다).
  - `layout.test.ts`: `node height is 52 and width is capped at 240` — 긴 이름 노드 width 240, height 52.
- [ ] **Step 2:** `npx vitest run tests/unit/tokens.test.ts tests/unit/layout.test.ts` → FAIL
- [ ] **Step 3: 구현.** 상수와 CSS 를 바꾼다. 대비가 모자라면 이름표 글자 `color-mix` 비율 또는 토큰을 조정한다(금색 쪽으로 바꾸지 않는다). §5.2 에 "최소 글자 11px(모노그램 예외), 노드 제목 14px, 대비 4.5:1" 한 줄.
- [ ] **Step 4:** `npm test`, `npm run lint`, `npm run test:e2e` (노드 크기 변화로 깨진 E2E 기대값만 고친다) → PASS
- [ ] **Step 5: Commit** `feat: 글자 크기와 대비 키우기`

---

### Task 2: 마우스 강조·흐리기

**Files:**
- Create: `src/canvas/emphasis.ts`, `src/canvas/useHoverEmphasis.ts`
- Modify: `src/canvas/Canvas.tsx` (Flow 의 neighbors 계산과 `visual`), `src/canvas/EdgeLayer.tsx` (incident/isDim 과 hover 상태), `src/canvas/NodeCard.tsx` (`NodeVisualState` 에 `"faded"`), `src/canvas/canvas.css`, `src/canvas/edges.css`
- Test: `tests/unit/emphasis.test.ts`, `tests/unit/useHoverEmphasis.test.tsx`, `tests/unit/Canvas.test.tsx`, `tests/unit/EdgeLayer.test.tsx`

**Interfaces:**
- Produces:
  - `emphasisOf(edges: DisplayEdge[], id: string | null): { nodes: Set<string>; edges: Set<string> } | null` — id 가 연결(또는 `sourceEdgeIds` 에 든 원래 연결)이면 그 연결 + 두 끝 노드, 노드(또는 그려진 영역)면 그 노드 + 닿은 연결 + 이웃 노드. null 이면 null. Canvas 와 EdgeLayer 의 기존 선택 계산을 이걸로 바꾼다.
  - `useHoverEmphasis(delayMs = 120): { hoverId: string | null; enter(id: string): void; leave(id: string): void; reset(): void }` — enter 후 delayMs 가 지나야 hoverId 가 된다. 지연 중 leave 하면 취소. 다른 id 로 enter 하면 그 id 로 다시 지연.
  - `EdgeLayerProps` 에 `hoverId: string | null`, `onHover?(id: string | null): void` 를 더한다. EdgeLayer 안의 `hovered` 지역 상태는 연결 이름 표시(`hoverLabels`)용으로 남겨도 되지만 강조는 `hoverId` 로 한다.

결정(사용자 선택: 선택 우선):
- 선택이 있으면 지금처럼 선택 기준으로만 흐린다(노드 `dimmed` 22%, 연결 `edge--dim` 22%). 호버는 무시.
- 선택이 없을 때만 호버 기준으로 흐린다: 노드 `faded`, 연결 `edge--faded`, 둘 다 opacity 0.45. 강조 집합 안은 그대로.
- 지연 120ms. 편집 모드에서 끄는 동안(onNodeDragStart~Stop)은 `reset()` 하고 호버를 받지 않는다. 비교 모드에서도 같은 규칙.
- `appearing`/`updated`/`pulse` 노드는 `faded` 보다 우선한다.
- reduced motion 이면 흐림 전환 transition 없음.

- [ ] **Step 1: 실패하는 테스트**
  - `emphasis.test.ts`: `node emphasis includes neighbors and incident edges`, `edge emphasis includes both endpoints`, `bundled edge id resolves through sourceEdgeIds`, `null id gives null`.
  - `useHoverEmphasis.test.tsx` (fake timers): `hover applies after 120ms`, `leave before delay cancels`, `reset clears`.
  - `Canvas.test.tsx`: `hover fades non-neighbors when nothing is selected` (노드에 mouseenter, 120ms 진행 → 이웃 아닌 노드 `.node--faded`), `selection wins over hover` (선택 상태에서 다른 노드 호버 → `.node--faded` 없음, 선택 기준 `.node--dimmed` 유지), `drag suppresses hover`, `appearing node is not faded`.
  - `EdgeLayer.test.tsx`: `hoverId fades unrelated edges` (`edge--faded`), `hovering an edge hit path calls onHover`.
- [ ] **Step 2:** 해당 테스트 → FAIL
- [ ] **Step 3: 구현.** Flow 가 `useHoverEmphasis` 를 갖고 React Flow `onNodeMouseEnter/Leave` 와 EdgeLayer `onHover` 를 연결한다. §5.2 에 "호버 강조: 선택 없을 때만, 45%, 120ms" 한 줄.
- [ ] **Step 4:** `npm test`, `npm run lint` → PASS
- [ ] **Step 5: Commit** `feat: 마우스를 올린 대상과 이어진 것만 강조`

---

### Task 3: 잘린 이름 말풍선

**Files:**
- Create: `src/canvas/NameTooltip.tsx`
- Modify: `src/canvas/NodeCard.tsx`, `src/canvas/canvas.css`, `src/canvas/Canvas.tsx` (NodeCardData 에 잘림 여부 전달)
- Test: `tests/unit/NodeCard.test.tsx`

**Interfaces:**
- Consumes: Task 1 의 `LABEL_PX`/`SUB_PX` 로 계산된 `LaidOutNode.displayLabel`/`displaySub`.
- Produces: `NodeCardData.truncated?: boolean` (displayLabel ≠ 원래 이름 또는 displaySub ≠ 원래 보조 글자일 때 true), `NodeCardData.fullSub?: string`.

결정(사용자 선택: 테마 말풍선):
- 잘린 노드에만, 마우스를 올리거나 키보드 포커스가 오면 300ms 뒤 노드 바로 위에 유리 말풍선을 띄운다. 내용은 전체 이름(14px)과, 있으면 전체 보조 글자(11px).
- `role="tooltip"`, 노드에 `aria-describedby`. Esc·마우스 떠남·포커스 떠남으로 닫는다. pointer-events none.
- 잘린 노드는 `title` 속성을 지운다(말풍선과 이중 표시 방지). 안 잘린 노드는 말풍선도 `title` 도 없다.
- 끄는 중에는 뜨지 않는다. 멀리 볼 때(FAR_ZOOM 미만)에도 뜬다.

- [ ] **Step 1: 실패하는 테스트** (fake timers)
  - `tooltip appears after 300ms only when truncated` — `결제승인처리배치서버클러스터` 처럼 잘린 이름: 300ms 뒤 `getByRole("tooltip")` 에 전체 이름. 안 잘린 노드: 없음.
  - `sub-only truncation also shows tooltip with full sub`.
  - `tooltip opens on keyboard focus and closes on Esc`.
  - `truncated node has no title attribute`.
- [ ] **Step 2:** → FAIL
- [ ] **Step 3: 구현.** §5.2 에 "잘린 이름: 300ms 뒤 유리 말풍선" 한 줄.
- [ ] **Step 4:** `npm test`, `npm run lint` → PASS
- [ ] **Step 5: Commit** `feat: 잘린 노드 이름 말풍선`

---

### Task 4: 연결 범례

**Files:**
- Create: `src/ui/canvas/Legend.tsx`, `src/ui/canvas/legend.module.css`
- Modify: `src/ui/DiagramWorkspace.tsx` (범례 배치, 옵션 전달), 필요 시 카메라 insets 계산(오른쪽 아래 접힌 버튼 자리)
- Test: `tests/unit/Legend.test.tsx`

**Interfaces:**
- Consumes: `EDGE_KINDS` (`src/domain/catalog.ts`: kind·label·colorToken·dash), 캔버스 옵션 `hideAux`.
- Produces: `<Legend hideAux: boolean />`, localStorage 키 `"infrasketch.legendOpen"` ("1"/"0", 기본 접힘).

결정(사용자 선택: 캔버스 오른쪽 아래 접히는 버튼):
- 접힌 모양: 오른쪽 아래 유리 버튼 `범례`(SVG 아이콘 + 글자), `aria-expanded`.
- 펼치면 위로 열리는 유리 카드, 제목 `연결 범례`. 줄마다 실제 선 모양 견본(SVG, 색·점선을 `EDGE_KINDS` 에서) + 이름:
  - `EDGE_KINDS` 4종을 catalog 의 label 그대로(`동기 요청`, `비동기·이벤트`, `복제·동기화`, `보조(관리·모니터링)`). `hideAux` 가 켜져 있으면 보조 줄 끝에 `숨김`.
  - 금색 점 견본 + `움직이는 금색 점: 요청이 흘러가는 방향`
  - 작은 점 견본 + `작은 점: 여러 연결이 한 줄로 합쳐지는 곳`
  - 화살표 견본 + `화살표: 연결이 향하는 쪽`
- Esc 로 닫고 포커스는 `범례` 버튼으로. 펼침 상태는 localStorage 에 기억한다(읽기·쓰기 try/catch).
- 접힌 버튼은 구성 정보 카드 접힌 높이 띠 안에 들어가 카메라 bottom inset 을 늘리지 않는다. 펼친 카드는 캔버스 위에 겹친다(구성 정보 카드와 같은 규칙).
- 비교 모드에서도 보인다. 빈 구성도(노드 0개)에서는 숨긴다.

- [ ] **Step 1: 실패하는 테스트**
  - `legend is collapsed by default and toggles with aria-expanded`
  - `legend lists four edge kinds from catalog plus dot, junction and arrow rows` (문구 그대로)
  - `aux row shows 숨김 when hideAux`
  - `Esc closes and returns focus to the button`
  - `open state persists in localStorage and survives storage errors`
  - `hidden on an empty diagram`
- [ ] **Step 2:** → FAIL
- [ ] **Step 3: 구현.** §5.2 에 범례 한 줄.
- [ ] **Step 4:** `npm test`, `npm run lint` → PASS
- [ ] **Step 5: Commit** `feat: 연결 범례`

---

### Task 5: 주의 항목 바로 가기

**Files:**
- Modify: `src/ui/DiagramWorkspace.tsx` (InfoCard `onSelectWarning` 처리), 필요 시 `src/ui/canvas/InfoCard.tsx`
- Test: `tests/unit/DiagramWorkspace.test.tsx`, `tests/unit/InfoCard.test.tsx`

**Interfaces:**
- Consumes: 3D 의 `selectNode(id)` (선택 → 오른쪽 패널 설명 탭의 주의할 점)와 `focusRequest` 경로(위치 보기: 카드에 가리지 않는 자리로 카메라 이동).

결정(사용자 선택: 카드 유지 + 클릭 이동):
- 구성 정보 카드의 주의 항목을 누르면: 그 노드를 선택(설명 탭 → 주의할 점) **하고** 같은 토큰으로 `focusRequest` 를 올려 카메라를 그 노드로 옮긴다. 노드가 접힌 영역 안이면 그려진 영역으로 간다(기존 drawnId 규칙).
- 경고에 `edgeId` 가 있으면 노드 선택은 그대로 두고, 그 연결은 선택 강조 안에 이미 들어간다(추가 동작 없음).
- 항목 버튼에 `aria-label` `<노드 이름> 위치로 가기: <경고 문구>`(조사 받침 문제를 피한다).
- 카드는 열린 채로 둔다.

- [ ] **Step 1: 실패하는 테스트**
  - `warning item selects the node and moves the camera` — 클릭 후 selectedId 가 노드, 설명 탭, focusRequest 토큰 증가.
  - `same warning clicked twice refocuses` — 토큰이 다시 증가.
  - `warning item has descriptive aria-label`.
- [ ] **Step 2:** → FAIL
- [ ] **Step 3: 구현.**
- [ ] **Step 4:** `npm test`, `npm run lint` → PASS
- [ ] **Step 5: Commit** `feat: 주의 항목을 누르면 그 노드로 이동`

---

### Task 6: E2E — 3E 흐름

**Files:** Create `tests/e2e/phase3e.spec.ts`

- [ ] **Step 1: E2E** (샘플 구성도 불러오기로 시작, 고정 sleep 금지)
  - `hover fades unrelated nodes and leaving restores` — 노드 hover → 이웃 아닌 노드에 `.node--faded`; 마우스를 빈 곳으로 → 없음.
  - `selection wins over hover`.
  - `legend opens, lists kinds, and remembers state after reload`.
  - `long name shows tooltip on hover` — 샘플에 잘리는 이름이 없으면 대화(가짜 AI)로 긴 이름 노드를 만든다.
  - `warning item moves to node and opens explanation` — 구성 정보 카드 펼침 → 주의 항목 클릭 → 노드 선택(`.node--selected`), 설명 탭 선택, 노드가 화면 안(경계 상자가 뷰포트·카드와 겹치지 않음).
- [ ] **Step 2:** `npm run test:e2e` 연속 2회 통과(기존 18개 유지)
- [ ] **Step 3: Commit** `test: 3E단계 E2E(읽기 쉬움)`

---

## 실행 순서
Task 1 → 2 → 3 → 4 → 5 → 6. Task 1 이 노드 크기를 바꾸므로 Task 3 의 잘림 판정과 Task 6 의 E2E 가 그 뒤에 온다.
