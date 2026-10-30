# InfraSketch 3D단계: 화면·사용성 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 2026-10-30 사용자 요청 8가지를 반영한다.
1. 레이아웃을 "떠 있는 유리 패널"로 바꾼다.
2. 프로젝트 영역을 아이콘 레일로 접을 수 있게 한다.
3. 대화로 조립되는 동안 카메라가 부드럽게 움직이게 한다.
4. 환경·배포 가정을 바꾸면 이전 구성이 남지 않게 한다.
5. 캔버스 구역과 노드의 색 구분을 강화한다.
6. 빠진 정보 숫자 배지를 켜고 끌 수 있게 한다(기본 끔).
7. 대화창을 메신저형 말풍선과 진행 카드로 바꾼다(캐주얼하지 않게).
8. 체크리스트 노드 블록을 접고 펼칠 수 있게 하고, 제목을 누르면 그 노드로 이동·강조한다.

여기에 선택한 노드·영역을 다시 누르거나 영역 바탕을 누르면 선택이 풀리게 한다.

**Architecture:**
- 구조 변경(4): `remove_group` 명령을 추가하고, AI 차례가 끝날 때 빈 영역을 정리하고, 프롬프트에 구조 가정 변경 규칙을 넣는다.
- 캔버스(3, 5, 6, 선택 해제): `Canvas.tsx`/`canvas.css`/토큰을 바꾼다.
- 셸(1, 2): `app.module.css` 레이아웃을 바꾸고 `Sidebar`·`DiagramWorkspace` 를 고친다.
- 대화(7): `ChatPanel`·`useChatTurn`·`lines` 를 고친다.
- 체크리스트(8): `MissingChecklist` 를 고치고 캔버스 포커스 API 를 추가한다.

**Tech Stack:** 3C-1 스택 그대로. 새 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`. 바뀌는 곳은 아래와 같다. 각 태스크가 해당 절을 함께 고친다.
- §3 화면 구성
- §4.5 명령 목록
- §5.2.2 토큰
- §5.3

## Global Constraints

- 2026-10-30 사용자 결정은 다음과 같다.
  - 레이아웃
    - 캔버스가 화면 전체 바탕이다.
    - 프로젝트·대화 패널은 모서리가 둥근 반투명 판으로 사방 12px 여백을 두고 떠 있다.
    - 패널 머리 강조선은 **은빛**이다(`--accent` 금색 규칙 유지).
    - 탭은 알약 모양이다.
  - 사이드바: 접으면 **아이콘 레일**(펼치기·새 프로젝트·용어 사전·계정)만 남고, 접힘 상태는 브라우저에 기억한다.
  - 카메라: 조립 과정은 보이게 둔다. 대신 화면 이동을 부드럽게, 드물게, 확대 없이 한다.
  - 구조 가정 변경
    - `remove_group` 명령을 추가하고, AI 차례가 끝난 뒤 빈 영역을 자동 정리한다.
    - 프롬프트에 "환경·배포 방식이 바뀌면 ① 새 영역을 만들고 ② 유지할 노드는 `update_node` 의 `parent` 로 옮긴 뒤 ③ 남은 노드·영역을 지운다" 규칙을 넣는다(2026-10-30 사용자 결정으로 순서 수정).
  - 캔버스 색: 구역에 옅은 색을 채우고 색 있는 구역 이름 태그를 단다. 노드 분류 색을 강조한다.
  - 빠진 정보 숫자 배지는 캔버스 보기 옵션으로 켜고 끈다. **기본은 끔**이고 브라우저에 기억한다. 경고 "!" 배지는 항상 보인다.
  - 대화창: 메신저형 말풍선 + 진행 카드. **너무 캐주얼하지 않게** 한다(이모지·둥근 캐릭터 아바타·과한 애니메이션 금지).
  - 체크리스트: 노드 블록을 접고 펼친다. 제목을 누르면 캔버스가 그 노드로 이동·강조하되 **선택은 하지 않는다**.
  - 선택 해제: 이미 선택된 노드·연결·영역을 다시 누르거나 영역 바탕을 누르면 선택이 풀린다.
- 1단계~3C-1 Global Constraints 전부 유지한다.
  - 한국어 UI, CSS 변수 토큰만 쓴다(새 색은 tokens.css 에 토큰으로 추가).
  - `--accent` 는 흐름 빛 머리·선택 링·방금 수정됨에만 쓴다.
  - 글로우·그라데이션·장식용 세로 띠(사이드 바) 금지. 그림자 대신 1px 테두리와 반투명으로 층을 나눈다.
  - 소유자만 접근한다. 테스트에서 실제 AI 를 부르지 않는다.
  - 일반 `npm run build` 금지(빌드 검사는 `NEXT_DIST_DIR=.next-e2e npm run build`).
  - `prefers-reduced-motion` 이면 카메라·강조 애니메이션을 즉시 이동으로 바꾼다.
- 화면 문구는 아래를 그대로 쓴다.
  - 사이드바 접기·펼치기 버튼 aria-label: `프로젝트 영역 접기` / `프로젝트 영역 펼치기`
  - 캔버스 보기 옵션: `빠진 정보 숫자`
  - 진행 카드 단계: `구성 검토` → `그리는 중 (노드 N개)` → `위험 요소 점검` → `완료`(중단이면 `중단됨`)
  - AI 말풍선 표시 이름: `InfraSketch`
  - 체크리스트 블록 펼치기/접기 aria-label: `<이름> 항목 펼치기` / `<이름> 항목 접기`, 제목 버튼 aria-label: `<이름> 위치 보기`
  - `remove_group` 은 사용자 문구가 없다(내부 명령).

## Review Focus

1. **환경을 클라우드→IDC 로 바꾼 대화** → 끝난 뒤 AWS 리전·VPC·빈 서브넷 상자가 남지 않는다. 사용자가 입력한 IP·스펙은 옮겨진 노드에 남는다. → Task 1 `structural change removes obsolete groups`, Task 9 E2E.
2. **사용자가 일부러 빈 영역을 만들어 둔 구성** → AI 차례에서 이번 차례에 비게 된 영역만 정리하고, 원래 비어 있던 영역은 그대로 둔다. → Task 1 `only groups emptied by this turn are pruned`.
3. **노드 40개를 한 번에 그리는 대화** → 화면이 노드마다 튀지 않는다. 최대 0.6초에 한 번, 부드럽게, 확대 없이 이동하고, 끝나면 한 번 맞춘다. → Task 3 `camera fits at most every 600ms during streaming, never zooms in, final fit at done`.
4. **좁은 화면(1280px)에서 두 패널이 떠 있음** → 캔버스 조작 영역이 패널에 가려 노드를 못 누르는 일이 없다. 맞춤은 패널을 뺀 보이는 영역 기준이다. → Task 6 `fit padding accounts for floating panels`.
5. **사이드바를 접고 새로고침** → 접힌 채로 열리고, 하이드레이션 불일치가 없다. → Task 6 `collapsed state restored after mount`.

---

### Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙

**Files:**
- Modify: `src/domain/commands.ts`, `src/domain/apply.ts`, `src/server/chat/prompt.ts`, `src/server/chat/pipeline.ts`, `src/ui/DiagramWorkspace.tsx`(가정 칩 메시지), spec §4.5
- Test: `tests/unit/apply.test.ts`, `tests/unit/commands.test.ts`, `tests/unit/prompt.test.ts`, `tests/integration/pipeline.test.ts`

**Interfaces:**
- Produces:
  - `{ op: "remove_group", id }`: 그룹과 그 안의 모든 하위 그룹·노드, 그리고 그것들에 닿은 연결을 지운다. 없는 id 면 `group <id> not found` 다.
  - `pruneEmptyGroups(before: DiagramState, after: DiagramState): DiagramState`(`src/domain/apply.ts`): `after` 에서 노드도 하위 그룹도 없는 그룹 중 `before` 에서는 비어 있지 않던 것만 지운다. 안쪽부터 반복한다. 그 그룹에 닿은 연결도 지운다.
  - pipeline: `applied > 0` 이면 버전 저장 전에 `state = pruneEmptyGroups(turnStartState, state)` 를 한다. 정리로 지워진 그룹 id 는 `{t:"cmd", cmd:{op:"remove_group", id}}` 이벤트로도 보내 클라이언트 상태와 맞춘다.
  - SYSTEM_PROMPT
    - 명령 목록에 `{"op":"remove_group","id":"기존 영역 id"}` 를 추가한다.
    - `update_node` 예시에 `"parent":"새 영역 id"` 를 추가한다.
    - 규칙 추가: `- 환경(environment)이나 배포 방식(deploy) 가정이 바뀌면, 새 가정에 맞지 않는 영역은 remove_group 으로, 노드는 remove_node 로 먼저 지운다. 새 구성에서도 쓰는 노드(WAS·DB 등)는 지우지 말고 update_node 의 parent 로 새 영역에 옮긴다.`
    - "영역 이름·상위 영역은 바꿀 수 없다" 규칙은 유지한다(삭제는 가능).
  - 가정 칩 메시지(`DiagramWorkspace.tsx`): 키가 `environment`·`deploy` 면 `가정 변경: <라벨> → <값>. 이 가정에 맞지 않는 영역·노드는 지우고, 계속 쓰는 노드는 새 영역으로 옮겨 구성을 다시 맞춰 줘.` 로 보낸다. 그 밖의 키는 기존 문구를 쓴다.
- [ ] **Step 1: 실패하는 테스트**
  - `remove_group removes descendants and touching edges`
  - `remove_group unknown id fails`
  - `only groups emptied by this turn are pruned`(원래 빈 그룹은 유지)
  - `nested empty groups are pruned inside-out`
  - `structural change removes obsolete groups`: 통합 테스트다. 가짜 qwen 이 AWS 노드 제거 + IDC 그룹 추가 + WAS 를 `update_node parent` 로 옮긴다. 빈 AWS 그룹들이 버전에서 사라지고, WAS 의 attrs.ip 가 유지된다.
  - prompt 에 remove_group·parent 예시·새 규칙이 있다.
  - 칩 메시지 분기
- [ ] **Step 2:** → FAIL
- [ ] **Step 3: 구현.** 클라이언트는 이미 `applyCommand` 를 쓰므로 새 명령을 자동으로 반영한다. normalize(2단계)·skips·known ops 가 새 op 을 허용하는지 확인한다. spec §4.5 명령 목록도 갱신한다.
- [ ] **Step 4:** PASS, `npm test`, `npm run test:int`, `npx tsc --noEmit`, `npm run lint`
- [ ] **Step 5: Commit** `feat: 영역 삭제 명령과 구조 가정 변경 정리`

---

### Task 2: 선택 해제 — 다시 누르기·영역 바탕

**Files:** Modify `src/canvas/Canvas.tsx`, `src/canvas/GroupBox.tsx`(필요 시), `src/canvas/EdgeLayer.tsx` · Test `tests/unit/Canvas.test.tsx`, `tests/unit/EdgeLayer.test.tsx`

**규칙:**
- 노드·연결: 이미 선택된 것을 다시 누르면 `onSelect(null)` 이다.
- 영역(그룹) 바탕: 누르면 `onSelect(null)` 이다. 영역 머리의 접기 버튼, 노드 메뉴(우클릭)는 그대로다.
- 우클릭·배지 클릭·드래그 끝은 선택을 바꾸지 않는다.
- [ ] **Step 1: 실패하는 테스트**
  - `clicking the selected node again clears selection`
  - `clicking a group background clears selection`
  - `clicking the selected edge again clears selection`
  - `drag end does not toggle`
- [ ] **Step 2:** → FAIL · **Step 3: 구현** · **Step 4:** PASS, `npm test`, `npx tsc --noEmit`
- [ ] **Step 5: Commit** `feat: 다시 누르면 선택 해제`

---

### Task 3: 조립 중 카메라 이동 다듬기

**Files:** Modify `src/canvas/Canvas.tsx`(맞춤 로직을 `src/canvas/useCamera.ts` 로 분리), `src/ui/DiagramWorkspace.tsx`(대화 진행 여부 전달) · Test `tests/unit/useCamera.test.tsx`

**Interfaces:**
- `CanvasProps.streaming?: boolean` 는 대화 차례가 진행 중인지 나타낸다.
- `useCamera({ drawnKey, streaming, reducedMotion, fitView, getViewport, nodesBounds })` 의 규칙은 아래와 같다.
  - 판 바뀜(fitKey 변경: 버전 보기·비교·구성도 전환)이면 즉시 맞춘다(지금처럼).
  - streaming 중에 그려진 노드 집합이 바뀌면 아래처럼 맞춘다.
    - 새 노드가 지금 보이는 영역 밖일 때만 맞춘다.
    - 직전 맞춤에서 600ms 가 지나야 다시 맞춘다(그 사이 변화는 모아서 한 번).
    - `duration: 450` 으로 부드럽게 이동한다.
    - 확대는 하지 않는다(새 zoom 이 지금보다 크면 지금 zoom 을 유지하고 중심만 옮긴다).
  - streaming 이 끝나면(true→false) `duration: 600` 으로 전체를 한 번 맞춘다(이때는 확대도 허용, 최대 1).
  - 사용자가 직접 이동·확대(onMoveStart 가 사용자 입력)하면 그 차례 동안 자동 맞춤을 멈춘다. 끝날 때의 최종 맞춤도 하지 않는다.
  - reducedMotion 이면 duration 0 이다.
  - 맞춤 패딩은 Task 6 의 떠 있는 패널 너비를 반영한다(`fitView({ padding })` 대신 보이는 영역 기준 계산). Task 6 이 넘겨줄 `insets: {left, right}` 를 받는다(지금은 0).
- [ ] **Step 1: 실패하는 테스트**(가짜 fitView·타이머)
  - `camera fits at most every 600ms during streaming, never zooms in, final fit at done`
  - `no fit when new nodes are already visible`
  - `user pan stops auto fit for the turn`
  - `version switch fits immediately`
  - `reduced motion uses duration 0`
- [ ] **Step 2:** → FAIL · **Step 3: 구현** · **Step 4:** PASS, `npm test`, `npx tsc --noEmit`, `npm run test:e2e`
- [ ] **Step 5: Commit** `feat: 조립 중 카메라 이동 다듬기`

---

### Task 4: 캔버스 구역·노드 색 구분

**Files:** Modify `src/styles/tokens.css`, `src/canvas/canvas.css`, `src/canvas/GroupBox.tsx`, `src/canvas/NodeCard.tsx`, `src/domain/catalog.ts`(그룹 종류별 색 토큰 이름), spec §5.2.2 · Test `tests/unit/tokens.test.ts`, `tests/unit/NodeCard.test.tsx`, Canvas/GroupBox 테스트

**결정:**
- 새 토큰 `--zone-tint-*` 를 그룹 종류마다 하나씩 둔다.

  | 토큰 | 값 |
  | --- | --- |
  | `--zone-tint-region` | `#5B7BA0` |
  | `--zone-tint-vpc` | `#4F7FB8` |
  | `--zone-tint-public` | `#3F93A8`(청록) |
  | `--zone-tint-private` | `#6874B8`(남색) |
  | `--zone-tint-dmz` | `#B08B4F`(황동) |
  | `--zone-tint-k8s` | `#4E9A8E` |
  | `--zone-tint-external` | `#A9765E`(구리) |
  | `--zone-tint-redundancy` | `#7F95B5` |
  | `--zone-tint-onprem` | `#7A8696` |

  catalog `GROUP_KINDS` 에 `tintToken` 을 추가한다. idc 와 onprem_zone 은 `--zone-tint-onprem`, cloud_region 은 region 을 쓴다.
- 영역 상자의 칠은 아래와 같다.
  - 채움: `color-mix(in srgb, var(tint) 7%, transparent)`(redundancy·k8s 처럼 안쪽 묶음은 5%)
  - 테두리: `color-mix(in srgb, var(tint) 45%, var(--line-node))`(기존 점선 규칙 유지)
  - 이름 태그: 상자 왼쪽 위에 알약 모양으로 단다.
    - 배경 `color-mix(in srgb, var(tint) 22%, var(--bg-canvas))`
    - 글자 `color-mix(in srgb, var(tint) 55%, var(--text-primary))`
    - 크기 11px, 600
- 노드는 아래처럼 칠한다.
  - 아이콘 원: `color-mix(in srgb, var(--cat-*) 26%, var(--bg-node))`
  - 아이콘 색: `--cat-*`
  - 노드 테두리: `color-mix(in srgb, var(--cat-*) 38%, var(--line-node))`
  - 장식용 세로 띠는 쓰지 않는다.
  - 선택 링·방금 수정됨(금색)은 그대로다.
- 대비 확인: 태그 글자와 태그 배경은 4.5:1 이상이어야 한다(테스트로 계산).
- [ ] **Step 1: 실패하는 테스트**
  - 토큰 값 고정
  - `each group kind maps to a tint token`
  - `tag text contrast ≥ 4.5`
  - NodeCard 가 분류 변수를 쓴다
- [ ] **Step 2:** → FAIL · **Step 3: 구현** · **Step 4:** PASS, `npm test`, `npm run lint`, E2E
- [ ] **Step 5: Commit** `style: 캔버스 구역·노드 색 구분 강화`

---

### Task 5: 빠진 정보 숫자 배지 토글

**Files:** Modify `src/canvas/Canvas.tsx`(옵션 패널), `src/canvas/useDiagramView.ts`(옵션 타입), `src/ui/DiagramWorkspace.tsx` · Test Canvas 테스트, `tests/e2e/phase3a.spec.ts`(배지를 켜고 확인하도록 수정)

**결정:**
- 캔버스 보기 옵션에 `빠진 정보 숫자` 체크를 추가한다. 기본은 끔이다.
- `localStorage["infrasketch.showMissingBadges"]` 에 기억한다. 마운트 뒤에 읽는다.
- 꺼져 있으면 숫자 배지를 그리지 않는다. 경고 배지는 그대로다.
- 체크리스트의 배지 클릭 이동은 배지가 있을 때만 해당한다.
- [ ] **Step 1: 실패하는 테스트**
  - `missing badges hidden by default`
  - `toggle shows them and is remembered`
  - `warn badge unaffected`
- [ ] **Step 2:** → FAIL · **Step 3: 구현.** 3A E2E 는 토글을 켠 뒤 기존 단언을 하도록 고친다.
- [ ] **Step 4:** PASS, `npm test`, E2E
- [ ] **Step 5: Commit** `feat: 빠진 정보 숫자 배지 켜고 끄기`

---

### Task 6: 떠 있는 유리 패널과 접는 사이드바

**Files:** Modify `src/ui/app.module.css`, `src/styles/tokens.css`, `src/ui/Sidebar.tsx`, `src/app/(app)/layout.tsx`, `src/ui/DiagramWorkspace.tsx`, `src/ui/RightPanel.tsx`, `src/ui/PanelResizer.tsx`, spec §3·§5.2.2 · Test `tests/unit/Sidebar.test.tsx`, `tests/unit/DiagramWorkspace.test.tsx`, `tests/unit/tokens.test.ts`

**결정:**
- 새 토큰을 둔다.
  - `--glass-bg: rgba(18, 26, 39, 0.78)`
  - `--glass-line: rgba(232, 235, 238, 0.08)`
  - `--glass-highlight: rgba(208, 218, 232, 0.42)`(은빛 머리선)
  - `--glass-blur: 14px`
  - `--radius-panel: 14px`
  - `--panel-gap: 12px`
- 셸 배치
  - 캔버스가 `(app)` 영역 전체를 채운다.
  - 사이드바(펼침 240px / 레일 56px)와 오른쪽 패널(너비 조절 320–720)은 `position:absolute` 로 위·아래·바깥쪽에 `--panel-gap` 만큼 띄운다.
  - 패널 칠: `background: var(--glass-bg); backdrop-filter: blur(var(--glass-blur)); border: 1px solid var(--glass-line); border-radius: var(--radius-panel)`
  - 패널 머리 위쪽 테두리 1px 은 `--glass-highlight` 다.
  - 그림자는 쓰지 않는다.
  - 3C-1 의 `--bg-panel`·`--bg-panel-raised` 는 패널 **안쪽** 카드·입력칸에 계속 쓴다.
- 탭은 알약 모양이다. 선택된 탭은 `--bg-panel-raised` 채움과 `--text-primary` 다.
- 사이드바 접기
  - 머리에 접기 버튼이 있다(`프로젝트 영역 접기`/`펼치기`).
  - 레일에는 펼치기·새 프로젝트·용어 사전·계정 아이콘 버튼이 있다. 각 버튼에 aria-label 과 title 을 단다.
  - `localStorage["infrasketch.sidebarCollapsed"]` 에 기억하고, 마운트 뒤에 읽는다.
  - 용어 사전 화면에서도 같은 셸을 쓴다.
- 캔버스 맞춤·컨트롤 위치
  - Task 3 의 `insets` 에 실제 패널이 차지하는 좌우 너비(+gap)를 넘긴다.
  - React Flow 컨트롤·미니맵·옵션 패널이 떠 있는 패널에 가리지 않게 안쪽으로 옮긴다.
- PanelResizer 는 떠 있는 패널 왼쪽 가장자리에서 그대로 동작해야 한다.
- 1280px 화면에서 캔버스가 가운데 360px 이상 보이게 패널 최대 너비 계산을 맞춘다(3C-1 Task 11 규칙 유지).
- [ ] **Step 1: 실패하는 테스트**
  - `sidebar collapses to rail and is remembered`
  - `collapsed state restored after mount`(SSR 첫 렌더는 펼침)
  - `rail buttons have labels`
  - `fit padding accounts for floating panels`
  - 토큰 값
- [ ] **Step 2:** → FAIL
- [ ] **Step 3: 구현.** 구현자는 `frontend-design` 스킬 지침을 참고해 간격·글자 크기·정렬을 다듬는다. 이 계획의 토큰·결정을 벗어나지 않는다.
- [ ] **Step 4:** PASS, `npm test`, `npm run lint`, `NEXT_DIST_DIR=.next-e2e npm run build`, E2E(선택자 갱신 포함)
- [ ] **Step 5: Commit** `feat: 떠 있는 유리 패널과 접는 사이드바`

---

### Task 7: 대화창 — 말풍선과 진행 카드

**Files:** Modify `src/ui/chat/ChatPanel.tsx`, `src/ui/chat/useChatTurn.ts`, `src/ui/chat/lines.ts`, `src/ui/chat/chat.module.css` · Test `tests/unit/ChatPanel.test.tsx`, `tests/unit/useChatTurn.test.tsx`, `tests/unit/lines.test.ts`, 관련 E2E 선택자

**결정:**
- 말풍선
  - 사용자: 오른쪽, `--bg-panel-raised` 채움, 반경 12px(오른쪽 아래 4px), 최대 너비 85%다.
  - AI: 왼쪽에 둔다.
    - 머리 줄은 작은 각진 모노그램 `IS`(20px, `--line-node` 테두리, 대문자)와 이름 `InfraSketch`, 그리고 시각(`HH:mm`, `--text-secondary`)이다.
    - 본문은 배경 없이 `--text-primary` 다(과한 말풍선 대신 정돈된 메시지).
  - 시스템 줄(되돌림 등)은 가운데 작은 회색 글이다.
- 보내면 즉시 사용자 말풍선이 뜬다(서버 응답 전).
- 진행 카드: AI 자리에 차례가 시작되면 카드 하나가 나타난다.
  - 단계는 `구성 검토` → `그리는 중 (노드 N개)`(cmd 이벤트마다 N 갱신) → `위험 요소 점검` → `완료`다.
  - 현재 단계 옆에 작은 점 3개 진행 표시(opacity 순환, 1.2s)를 둔다.
  - 지난 단계는 체크 표시, 중단이면 `중단됨` 이다.
  - 답변 모드(question)에서는 `답변 작성 중` 한 단계다.
  - say 줄은 카드 아래 AI 메시지 본문으로 차례대로 붙는다.
- 차례가 끝나면 요약(노드·연결·적용·건너뜀), 빠진 정보 안내, 경고 줄을 AI 메시지 아래 작은 칩 줄로 보여 준다.
  - 경고 칩은 누르면 그 노드를 선택한다(3B 동작 유지).
  - 빠진 정보 칩은 누르면 체크리스트를 펼친다.
- 다시 불러올 때(`messagesToLines`)도 같은 모양이다. 진행 카드는 완료 상태로 접힌 한 줄(`완료 · 노드 N · 연결 M`)이 된다.
- 입력창: 보내는 동안 `보내기` 가 `중단` 으로 바뀌는 기존 동작을 유지하고, 입력칸은 비활성이다.
- `prefers-reduced-motion` 이면 점 애니메이션이 없다.
- [ ] **Step 1: 실패하는 테스트**
  - `own bubble appears immediately on send`
  - `progress card steps and node count update`
  - `answer mode shows single step`
  - `aborted shows 중단됨`
  - `summary, missing and warning chips under the message`
  - `reload renders the same structure with a collapsed done card`
  - `warning chip selects node`
  - `missing chip opens checklist`
- [ ] **Step 2:** → FAIL · **Step 3: 구현**(Task 6 처럼 frontend-design 지침 참고) · **Step 4:** PASS, `npm test`, E2E(문구 선택자 갱신)
- [ ] **Step 5: Commit** `feat: 대화창 말풍선과 진행 카드`

---

### Task 8: 체크리스트 접기와 노드 위치 보기

**Files:** Modify `src/ui/chat/MissingChecklist.tsx`, `src/ui/DiagramWorkspace.tsx`, `src/canvas/Canvas.tsx`(포커스 API) · Test `tests/unit/MissingChecklist.test.tsx`, `tests/unit/Canvas.test.tsx`, `tests/unit/DiagramWorkspace.test.tsx`

**Interfaces:**
- `CanvasProps.focusRequest?: { id: string; token: number }` 가 바뀌면 그 노드(또는 연결의 도착 노드)를 아래처럼 보여 준다.
  - 화면 가운데로 `duration: 500`(reducedMotion 0) 이동한다.
  - zoom 은 지금 값을 유지하되 0.8 미만이면 0.8 로 한다.
  - 노드에 `node--pulse` 클래스(1.6초 동안 은빛 링 2회, 금색 아님)를 준다.
  - 선택은 바꾸지 않는다.
- 체크리스트
  - 각 대상 블록 머리 = 접기 버튼(`<이름> 항목 펼치기/접기`) + 제목 버튼(`<이름> 위치 보기`) + 남은 개수다.
  - 블록 기본은 접힘이다. 배지 클릭이나 `focusId` 로 열린 블록은 펼침이다.
  - 펼침 상태는 3A 의 drafts·open 처럼 DiagramWorkspace 에 둔다(탭 전환에도 유지).
  - 제목 버튼을 누르면 `focusRequest` 를 보낸다.
- 노드 이름이 바뀌면 블록 제목도 바뀐다(이미 상태에서 읽음, 테스트로 고정).
- [ ] **Step 1: 실패하는 테스트**
  - `blocks start collapsed, toggle expands`
  - `badge focus expands that block`
  - `title click sends focus request without selecting`
  - `renamed node updates block title`
  - `canvas centers and pulses on focus request`
  - `expanded blocks survive tab switch`
- [ ] **Step 2:** → FAIL · **Step 3: 구현** · **Step 4:** PASS, `npm test`, E2E
- [ ] **Step 5: Commit** `feat: 체크리스트 접기와 노드 위치 보기`

---

### Task 9: E2E — 3D 흐름

**Files:** Create `tests/e2e/phase3d.spec.ts` · Modify `tests/e2e/fake-llm.ts`

- [ ] **Step 1: 가짜 AI.** 사용자 글에 `"가정 변경: 환경"` 이 있으면 아래 명령 줄을 낸다.
  - s1 의 AWS 영역을 `remove_group` 한다.
  - IDC 그룹을 `add_group` 한다.
  - WAS 를 `update_node parent` 로 옮긴다.
  - 남은 노드를 다시 잇는다.
- [ ] **Step 2: E2E**
  - `structural assumption change leaves no old zones`
    1. s1 을 만든다.
    2. 환경 칩 → `사내 IDC` 를 고른다.
    3. 차례가 끝나면 AWS 리전·VPC 상자가 없고 IDC 상자가 있다.
  - `re-click deselects`
    1. 노드를 누르면 설명 탭으로 간다.
    2. 같은 노드를 다시 누르면 선택이 풀리고 원래 탭으로 돌아간다.
  - `missing badges toggle`
    1. 기본으로 숫자 배지가 없다.
    2. 옵션을 켜면 배지가 보이고, 새로고침 뒤에도 유지된다.
  - `sidebar collapses and stays collapsed after reload`
  - `progress card shows steps and own bubble appears immediately`(slow 모드 "천천히" 사용)
  - `checklist title focuses node without selecting`
- [ ] **Step 3:** `npm run test:e2e` 연속 2회 통과, 기존 11개(선택자 갱신분 포함) 유지, 고정 sleep 금지
- [ ] **Step 4: Commit** `test: 3D단계 E2E(화면·사용성)`

---

### Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저)

**Files:** Modify `src/canvas/Canvas.tsx`(도구 모음), `src/canvas/layout.ts`, `src/server/llm/clef.ts`(의도), `src/server/chat/pipeline.ts`, `src/server/chat/events.ts`, `src/ui/chat/useChatTurn.ts`, `src/ui/DiagramWorkspace.tsx` · Test `tests/unit/layout.test.ts`, `tests/unit/clef.test.ts`, `tests/integration/pipeline.test.ts`, `tests/unit/useChatTurn.test.tsx`, `tests/unit/DiagramWorkspace.test.tsx`

**결정(사용자 선택):**
- **재정렬은 버튼과 대화 둘 다 지원한다.**
  - 도구 모음의 `자동 정렬` 은 편집 모드가 아니어도 누를 수 있다. 동작은 지금처럼 고정 위치를 해제하고 자동 배치한다.
  - 대화:
    - Clef 의도에 `layout`("구성도 배치·정렬·정리만 다시 해 달라는 요청(노드·연결은 그대로)")을 추가한다.
    - `layout` 으로 분류되면 서버는 AI(Qwen)를 부르지 않고 다음을 한다.
      - 응답 문구 `구성도를 다시 정렬했어요.` 를 say 로 보낸다.
      - 새 이벤트 `{t:"relayout"}` 를 보낸다.
      - assistant 메시지를 저장하고, 버전은 만들지 않는다.
    - 클라이언트는 `relayout` 을 받으면 버튼과 같은 동작(고정 위치 해제 → 자동 배치 → 화면 맞춤)을 한다.
  - 확신도 0.6 미만이면 지금처럼 일반 경로다.
- **영역은 안의 노드를 항상 감싼다.**
  - 편집 모드에서 노드를 옮기면(고정 위치), 그 노드의 부모 영역과 모든 상위 영역 상자를 다시 계산한다. 자식 노드·하위 영역의 경계 상자에 기존 GROUP_PAD 여백과 머리 높이를 더한 크기다.
  - 영역은 늘어날 수도, 줄어들 수도 있다.
  - 고정되지 않은 형제 노드의 위치는 그대로 둔다.
  - 소속 변경(다른 영역으로 옮김)은 하지 않는다.
  - 연결선 경로는 기존 규칙(고정 노드가 끼면 꺾은선)을 따른다.
  - 겹침 검사(overlap.ts)는 이 경우 영역끼리 겹칠 수 있음을 허용한다. 사용자가 옮긴 결과라서다. 자동 배치 결과에서는 여전히 0 이다.
- [ ] **Step 1: 실패하는 테스트**
  - `pinned node outside its group grows the group and ancestors`
  - `pinned node moved inward shrinks the group`
  - `unpinned layout unchanged`
  - `layout intent skips qwen and emits relayout`(통합)
  - `relayout event clears pins and re-lays out`
  - `auto arrange button enabled outside edit mode`
  - clef 기준 문구에 layout 이 있다
- [ ] **Step 2:** → FAIL · **Step 3: 구현** · **Step 4:** PASS, `npm test`, `npm run test:int`, `npx tsc --noEmit`, `npm run lint`, E2E
- [ ] **Step 5: Commit** `feat: 대화·버튼 재정렬과 영역이 노드 감싸기`

---

## 실행 순서
Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 10 → 9. 3과 6은 `insets` 로 연결된다. 3은 0 으로 두고, 6에서 실제 값을 넘긴다.
