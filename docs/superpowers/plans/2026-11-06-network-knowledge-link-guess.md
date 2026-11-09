# 망 종류 지식과 망연계 예상 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 망 영역에 망 종류(계정 공통 지식베이스)를 붙여, 망 사이 연결 방식을 예상해 안내하고, AI가 필요한 망연계를 "AI 추정"으로 미리 그리며, 사용자가 "아니에요"로 그 부분만 되돌릴 수 있게 한다.

**Architecture:**
- 망 지식(망 종류·연결 규칙)은 계정 단위 DB 두 테이블에 둔다. 서버와 클라이언트는 같은 순수 타입 `NetworkKnowledge` 로 받아 쓴다.
- 판정은 순수 함수로 한다. 경계 노드만 거치는 통신 길을 찾고, 규칙표로 필요한 방식을 정해 경고 목록에 넣는다. 기존 `evaluateRules`·`mergeWarnings`·`computeMissing` 에 지식을 선택 인자로 더한다.
- 구성도 쪽 변경은 기존 명령 흐름을 탄다.
  - AI가 쓰는 명령: `set_zone_type`, `add_node.guess`
  - 서버만 내는 명령: `set_link_guess`
- 확인·거절은 서버 액션이 `form` 버전을 만든다. 되돌리기는 순수 함수가 한다.

**Tech Stack:** Next.js(App Router, server actions), TypeScript, zod, drizzle(PostgreSQL), vitest(node·jsdom·integration), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-06-network-character-and-link-guess-design.md` — 실행자는 이 문서와 스펙을 함께 읽는다. 스펙의 절 번호(1-1, 4, 6 …)를 아래에서 그대로 가리킨다.

## Global Constraints

- **명령 흐름:** AI JSONL → `normalizeAiCommand` → `parseCommand` → `applyCommand` → 차례 끝 `createVersion`. 새 명령도 이 길을 탄다.
- **Qwen 한도:** 출력 16k 토큰, 이어 쓰기 최대 2번(`MAX_CONTINUATIONS`), 차례 240초. 망 지식 때문에 AI 호출을 더 늘리지 않는다(스펙 2: "따로 AI를 부르지 않는다").
- **id 형식:** `^[a-z0-9][a-z0-9-]{0,63}$`. 망 종류 key 도 같은 형식이다.
- **화면 규칙:** 토큰 색만 쓰고 LIGHT_TOKENS 짝을 둔다. 움직임 줄이기를 따르고, 쌓는 순서는 `stacking.ts` 를 따른다. Tab 한 번 + 화살표로 다니고, 누르는 자리는 24px 이상이다. 쉬운 한국어를 쓴다.
- **AI 배지:** 새 표시의 글자는 정확히 `AI 추정` 이고, 화면 읽기 문구는 `AI_BADGE_SR` 를 같이 쓴다. 기존 `AI 설명`·`AI 제안` 글자는 바꾸지 않는다. 확인 단추는 정확히 `맞아요` / `아니에요` 이다.
- **안내 문구:** 단정하지 않는다. 기본 규칙에는 "기관 규정과 방화벽 담당자에게 확인해 보세요." 를, 사용자 규칙에는 "등록한 기관 규칙(<근거>)에 따르면" 을 쓴다. 이 문구들은 Qwen 문구 다듬기를 거치지 않는다.
- **마이그레이션:** drizzle 마이그레이션 `0007` 을 쓴다. 개발 DB 적용과 푸시는 사용자가 요청할 때만 한다.
- **회귀 금지:** 1단계 배치 측정 회귀 테스트가 나빠지지 않는다. 지식 인자를 주지 않는 기존 호출의 결과는 바이트 하나 다르지 않다.
- **프롬프트 크기:** 망 종류는 key·이름·다른 이름·등급만 넣고 설명은 넣지 않는다. 규칙은 그 구성도의 망 짝에 해당하는 것만 넣는다.

## Review Focus

1. **망 종류 지식이 비었거나 불러오기에 실패했을 때.** 대화 차례·화면이 지금과 똑같이 돈다(판정 없음, 오류 없음). 테스트는 Task 6 과 Task 8 에 둔다.
2. **경계 노드끼리만 고리로 이어진 구성.** 예: 방화벽 ↔ 방화벽. 이때 길 찾기가 멈추고 끝난다. 테스트는 Task 3 에 둔다.
3. **연결 끝이 그룹 id 인 경우.** 연결은 그룹 끝을 허용한다. 길 찾기와 되돌리기가 그런 연결을 건너뛰고 죽지 않는다. 테스트는 Task 3·4 에 둔다.
4. **AI가 망 지식에 없는 key 로 `set_zone_type` 을 쓰거나, 사용자가 확정한 종류를 바꾸려 할 때.** 건너뜀으로 처리하고 상태는 그대로 둔다. 테스트는 Task 2·6 에 둔다.
5. **"아니에요"를 두 번 누르거나 그사이 대화 차례가 돌 때.** 두 번째는 아무것도 바꾸지 않고, 잠금 중이면 `BUSY_MESSAGE` 를 돌려준다. 테스트는 Task 7 에 둔다.

---

### Task 1: 망 지식 도메인 — 타입, 기본 제공 목록, 필요한 방식 계산

**Files:**
- Create: `src/domain/network.ts`
- Create: `src/domain/network-seed.ts`
- Test: `tests/unit/network.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type NetGrade = "closed" | "internal" | "boundary" | "external";
  export const GRADE_LABELS: Record<NetGrade, string>; // 폐쇄·내부·경계·외부
  export type LinkMethod = "firewall" | "network_link" | "none";
  export const METHOD_LABELS: Record<LinkMethod, string>; // "방화벽(또는 VPN)으로 됨" | "망연계 필요" | "보통 잇지 않음(예외 확인)"
  export interface NetType { key: string; name: string; aliases: string[]; description: string; grade: NetGrade }
  export interface NetRule { a: string; b: string; method: LinkMethod; note?: string } // a<b 정렬
  export interface NetworkKnowledge { types: Record<string, NetType>; rules: NetRule[] } // 숨긴 종류는 빠진다
  export const GRADE_RULES: ReadonlyArray<{ a: NetGrade; b: NetGrade | "*"; method: LinkMethod }>;
  export function pairKey(a: string, b: string): [string, string]; // 사전순 정렬
  export function requiredMethod(k: NetworkKnowledge, typeA: string, typeB: string):
    { method: LinkMethod; source: "default" | "user"; note?: string } | null; // 종류가 없거나 같은 종류면 null
  // network-seed.ts
  export const NETWORK_TYPE_SEED: readonly NetType[];
  ```

- [ ] **Step 1: Write the failing tests** in `tests/unit/network.test.ts`
  - `requiredMethod: 내부 ↔ 외부 는 망연계(기본)` — 행정망(internal) ↔ 인터넷망(external) → `{ method: "network_link", source: "default" }`.
  - `requiredMethod: 내부 ↔ 경계, 경계 ↔ 외부, 같은 등급 다른 종류는 방화벽` — 세 짝 모두 `"firewall"`.
  - `requiredMethod: 폐쇄는 어느 쪽과도 none` — 제어망 ↔ 업무망, 제어망 ↔ 인터넷망 → `"none"`.
  - `requiredMethod: 사용자 종류 짝 규칙이 등급 규칙보다 앞선다` — rules `[{a:"admin-net",b:"gcloud-internal",method:"network_link",note:"○○ 지침 3조"}]` → `{ method:"network_link", source:"user", note:"○○ 지침 3조" }`. `b,a` 순서로 불러도 같다.
  - `requiredMethod: 모르는 종류·같은 종류는 null`.
  - `seed: key 가 id 형식이고 겹치지 않으며 스펙 1-1 범위를 덮는다` — 다음 key 가 모두 있다: `admin-net`, `business-net`, `mgmt-net`, `backup-net`, `dev-net`, `gcloud-internal`, `control-net`, `finance-net`, `dmz`, `internet`, `inter-agency`, `gcloud-internet`, `private-cloud`. 등급은 스펙 1-1 그대로다. 행정망 aliases 에 `"정부 업무망"` 이 있다.

- [ ] **Step 2: Run** `npx vitest run tests/unit/network.test.ts` — Expected: FAIL(모듈 없음)
- [ ] **Step 3: Implement** `src/domain/network.ts` 와 `src/domain/network-seed.ts`.
  - `GRADE_RULES` 는 스펙 1-2 표 그대로다. 폐쇄는 `b:"*"` 한 줄로 쓰고, 같은 등급은 `firewall` 이다.
  - 사용자 규칙을 먼저 보고, 없으면 등급 규칙을 본다.
  - 설명은 한두 문장, 쉬운 말로 쓴다.
- [ ] **Step 4: Run** 같은 명령 — Expected: PASS
- [ ] **Step 5: Commit** `feat(network): 망 종류 지식 타입·기본 목록·필요한 방식 계산`

### Task 2: 구성도 상태 — 망 종류 칸, `set_zone_type`, 망연계 추정 표시 명령

**Files:**
- Modify: `src/domain/types.ts` (Group, DNode)
- Modify: `src/domain/commands.ts`
- Modify: `src/domain/apply.ts`
- Modify: `src/server/chat/normalize.ts` (DROP_NULL·ID_FIELDS 에 새 칸)
- Test: `tests/unit/apply.test.ts`, `tests/unit/commands.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // types.ts
  export interface ZoneType { key: string; source: "ai" | "user"; confirmed: boolean }
  export interface Group { ...; netType?: ZoneType }
  export interface ReplacedEdge { from: string; to: string; edgeKind: EdgeKind; label?: string; payload?: EdgePayload; direction?: EdgeDirection; id?: string }
  export interface LinkGuess { replaced: ReplacedEdge[]; bridge?: ReplacedEdge } // bridge = 새로 그려 대신한 연결이 없을 때 앞·뒤 노드를 바로 이을 연결
  export interface DNode { ...; guess?: LinkGuess }
  // commands.ts (스키마에 추가)
  { op: "set_zone_type"; id: string; type: string | null }          // AI·서버 공용
  add_node 에 guess?: boolean                                       // AI 가 스스로 넣은 network_link 에만
  { op: "set_link_guess"; id: string; guess: LinkGuess | null }      // 서버 전용
  export const SERVER_ONLY_OPS: ReadonlySet<Command["op"]>;          // {"set_link_guess"}
  ```
- 적용 규칙:
  - `set_zone_type` 의 대상이 `network_zone` 그룹이 아니면 실패한다.
  - `group.netType?.source === "user"` 이면 `zone type ${id} is confirmed` 로 실패한다. 확정된 가정과 같은 방식이다.
  - AI 적용 결과는 `{ key, source: "ai", confirmed: false }` 이고, `type: null` 이면 칸을 지운다.
  - `add_node` 의 `guess: true` 는 `kind === "network_link"` 일 때만 `guess: { replaced: [] }` 로 저장하고, 다른 종류면 무시한다.
  - `set_link_guess` 는 노드의 `guess` 를 바꾸거나(`null` 이면 지움) 노드가 없으면 실패한다.
  - `isStructural` 의 결과: `set_zone_type` 은 구조 변경으로 센다. `set_link_guess` 는 세지 않는다(요약 "바꾼 곳" 아님).

- [ ] **Step 1: Write the failing tests**
  - `apply set_zone_type: network_zone 에만, AI 출처·미확인으로 저장`
  - `apply set_zone_type: 사용자 확정 종류는 바꾸지 못한다` — 실패, 상태 그대로
  - `apply set_zone_type: null 이면 칸을 지운다`
  - `apply add_node guess: network_link 만 guess 를 남긴다`
  - `apply set_link_guess: 저장·지우기, 없는 노드는 실패`
  - `commands: set_zone_type 의 type 은 id 형식 또는 null`
  - `commands: isStructural(set_link_guess) === false`
- [ ] **Step 2: Run** `npx vitest run tests/unit/apply.test.ts tests/unit/commands.test.ts` — Expected: 새 테스트 FAIL
- [ ] **Step 3: Implement** 위 Interfaces 대로 구현한다. 기존 명령의 동작은 바꾸지 않는다.
- [ ] **Step 4: Run** 같은 명령과 `npm test` — Expected: PASS
- [ ] **Step 5: Commit** `feat(domain): 망 영역 종류와 망연계 추정 표시를 상태·명령에 더한다`

### Task 3: 판정 — 통신 길, 연결 방식 예상 경고, 빠진 정보

**Files:**
- Create: `src/domain/networkRules.ts`
- Modify: `src/domain/warnings.ts` (`evaluateRules`, `mergeWarnings` 에 `knowledge?: NetworkKnowledge`)
- Modify: `src/domain/missing.ts` (`computeMissing(state, knowledge?)`, `MissingItem.targetKind` 에 `"group"`)
- Modify: `src/domain/assumptions.ts` (거절 기억 key 도우미)
- Test: `tests/unit/networkRules.test.ts`, `tests/unit/missing.test.ts`

**Interfaces:**
- Consumes: Task 1 `requiredMethod`, `NetworkKnowledge`; Task 2 `Group.netType`; 기존 `networkZoneOf`, `BOUNDARY_NODE_KINDS`.
- Produces:
  ```ts
  export interface CrossingPath { from: string; to: string; edges: string[]; via: string[] } // 양 끝은 경계 노드 아닌 노드, via 는 거친 경계 노드
  export function crossingPaths(state: DiagramState): CrossingPath[];
  export const LINK_RULES = ["link_expected", "link_unusual"] as const;
  export function linkWarningId(rule: (typeof LINK_RULES)[number], zoneA: string, zoneB: string): string; // `${rule}:${a}--${b}`, a<b
  export function evaluateNetworkRules(state: DiagramState, k: NetworkKnowledge): Warning[];
  // assumptions.ts
  export function noLinkKey(zoneA: string, zoneB: string): string;   // `no_link:${a}--${b}`, a<b
  export function parseNoLinkKey(key: string): [string, string] | null;
  ```
- 판정 규칙:
  - **길:** 연결 방향(from → to)으로 따라간다. 경계 노드만 지나 처음 만나는 비경계 노드에서 멈춘다. 지나간 노드를 기억해 고리를 막는다. 끝이 그룹인 연결은 건너뛴다.
  - **어느 망의 길인가:** 양 끝의 `networkZoneOf` 가 서로 다르고, 둘 다 `netType` 이 있을 때만 본다. 망 밖 끝이 있으면 뺀다(스펙 4).
  - **결과:**

    | 필요한 방식 | 길 | 결과 |
    |---|---|---|
    | `network_link` | `via` 에 network_link 가 없음 | `link_expected` |
    | `none` | 어떤 길이든 | `link_unusual` |

  - **경고 하나는 망 짝 하나다.** id 는 `linkWarningId` 이고, `nodeId`·`edgeId` 는 그 짝의 첫 길의 `to` 노드와 마지막 연결이다. 단계는 `check` 이다.
  - **꺼지는 경우:** `state.assumptions[noLinkKey(a,b)]` 가 있으면 그 짝의 `link_expected` 는 만들지 않는다. 대화 지시(미확정 가정)도 안내를 끄지 않는다. 그래서 정확히는 `confirmed === true` 일 때만 만들지 않는다(스펙 5·6).
  - **문구(`text`):**
    - 망 종류가 AI 추정이고 아직 확인 전이면 앞에 `"<망 이름>을 '<종류 이름>'(으)로 추정했어요. "` 를 붙인다.
    - 본문은 스펙 4 의 기본·사용자 규칙 예문을 망 이름을 넣어 쓴다.
    - `guide` 에는 `"망연계를 넣으려면 대화로 '망연계 넣어 줘'라고 말해 주세요."` 를 쓴다.
    - `link_unusual` 문구 예: `"<A>(폐쇄)와 <B> 사이는 보통 잇지 않는 구간이에요. 예외로 허용되는지 기관 규정과 방화벽 담당자에게 확인해 보세요."`
  - **`mergeWarnings`:** link 규칙 경고는 저장된 문구로 덮지 않고, 늘 새로 계산한 문구를 쓴다.
  - **`computeMissing`:** `knowledge` 가 있고 `network_zone` 이 둘 이상이면, 다음 망마다 `{ targetKind:"group", targetId, key:"net_type", label:"망 종류", unknown:false }` 를 더한다. `FIELD_LABELS.net_type = "망 종류"` 이다. 지식이 없으면 지금과 같다.
    - `netType` 이 없는 망
    - `netType.key` 가 `knowledge.types` 에 없는 망(지웠거나 숨긴 종류)
  - **흐름 단계 설명:** `crossingNote(state, step, knowledge?)` 에 선택 인자를 더한다. 그 단계의 연결이 `link_expected`·`link_unusual` 길에 속하면 기존 문장 뒤에 `" · 망연계 필요 예상"` 또는 `" · 보통 잇지 않는 구간"` 을 붙인다(스펙 4 흐름). 이 함수를 부르는 흐름 탭 쪽은 Task 8 에서 지식을 넘긴다.

- [ ] **Step 1: Write the failing tests** `tests/unit/networkRules.test.ts`
  - 고정 상태 `adminCase`: 행정망(admin-net, 확인됨) 안 PC, 망 밖 방화벽, GCloud 인터넷망(gcloud-internet) 안 WAS, 연결 PC → 방화벽 → WAS.
  - `행정망 사례: 방화벽만 거치면 link_expected 하나, 망 짝 id` — id `link_expected:<a>--<b>`, 단계 `check`, 문구에 "기관 규정과 방화벽 담당자에게 확인해 보세요" 가 있다.
  - `망연계를 거치면 표시 없음`
  - `AI 추정 종류면 문구 앞에 추정 문장`
  - `사용자 규칙이면 근거를 문구에 넣는다`
  - `종류가 한쪽이라도 없으면 판정 없음` / `망 밖 노드 끝은 판정 없음`
  - `같은 망 짝의 길 둘이면 경고는 하나`
  - `폐쇄망 짝은 link_unusual`
  - `확정된 no_link 가정이 있으면 link_expected 없음, 미확정이면 있음`
  - `경계 노드 고리(방화벽 ↔ 방화벽)에서 멈춘다` (Review Focus 2)
  - `끝이 그룹인 연결을 건너뛴다` (Review Focus 3)
  - `evaluateRules(state) 지식 없이 부르면 이전과 같다` — 기존 fixture 몇 개로 깊은 같음 비교
  - `missing.test.ts`: `망 둘 이상 + 종류 없음이면 group 항목, 망 하나면 없음, 지식 없으면 없음, 지식에 없는 key 면 group 항목`
  - `crossingNote: link_expected 길의 단계에 "망연계 필요 예상"을 붙이고, 지식 없이 부르면 이전과 같다`
- [ ] **Step 2: Run** `npx vitest run tests/unit/networkRules.test.ts tests/unit/missing.test.ts` — Expected: FAIL
- [ ] **Step 3: Implement** `networkRules.ts` 를 만들고, `warnings.ts`·`missing.ts`·`assumptions.ts` 에 위 시그니처를 더한다.
  - `evaluateRules(state, knowledge?)` 는 knowledge 가 있으면 끝에 `evaluateNetworkRules` 결과를 붙인다.
  - `ASSUMPTION_LABELS` 조회 쪽은 Task 8 에서 다룬다.
- [ ] **Step 4: Run** `npm test` — Expected: PASS(배치 측정 회귀 포함)
- [ ] **Step 5: Commit** `feat(network): 통신 길 판정과 연결 방식 예상 경고, 망 종류 빠진 정보`

### Task 4: 되돌리기 도메인 — 대신한 연결 기록, 되돌리기, 흐름 단계 나누기·합치기

**Files:**
- Create: `src/domain/linkGuess.ts`
- Test: `tests/unit/linkGuess.test.ts`

**Interfaces:**
- Consumes: Task 2 `LinkGuess`, `ReplacedEdge`; 기존 `Flow`, `FlowStep`.
- Produces:
  ```ts
  /** 차례 시작·끝 상태로, 이번 차례에 guess 로 새로 생긴 network_link 마다 대신한 연결을 계산한다. */
  export function recordReplaced(before: DiagramState, after: DiagramState): { nodeId: string; guess: LinkGuess }[];
  /** 망연계 노드 하나를 되돌린다. 순수 함수. */
  export function revertLinkGuess(state: DiagramState, nodeId: string):
    | { ok: true; state: DiagramState; partial: boolean; merges: StepMerge[] }
    | { ok: false; error: "not_found" | "not_guess" };
  export interface StepSplit { edge: string; inEdge: string; outEdge: string; link: string } // edge(a→b) 가 a→link(inEdge), link→b(outEdge) 로 갈림
  export interface StepMerge { inEdge: string; outEdge: string; edge: string; link: string }
  export function splitsFor(before: DiagramState, after: DiagramState, recorded: { nodeId: string; guess: LinkGuess }[]): StepSplit[];
  export function splitFlowSteps(flow: Flow, splits: StepSplit[]): Flow | null;  // 바뀐 게 없으면 null
  export function mergeFlowSteps(flow: Flow, merges: StepMerge[]): Flow | null;
  ```
- 규칙:
  - **대신한 연결(`recordReplaced`):** `before` 에 있고 `after` 에 없는 연결 가운데, `from` 이 망연계의 앞 노드(망연계로 들어오는 연결의 출발)이고 `to` 가 뒤 노드(망연계에서 나가는 연결의 도착)인 것이다. 하나도 없으면 `bridge` 를 만든다. bridge 는 앞 노드 → 뒤 노드이고, 속성은 들어오는 연결의 것을 쓴다. 앞·뒤가 여럿이면 짝마다 하나씩 만든다.
  - **되돌리기(`revertLinkGuess`):**
    - 망연계 노드와 그 노드에 닿은 연결을 지운다.
    - `replaced`(없으면 `bridge`)를 되살린다. 원래 id 가 있고 비어 있으면 그 id 를 쓰고, 아니면 `add_edge` 규칙의 id 를 쓴다.
    - 양 끝 노드가 없는 연결은 되살리지 않고 `partial: true` 로 둔다.
    - 지금 닿은 연결이 기록 때의 앞뒤 노드와 다르면(사용자가 고침) `partial: true` 로 둔다.
    - 다른 노드·연결·영역은 바꾸지 않는다.
  - **흐름 나누기:** 단계 `{edge, from}` 이 `edge` 를 지나면 두 단계로 바꾼다. 정방향이면 `[inEdge from a, outEdge from link]`, 역방향(from=b)이면 `[outEdge from b, inEdge from link]` 이다. 두 단계 모두 원래 short·text 를 쓴다.
  - **흐름 합치기:** 이어진 두 단계 `inEdge`·`outEdge`(어느 방향이든)를 앞 단계 short·text 로 한 단계 `edge` 로 바꾼다.

- [ ] **Step 1: Write the failing tests**
  - `recordReplaced: 방화벽→WAS 를 지우고 방화벽→망연계→WAS 를 그리면 replaced 에 원래 연결 그대로`
  - `recordReplaced: 처음 그린 망연계는 bridge`
  - `revertLinkGuess: 노드·앞뒤 연결만 지우고 원래 연결을 되살린다, 다른 것은 깊은 같음` — 상관없는 노드 하나와 흐름 연결 하나를 두고 비교한다.
  - `revertLinkGuess: guess 없는 노드는 not_guess`
  - `revertLinkGuess: 끝 노드가 사라졌으면 partial, 나머지만 되살림`
  - `revertLinkGuess: 끝이 그룹인 연결이 닿아 있어도 죽지 않는다` (Review Focus 3)
  - `splitFlowSteps / mergeFlowSteps: 정방향·역방향, 되돌리면 원래 흐름과 같다`
- [ ] **Step 2: Run** `npx vitest run tests/unit/linkGuess.test.ts` — Expected: FAIL
- [ ] **Step 3: Implement** `src/domain/linkGuess.ts`
- [ ] **Step 4: Run** 같은 명령 — Expected: PASS
- [ ] **Step 5: Commit** `feat(network): 망연계 추정의 대신한 연결 기록과 되돌리기, 흐름 단계 나누기·합치기`

### Task 5: DB와 서버 — 망 지식 테이블, 기본 제공 채우기, 읽기·고치기

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/0007_network_knowledge.sql` (`npm run db:generate` 또는 프로젝트의 drizzle 생성 명령으로 만들고 이름을 맞춘다)
- Create: `src/server/network.ts`
- Test: `tests/integration/network.test.ts`

**Interfaces:**
- Consumes: Task 1 타입, `NETWORK_TYPE_SEED`.
- Produces:
  ```ts
  // schema.ts
  networkTypes: id uuid pk, userId fk cascade, key text, name text, aliases jsonb string[], description text,
                grade text, source text("seed"|"user"), edited boolean default false, hidden boolean default false,
                updatedAt; unique(userId, key)
  networkRules: id uuid pk, userId fk cascade, typeA text, typeB text, method text, note text default '', updatedAt;
                unique(userId, typeA, typeB)   // typeA<typeB
  // server/network.ts
  export async function ensureNetworkSeeded(userId: string): Promise<void>; // 없는 seed key 만 넣는다(onConflictDoNothing) — 숨긴 행은 그대로
  export async function getNetworkKnowledge(userId: string): Promise<NetworkKnowledge>; // 숨긴 종류 제외
  export interface NetTypeRow { id: string; key: string; name: string; aliases: string[]; description: string; grade: NetGrade; source: "seed"|"user"; edited: boolean; hidden: boolean }
  export async function listNetworkTypes(userId: string): Promise<NetTypeRow[]>;
  export async function addNetworkType(userId: string, input: { name: string; aliases: string[]; description: string; grade: NetGrade }): Promise<NetTypeRow>; // key 는 이름에서 만들고 겹치면 -2,-3
  export async function updateNetworkType(userId: string, id: string, patch: Partial<{ name: string; aliases: string[]; description: string; grade: NetGrade }>): Promise<NetTypeRow>; // seed 면 edited=true
  export async function resetNetworkType(userId: string, id: string): Promise<NetTypeRow>; // seed 만, NETWORK_TYPE_SEED 값으로, edited=false
  export async function setNetworkTypeHidden(userId: string, id: string, hidden: boolean): Promise<NetTypeRow>; // seed 만
  export async function deleteNetworkType(userId: string, id: string): Promise<void>; // user 만, 그 종류를 쓰는 규칙도 지운다
  export async function countZonesUsingType(userId: string, key: string): Promise<number>; // 그 계정 구성도 최신 버전의 network_zone 중 netType.key 가 같은 수
  export async function listNetworkRules(userId: string): Promise<(NetRule & { id: string })[]>;
  export async function upsertNetworkRule(userId: string, rule: NetRule): Promise<void>;
  export async function deleteNetworkRule(userId: string, id: string): Promise<void>;
  ```
- 검사: 이름 1~30자, 다른 이름 각 30자·최대 10개, 설명 200자, 근거 100자다. 어기면 `ValidationError` 를 던지고, 남의 행이면 `NotFoundError` 를 던진다.
- 지운 사용자 종류를 쓰던 망 영역의 `netType` 은 상태에 그대로 남는다. 판정은 `knowledge.types` 에 없는 key 를 "종류 없음"으로 본다. Task 3 의 `requiredMethod` 가 null 을 돌려주고, `computeMissing` 은 `knowledge.types[key]` 가 없으면 빠진 정보로 센다. 그래서 상태는 고치지 않는다(Task 3 에 이미 들어 있음).

- [ ] **Step 1: Write the failing tests** `tests/integration/network.test.ts`
  - `ensureNetworkSeeded: 두 번 불러도 한 벌, 숨긴 seed 는 다시 보이지 않는다`
  - `getNetworkKnowledge: 숨긴 종류 제외, 규칙 포함`
  - `updateNetworkType: seed 를 고치면 edited, reset 하면 seed 값으로`
  - `deleteNetworkType: seed 는 거절, user 는 지우고 그 규칙도 지운다`
  - `upsertNetworkRule: a,b 순서와 상관없이 한 행`
  - `다른 계정 행은 NotFoundError`
  - `countZonesUsingType: 두 프로젝트 구성도의 망을 센다`
- [ ] **Step 2: Run** `docker compose up -d db_test` 그리고 `npm run test:int -- tests/integration/network.test.ts` — Expected: FAIL
- [ ] **Step 3: Implement** 스키마·마이그레이션·`src/server/network.ts`. `ensureSeeded`(glossary) 의 패턴을 따른다.
- [ ] **Step 4: Run** 같은 명령 — Expected: PASS
- [ ] **Step 5: Commit** `feat(db): 계정 공통 망 지식 테이블과 서버 함수 (마이그레이션 0007)`

### Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검

**Files:**
- Modify: `src/server/chat/prompt.ts` (`SYSTEM_PROMPT` 규칙·명령 예, `summarizeState`, `buildMessages`)
- Modify: `src/server/chat/pipeline.ts`
- Modify: `src/server/chat/warnings.ts` (`checkWarnings` 에 knowledge, link 규칙은 문구 다듬기 제외)
- Modify: `src/server/flows.ts` (`rewriteFlows`)
- Test: `tests/integration/pipeline.test.ts`, `tests/unit/prompt.test.ts`(있으면 그 파일, 없으면 새로)

**Interfaces:**
- Consumes: Task 2 명령; Task 3 `evaluateRules(state, k)`, `noLinkKey`; Task 4 `recordReplaced`, `splitsFor`, `splitFlowSteps`; Task 5 `getNetworkKnowledge`.
- Produces:
  ```ts
  buildMessages({ ...기존, network?: NetworkKnowledge })
  export function networkBlock(state: DiagramState, k: NetworkKnowledge): string; // "망 종류:" 목록 + "망 짝 규칙:" (이 구성도의 종류 붙은 망 짝만)
  checkWarnings(state, prev, deps, signal, opts & { knowledge?: NetworkKnowledge })
  // server/flows.ts
  export async function rewriteFlows(diagramId: string, rewrite: (f: Flow) => Flow | null): Promise<number>; // 바뀐 흐름 수, source·reviewed 는 그대로
  ```
- 프롬프트에 더할 것(스펙 2·4·5):
  - `{"op":"set_zone_type","id":"망 영역 id","type":"망 종류 key 또는 null"}` 와 그 규칙을 더한다.
    - "망 종류:" 목록에서만 고른다. 맞는 게 없으면 쓰지 않는다.
    - `type=… (확정)` 인 망은 바꾸지 않는다.
    - 종류가 없는 기존 망도 이번 차례에 근거가 있으면 쓴다.
  - "망 짝 규칙"이 `망연계 필요` 인 두 망을 잇게 되면, 사이에 `network_link` 노드를 넣고 `add_node` 에 `"guess":true` 를 쓴다. 사용자가 망연계를 넣어 달라고 했으면 `guess` 를 쓰지 않는다.
  - `보통 잇지 않음` 짝을 이으라고 하면 요청대로 그리고 say 로 한 줄 알린다.
  - 사용자가 "방화벽으로 바로" 처럼 망연계 없이 잇게 하면 따르고, `set_assumption` 의 key 를 `no_link:<a>--<b>`(망 id 사전순), value 를 `"망연계 없이 통신"` 으로 쓴다.
  - 가정에 `no_link:<a>--<b>` 가 있는 짝에는 망연계를 넣지 않는다.
  - 망 영역 밖 서버 규칙: 종류가 붙은 망이 있으면 인터넷·클라우드 쪽 서버는 알맞은 network_zone 안에 그린다. 외부 사용자·외부 SaaS 는 그대로 둔다.
  - `summarizeState` 의 그룹 줄 끝에 ` type=<key>(추정|확정)` 을 붙인다. 노드 줄에는 `guess` 가 있으면 ` guess` 를 붙인다.
- 파이프라인:
  - **망 지식 읽기:** 차례 시작에 `getNetworkKnowledge(userId)` 를 부른다(실패하면 `null`, 로그 한 줄). `null` 이면 지금과 똑같이 돈다(Review Focus 1).
  - **명령 거르기:**
    - `SERVER_ONLY_OPS` 의 명령이 AI 줄로 오면 `지원하지 않는 명령(set_link_guess)` 로 건너뛴다.
    - `set_zone_type` 의 `type` 이 지식에 없으면 `알 수 없는 망 종류(<key>)` 로 건너뛴다. 지식이 `null` 이면 모든 `set_zone_type` 을 건너뛴다.
  - **차례 끝(prune 뒤, checkWarnings 앞):**
    - `recordReplaced(turnStartState, state)` 마다 `set_link_guess` 를 적용하고, `emit({t:"cmd"})` 로 클라이언트에 보낸다.
    - 그 결과로 `splitsFor` 를 구해 두었다가, 흐름 저장 단계에서 `rewriteFlows(diagramId, f => splitFlowSteps(f, splits))` 를 부른다. 같은 차례 AI 흐름 명령(`applyFlowOps`)보다 먼저 한다.
  - **경고 점검:** `checkWarnings(..., { knowledge })` 로 부른다. `link_*` 경고는 `writeTexts` 대상에서 뺀다.
  - **Clef·프롬프트에 넘기는 빠진 정보:** `openMissing` 은 `targetKind !== "group"` 만 넘긴다. 망 종류는 AI가 프롬프트로 추정한다.

- [ ] **Step 1: Write the failing tests** (`tests/integration/pipeline.test.ts` 의 가짜 Qwen 방식)
  - `행정망 사례: AI 가 set_zone_type 두 개 + 방화벽 → network_link(guess) → WAS 를 그리면 버전 상태에 netType(ai), guess.replaced, set_link_guess cmd 이벤트`
  - `기존 연결을 망연계로 바꾼 차례는 그 연결을 지나던 흐름 단계를 둘로 나눈다`
  - `모르는 망 종류 key 의 set_zone_type 은 건너뜀, 상태 그대로` (Review Focus 4)
  - `AI 가 set_link_guess 를 쓰면 건너뜀`
  - `사용자 확정 종류에 대한 set_zone_type 은 건너뜀` (Review Focus 4)
  - `망 지식 읽기 실패면 판정·프롬프트 블록 없이 지금처럼 끝난다` (Review Focus 1)
  - `link_expected 경고 문구는 Qwen 다듬기를 거치지 않는다` — 가짜 Qwen 문구 응답이 와도 정해진 문구가 그대로다.
  - prompt 단위: `networkBlock 은 이 구성도의 망 짝 규칙만, 설명은 빼고` / `summarizeState 에 type=…(추정)`
- [ ] **Step 2: Run** `npm run test:int -- tests/integration/pipeline.test.ts` 와 `npx vitest run tests/unit/prompt.test.ts` — Expected: FAIL
- [ ] **Step 3: Implement** 위 내용을 구현한다. 시스템 프롬프트 문구는 기존 규칙 문체(한 줄, "- " 로 시작)를 따른다.
- [ ] **Step 4: Run** `npm test` 와 `npm run test:int` — Expected: PASS
- [ ] **Step 5: Commit** `feat(chat): 망 종류 추정·망연계 추정 그리기를 대화 차례에 넣는다`

### Task 7: 서버 액션 — 망 종류 확인·바꾸기, 망연계 맞아요·아니에요

**Files:**
- Create: `src/server/zoneType.ts`, `src/server/linkGuess.ts`
- Modify: `src/app/(app)/actions.ts`
- Test: `tests/integration/link-guess.test.ts`

**Interfaces:**
- Consumes: Task 2·3·4·5, 기존 `withDiagramLock`, `createVersion(…, {source:"form"})`, `rewriteFlows`.
- Produces:
  ```ts
  export async function setZoneTypeFor(userId: string, diagramId: string, groupId: string, key: string | null): Promise<{ number: number | null }>;
  // key 가 지금 값과 같고 이미 user 면 버전 없음. 저장 값 { key, source:"user", confirmed:true }. key 는 그 계정 지식에 있어야 한다. null 이면 칸을 지운다.
  export async function confirmLinkGuessFor(userId: string, diagramId: string, nodeId: string): Promise<{ number: number | null }>; // guess 를 지운다
  export async function rejectLinkGuessFor(userId: string, diagramId: string, nodeId: string): Promise<{ number: number | null; partial: boolean }>;
  // actions.ts
  setZoneTypeAction(diagramId, groupId, key|null): Promise<ActionResult<{ number: number | null }>>
  confirmLinkGuessAction(diagramId, nodeId): Promise<ActionResult<{ number: number | null }>>
  rejectLinkGuessAction(diagramId, nodeId): Promise<ActionResult<{ number: number | null; partial: boolean }>>
  ```
- **`rejectLinkGuessFor`** (잠금 안에서 한 번에 처리한다):
  1. `revertLinkGuess` 를 부른다. `not_guess`·`not_found` 면 `{number:null, partial:false}` 를 돌려준다(두 번 누름, Review Focus 5).
  2. 망연계 앞·뒤 노드의 망 짝으로 `noLinkKey` 가정을 `confirmed:true` 로 넣는다. value 는 `"망연계 없이 통신(사용자 확인)"` 이다.
  3. `linkWarningId("link_expected", a, b)` 를 `ignoredWarnings` 에 더한다.
  4. `form` 버전을 만든다.
  5. `rewriteFlows(f => mergeFlowSteps(f, merges))` 를 부른다.
- 잠금 중이면 `ValidationError(BUSY_MESSAGE)` 를 던진다. 기존 `setWarningIgnoredFor` 와 같다.

- [ ] **Step 1: Write the failing tests**
  - `setZoneTypeFor: AI 추정을 확인하면 user·confirmed, 같은 값 다시면 버전 없음, 지식에 없는 key 는 ValidationError`
  - `confirmLinkGuessFor: guess 가 사라지고 노드·연결은 그대로`
  - `rejectLinkGuessFor: 노드만 지우고 원래 연결 복원, 확정 no_link 가정, 경고 무시, 흐름 단계 합침, 버전 하나`
  - `rejectLinkGuessFor 두 번째 호출은 버전 없음` (Review Focus 5)
  - `잠금 중이면 BUSY_MESSAGE` (Review Focus 5)
  - `다른 계정 구성도는 NotFoundError`
- [ ] **Step 2: Run** `npm run test:int -- tests/integration/link-guess.test.ts` — Expected: FAIL
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run** 같은 명령 — Expected: PASS
- [ ] **Step 5: Commit** `feat(network): 망 종류 확인과 망연계 맞아요·아니에요 서버 액션`

### Task 8: 구성도 화면 — 지식 전달, 안내 카드, 빠진 정보 줄, 망연계 노드 표시

**Files:**
- Create: `src/ui/network/NetworkKnowledgeContext.tsx`
- Create: `src/ui/network/ZoneTypePicker.tsx`
- Modify: `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx` (`ensureNetworkSeeded` + `getNetworkKnowledge` → prop)
- Modify: `src/ui/DiagramWorkspace.tsx` (Provider)
- Modify: `src/canvas/Canvas.tsx`, `src/ui/canvas/InfoCard.tsx`, `src/ui/NodeInfo.tsx`, `src/ui/chat/MissingChecklist.tsx` (`mergeWarnings`/`computeMissing` 에 지식 전달)
- Modify: `src/canvas/NodeCard.tsx` (guess 배지)
- Modify: `src/ui/chat/AssumptionChips.tsx` (`no_link:` key 표시 이름)
- Modify: `src/ui/glossary/aiBadge.ts` (`AI_GUESS_BADGE = "AI 추정"`)
- Test: `tests/unit/InfoCard.test.tsx`, `tests/unit/MissingChecklist.test.tsx`, `tests/unit/NodeInfo.test.tsx`, `tests/unit/AssumptionChips.test.tsx`(기존 파일이 있으면 거기에)

**Interfaces:**
- Consumes: Task 3 판정, Task 7 액션, Task 5 `getNetworkKnowledge`.
- Produces:
  ```tsx
  export function NetworkKnowledgeProvider(props: { value: NetworkKnowledge | null; children: ReactNode }): JSX.Element;
  export function useNetworkKnowledge(): NetworkKnowledge | null;
  export function ZoneTypePicker(props: { diagramId: string; groupId: string; value: ZoneType | undefined; readOnly?: boolean; onSaved(number: number | null): void }): JSX.Element;
  // "맞아요"(AI 추정일 때만) + 종류 고르기(등급별 묶음 select) 
  ```
- 동작:
  - **안내 카드(InfoCard 경고 줄):** `link_expected`·`link_unusual` 경고 줄 아래에, 그 짝의 두 망 중 AI 추정인 망마다 `ZoneTypePicker` 를 둔다. 예: "행정망을 '행정망'으로 추정했어요 [맞아요] [바꾸기]".
  - **빠진 정보 목록:** `targetKind:"group"` 줄은 저장 폼 대신 `ZoneTypePicker` 를 쓴다.
  - **망연계 노드 정보(NodeInfo):** `guess` 가 있으면 `AI 추정` 배지와 `맞아요`/`아니에요` 단추를 둔다. `partial` 이면 "주변 연결이 바뀌어 일부만 되돌렸어요." 를 알린다.
    - 저장 뒤에는 기존 폼 저장처럼 최신 버전을 다시 불러온다. `saveFieldsAction` 을 쓰는 쪽의 갱신 방식을 따른다.
  - **NodeCard:** guess 노드에 작은 `AI 추정` 표시를 둔다. 1단계 이름·배지 규칙과 토큰 색을 따르고, 평소 화면을 어지럽히지 않게 작게 한다.
  - **흐름 탭:** `crossingNote` 를 부르는 곳(흐름 단계 설명)에 지식을 넘긴다.
  - **AssumptionChips:** `parseNoLinkKey` 가 맞으면 라벨을 `"망연계 없음: <A 이름> ↔ <B 이름>"` 으로 보이고, 선택지 칩은 두지 않는다.
  - **지식이 null 일 때:** 화면은 지금과 똑같다(Review Focus 1).

- [ ] **Step 1: Write the failing tests**
  - `InfoCard: 행정망 사례 경고와 추정 망의 맞아요 단추, 누르면 setZoneTypeAction(…, key)`
  - `MissingChecklist: 망 종류 줄은 종류 고르기로 보인다`
  - `NodeInfo: guess 노드에 AI 추정·맞아요·아니에요, 아니에요 누르면 rejectLinkGuessAction, partial 이면 안내 문장`
  - `AssumptionChips: no_link 가정은 망 이름 짝으로 보인다`
  - `지식 없이 렌더하면 새 줄·배지가 없다` (Review Focus 1)
- [ ] **Step 2: Run** `npx vitest run tests/unit/InfoCard.test.tsx tests/unit/MissingChecklist.test.tsx tests/unit/NodeInfo.test.tsx tests/unit/AssumptionChips.test.tsx` — Expected: FAIL
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run** `npm test` 와 `npm run lint` — Expected: PASS
- [ ] **Step 5: Commit** `feat(ui): 연결 방식 예상 안내·망 종류 확인·망연계 AI 추정 표시`

### Task 9: 망 지식 화면

**Files:**
- Create: `src/app/(app)/network/page.tsx`
- Create: `src/ui/network/NetworkKnowledgePage.tsx`, `src/ui/network/network.module.css`
- Modify: `src/ui/Sidebar.tsx` (용어 사전 링크 옆에 "망 지식", 펼침·레일 둘 다)
- Modify: `src/app/(app)/actions.ts` (망 지식 액션들)
- Test: `tests/unit/NetworkKnowledgePage.test.tsx`

**Interfaces:**
- Consumes: Task 5 서버 함수.
- Produces: actions `listNetworkAction()`(종류·규칙·종류별 사용 수), `addNetworkTypeAction`, `updateNetworkTypeAction`, `resetNetworkTypeAction`, `setNetworkTypeHiddenAction`, `deleteNetworkTypeAction`, `upsertNetworkRuleAction`, `deleteNetworkRuleAction`. 모두 `ActionResult` 를 돌려준다.
- 화면(스펙 1-3):
  - `GlossaryPage` 와 같은 셸·목록·편집 방식을 쓴다.
  - **망 종류 목록:** 등급별로 묶는다. 출처 표시는 "기본 제공" / "사용자가 고침" / "직접 추가" 이다. 기본 제공 항목에는 "기본값으로 되돌리기"(고친 것만)와 "쓰지 않음"을 둔다. 직접 추가한 항목에는 "지우기"를 둔다.
    - 지우기 전 확인에는 `구성도 N곳의 망이 이 종류를 써요` 를 보인다. N 은 `countZonesUsingType` 이다.
  - **연결 규칙:** 기본 등급 규칙 표는 읽기 전용이다. 그 아래 "기관 규칙"에서 종류 짝 + 방식 + 근거를 더하고, 고치고, 지운다.
  - 기존 `dialogs.tsx` 확인 창을 쓴다.

- [ ] **Step 1: Write the failing tests**
  - `등급별 묶음과 기본 제공 표시`
  - `사용자 종류 추가 → addNetworkTypeAction 호출`
  - `기본 제공은 지우기 대신 쓰지 않음, 고친 항목만 되돌리기`
  - `사용 중인 종류 지우기 확인에 구성도 수`
  - `기관 규칙 추가: 두 종류·방식·근거`
- [ ] **Step 2: Run** `npx vitest run tests/unit/NetworkKnowledgePage.test.tsx` — Expected: FAIL
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run** `npm test` 와 `npm run lint` — Expected: PASS
- [ ] **Step 5: Commit** `feat(ui): 망 지식 화면 — 망 종류·기관 연결 규칙 편집`

### Task 10: E2E 와 문서

**Files:**
- Create: `tests/e2e/network-knowledge.spec.ts`
- Modify: `tests/e2e/fake-llm.ts` (행정망 사례 응답)
- Modify: `README.md` (기능 한 줄, 마이그레이션 0007 안내는 기존 "다시 db:migrate" 문장으로 충분한지 확인)

- [ ] **Step 1: Write the failing E2E**
  - `행정망 사례`: 대화로 "행정망 PC가 GCloud 인터넷망 WAS에 접속해"를 보낸다. 가짜 응답으로 망연계(guess)가 그려진다.
    - 망연계 노드에 `AI 추정` 이 보인다.
    - `아니에요` 를 누르면 방화벽 → WAS 연결이 돌아온다.
    - "망연계 필요 예상" 안내는 보이지 않는다(꺼짐).
    - 다음 대화 프롬프트에 `no_link:` 가정이 들어간다(가짜 LLM 이 받은 요청으로 확인).
  - `기관 규칙이 다른 프로젝트에도`: 망 지식 화면에서 "행정망 ↔ 공공 클라우드 내부 영역: 망연계 필요(○○ 지침)"를 더한다. 그다음 다른 프로젝트 구성도(두 망, 방화벽만)를 열면 근거가 들어간 안내가 보인다.
- [ ] **Step 2: Run** `npm run test:e2e -- tests/e2e/network-knowledge.spec.ts` — Expected: FAIL 뒤 구현이 이미 있으므로 응답·셀렉터를 맞춰 PASS
- [ ] **Step 3: Run** 전체 `npm test`, `npm run test:int`, `npm run test:e2e`, `npm run lint`, `npx tsc --noEmit` — Expected: 모두 PASS
- [ ] **Step 4: Commit** `test(e2e): 행정망 망연계 추정·되돌리기와 계정 공통 기관 규칙`
- [ ] **Step 5: 문서 사이트(합친 뒤).** main 에 합친 다음 docs worktree(`infra-architecture-docs`, `feat/docs-site`)에서 `git merge main` 을 한다(rebase 금지). 그리고 `website/docs/guide/architecture.md` 를 고친다.
  - 대화 한 차례 흐름: 망 지식 읽기, 차례 끝 `set_link_guess`·흐름 나누기
  - 변경 명령 표: `set_zone_type`, `add_node.guess`, `set_link_guess`(서버 전용)
  - 데이터 모델: `network_types`, `network_rules`, `Group.netType`, `DNode.guess`
  - 폴더 구성: `src/ui/network/`
  - 그다음 `cd website && npm run docs:refresh && npm run build` 를 돌리고 커밋한다. 푸시는 사용자 요청 시에만 한다.
