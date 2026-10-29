# InfraSketch 1단계: 기반과 캔버스 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인한 사용자가 프로젝트와 구성도를 만들고, 샘플 구성도(스파이크에서 실제 Qwen 이 만든 5개)를 불러와 P1+ 디자인·자동 배치·연결선 움직임으로 보고, 노드를 선택·편집 모드로 옮기고, 버전을 되돌리고 비교할 수 있다. AI 연동은 2단계, 설명·사전·빠진 정보·경고는 3단계.

**Architecture:** Next.js App Router 한 프로젝트. 구성도는 `DiagramState`(그룹·노드·연결·가정) 순수 데이터이며, 변경은 오직 `applyCommand` 를 거친다(2단계 AI 스트림이 같은 함수를 쓴다). 화면은 `DiagramState` → 표시 변환(보조 숨김·버스 단순화·중복 병합·접기) → ELK 배치 → React Flow(노드·영역) + 자체 SVG 연결선 레이어(구간 그래프로 갈래 동기화 움직임)로 그린다. 버전은 상태 JSON 스냅샷.

**Tech Stack:** Node 22, Next.js 15 (App Router, TypeScript strict), React 19, @xyflow/react 12, elkjs 0.9.x, PostgreSQL 16 (Docker), drizzle-orm + drizzle-kit, Auth.js v5 (`next-auth@beta`, Credentials, JWT 세션), bcryptjs, nodemailer, zod, Vitest, @testing-library/react, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md` (이하 "스펙"). 스파이크 원자료: `docs/superpowers/spike/spike-results.json`.

## Global Constraints

- UI 언어 한국어, 기술 용어 원어 병기. 문장형 대소문자, 버튼은 동작을 말한다("구성도 만들기", "되돌리기").
- 색은 컴포넌트에 직접 쓰지 않는다. 모든 색·반경은 `src/styles/tokens.css` 의 CSS 변수(스펙 §5.2.2 표 값 그대로)만 참조.
- 강조색 `--accent #D4AE6C` 는 흐름 빛 머리·선택 테두리·"방금 수정됨" 에만. glow·그라데이션·노드 색 띠 금지.
- 글꼴 IBM Plex Sans KR 400/500/600 (`next/font/google`).
- 구성도 구조 변경은 `applyCommand` 로만. 캔버스에 노드/연결 추가·삭제 UI 없음. 노드 드래그는 편집 모드에서만.
- LLM 은 좌표를 정하지 않는다. 좌표는 ELK 결과 또는 편집 모드 고정 위치(`pinnedPositions`)뿐.
- 기본 배치 방향 위→아래(DOWN). `redundancy_group`·`k8s_cluster` 내부는 RIGHT. 외부 서비스 그룹은 본 흐름 오른쪽.
- 정리 옵션 4종(보조 숨김, 버스 단순화, 라벨 hover, 중복 병합) 기본 ON.
- 연결선 속도 90px/s(async 75%, replication 50%), `prefers-reduced-motion` 또는 사용자 토글 시 정지.
- 노드 40개 초과 구성도는 하위 영역을 접은 상태로 연다.
- 키·주소는 `.env` 에서만. 저장소에는 `.env.example`(값 없음)만. `.env` 는 이미 gitignore 됨.
- 프로젝트는 소유자만 접근. 남의 프로젝트/구성도 id 로 요청하면 404.

## Review Focus

1. **사용자 노드 이름이 매우 긴 경우**(한글 30자 이상) → 노드는 최대 너비에서 말줄임표, 겹침 0. → Task 9 `long labels truncate without overlap`.
2. **빈 구성도·빈 그룹**(노드 0개, 자식 없는 그룹) → 배치가 throw 하지 않고 빈 상태 안내/최소 크기 그룹. → Task 9 `empty state and empty group`.
3. **잘못된 명령이 섞인 연속 적용**(중복 id, 없는 부모, 삭제된 노드 참조) → 그 명령만 거부되고 이전 상태는 그대로. → Task 3 `rejected command leaves state untouched`.
4. **버전 동시 생성**(같은 구성도에 두 요청이 동시에 버전 저장) → 번호가 겹치지 않고 연속. → Task 5 `concurrent createVersion gets distinct numbers`.
5. **다른 사용자의 리소스 접근** → 404, 데이터 노출 없음. → Task 7 `other user's project returns not found`.

---

## 파일 구조

```
docker-compose.yml                 Postgres 16 (dev 5432, test 5433)
.env.example
drizzle.config.ts
src/
  env.ts                           zod 로 환경변수 검증
  domain/
    catalog.ts                     노드/그룹/연결 종류 카탈로그 (스펙 §5.1.1, §5.2)
    types.ts                       DiagramState, Group, DNode, Edge, Assumption
    commands.ts                    명령 zod 스키마(wire: snake_case) → 파싱
    apply.ts                       applyCommand, applyCommands
    diff.ts                        diffStates (버전 비교, 등장 애니메이션 공용)
  db/
    schema.ts                      drizzle 테이블
    client.ts                      db 인스턴스
    migrations/                    drizzle-kit 생성물
  server/
    auth/                          password.ts, signup.ts, reset.ts, mailer.ts
    projects.ts                    프로젝트·구성도 CRUD (소유자 검사)
    versions.ts                    createVersion, listVersions, getVersion, restoreVersion
    samples.ts                     스파이크 픽스처 → 구성도 가져오기
  auth.ts                          Auth.js 설정
  canvas/
    display.ts                     buildDisplayGraph (정리 옵션 + 접기)
    text.ts                        textWidth, truncate
    layout.ts                      layoutDiagram (ELK)
    overlap.ts                     findOverlaps
    elbow.ts                       elbowRoute (고정 노드용 단순 직교 경로)
    segments.ts                    buildSegmentBundles (갈래 동기화 타이밍)
    icons.tsx                      분류 아이콘 5종
    NodeCard.tsx, GroupBox.tsx     React Flow 커스텀 노드
    EdgeLayer.tsx                  자체 SVG 연결선 + 움직임
    Canvas.tsx                     React Flow 통합, 선택·편집 모드·줌 단계
  app/
    (auth)/login, signup, reset    페이지
    (app)/layout.tsx               3단 레이아웃
    (app)/p/[projectId]/d/[diagramId]/page.tsx
    api/auth/[...nextauth]/route.ts
  ui/
    Sidebar.tsx, RightPanel.tsx, NodeInfo.tsx, HistoryPanel.tsx
  styles/tokens.css, globals.css
tests/
  fixtures/spike.ts                spike-results.json → 현재 스키마로 변환한 DiagramState 5개
  unit/…  integration/…  e2e/…
```

---

### Task 1: 프로젝트 골격, 환경변수, 테스트 기반

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `docker-compose.yml`, `.env.example`, `src/env.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/styles/tokens.css`, `src/styles/globals.css`
- Test: `tests/unit/env.test.ts`

**Interfaces:**
- Produces: `env` (검증된 객체) — `env.DATABASE_URL: string`, `env.AUTH_SECRET: string`, `env.SMTP_HOST?: string`, `SMTP_PORT?: number`, `SMTP_USER?`, `SMTP_PASS?`, `SMTP_FROM?`, `env.APP_URL: string`(기본 `http://localhost:3000`). Qwen·Clef 변수는 2단계에서 추가. `parseEnv(raw: Record<string,string|undefined>)` 도 export (테스트용).
- Produces: `tokens.css` 의 CSS 변수 이름 — `--bg-canvas --bg-node --line-node --text-primary --text-secondary --accent --cat-client --cat-network --cat-compute --cat-data --cat-external --edge-request --edge-async --edge-replication --edge-aux --state-missing --state-warn --zone-region --zone-vpc --zone-subnet-public --zone-subnet-private --zone-redundancy --zone-external --radius-node --radius-zone`. 값은 스펙 §5.2.2 표 (`--zone-subnet-public #384A66`, `--zone-subnet-private #34465F`, `--radius-node 6px`, `--radius-zone 8px`).

- [ ] **Step 1:** `npx create-next-app@15 . --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*"` (기존 docs/, .gitignore 유지). 의존성 설치: `@xyflow/react elkjs drizzle-orm postgres next-auth@beta bcryptjs nodemailer zod`, dev: `drizzle-kit vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test @types/bcryptjs @types/nodemailer tsx`.
- [ ] **Step 2:** `docker-compose.yml`: 서비스 `db`(postgres:16, 5432, db `infrasketch`), `db_test`(postgres:16, 5433, db `infrasketch_test`). `.env.example` 에 스펙 §10.1 키 목록 + `DATABASE_URL_TEST=` + `APP_URL=` 를 값 없이.
- [ ] **Step 3: Write the failing test** `tests/unit/env.test.ts`

```ts
test("requires DATABASE_URL and AUTH_SECRET", () => {
  expect(() => parseEnv({ AUTH_SECRET: "x" })).toThrow(/DATABASE_URL/);
});
test("SMTP is optional and port is numeric", () => {
  const e = parseEnv({ DATABASE_URL: "postgres://a", AUTH_SECRET: "x", SMTP_PORT: "587" });
  expect(e.SMTP_PORT).toBe(587);
  expect(e.SMTP_HOST).toBeUndefined();
  expect(e.APP_URL).toBe("http://localhost:3000");
});
```

- [ ] **Step 4:** `npx vitest run tests/unit/env.test.ts` → FAIL (parseEnv 없음).
- [ ] **Step 5:** `src/env.ts` 에 `parseEnv` 와 `env = parseEnv(process.env)` 구현(zod). `vitest.config.ts`: jsdom 환경은 `tests/unit/**/*.tsx` 만, 나머지 node. `tokens.css` 작성, `globals.css` 에서 import, `layout.tsx` 에서 IBM Plex Sans KR 로드(`next/font/google`, subsets 없이 weight 400/500/600) 후 `body` 에 적용, `body { background: var(--bg-canvas); color: var(--text-primary) }`.
- [ ] **Step 6:** `npx vitest run` → PASS. `npm run build` → 성공.
- [ ] **Step 7: Commit** `chore: Next.js 골격, 환경변수 검증, 디자인 토큰`

---

### Task 2: 도메인 카탈로그와 명령 스키마

**Files:**
- Create: `src/domain/catalog.ts`, `src/domain/types.ts`, `src/domain/commands.ts`
- Test: `tests/unit/commands.test.ts`

**Interfaces:**
- Produces (`catalog.ts`):
  - `NODE_KINDS` — 스펙 §5.1.1 표의 kind 전부. 각 항목 `{ kind, labelKo: string /* 예: was→"WAS", db_rdb→"관계형 DB", lb_l4→"L4 로드밸런서" */, category: "client"|"network"|"compute"|"data"|"external", requiredAttrs: string[] }`. 분류 매핑: 사용자/클라이언트→client, 진입·네트워크→network, 서버·컨테이너·서버리스·운영·메시징→compute, 데이터→data, 외부→external, generic→compute. requiredAttrs 는 표의 "필수 속성"을 속성 키로(`hostname cpu ram disk os ip sw` 등, 3단계 빠진 정보가 사용).
  - `GROUP_KINDS` — `cloud_region vpc subnet_public subnet_private dmz idc onprem_zone k8s_cluster external_service redundancy_group`, 각 `{ kind, labelKo: string, zoneToken: "--zone-…", innerDirection: "DOWN"|"RIGHT", dashed: boolean }` (`redundancy_group`·`k8s_cluster` → RIGHT).
  - `EDGE_KINDS` — `request async replication aux`, 각 `{ kind, label, colorToken, dash: string|null, motion: "comet"|"capsule"|"sheen"|"none", speedFactor: 1|0.75|0.5|0, defaultHidden: boolean }` (스펙 §5.2 표 값; aux 만 defaultHidden true).
  - 타입 `NodeKind`, `GroupKind`, `EdgeKind`, `Category`, `categoryOf(kind: NodeKind): Category`.
- Produces (`types.ts`):

```ts
export type Attrs = Record<string, string | number | null>;
export interface Group { id: string; groupKind: GroupKind; label: string; parent: string | null }
export interface DNode { id: string; kind: NodeKind; label: string; sub?: string; parent: string | null; attrs: Attrs }
export interface Edge { id: string; from: string; to: string; edgeKind: EdgeKind; label?: string }
export interface Assumption { key: string; value: string; confirmed: boolean }
export interface DiagramState { groups: Record<string, Group>; nodes: Record<string, DNode>; edges: Record<string, Edge>; assumptions: Record<string, Assumption> }
export const emptyState: () => DiagramState;
```

- Produces (`commands.ts`): `Command` 판별 유니언(`op`) — `add_group{id,group_kind,label,parent}`, `add_node{id,kind,label,sub?,parent,attrs?}`, `add_edge{id?,from,to,edge_kind,label?}`, `update_node{id,label?,sub?,parent?,attrs?}`, `update_edge{id,label?,edge_kind?}`, `remove_node{id}`, `remove_edge{id}`, `set_assumption{key,value}`. 와이어 형식은 스파이크와 같은 snake_case. `parseCommand(raw: unknown): { ok: true; cmd: Command } | { ok: false; error: string }`. id 규칙: `/^[a-z0-9][a-z0-9-]{0,63}$/`. 2단계가 `say`·`warn` 같은 비구조 명령을 별도로 처리하므로 여기서는 위 8종만.

- [ ] **Step 1: Write the failing test**

```ts
test("parses add_node with snake_case wire fields", () => {
  const r = parseCommand({ op: "add_node", id: "was-1", kind: "was", label: "WAS#1", parent: "was-pair", attrs: { ram: null } });
  expect(r.ok && r.cmd.op).toBe("add_node");
});
test("rejects unknown kind", () => {
  const r = parseCommand({ op: "add_node", id: "x", kind: "webserver", label: "x", parent: null });
  expect(r.ok).toBe(false);
});
test("rejects bad id", () => expect(parseCommand({ op: "remove_node", id: "WAS 1" }).ok).toBe(false));
test("catalog: every node kind has a category, redundancy_group lays out RIGHT, aux hidden", () => {
  expect(NODE_KINDS.every(k => k.category)).toBe(true);
  expect(GROUP_KINDS.find(g => g.kind === "redundancy_group")!.innerDirection).toBe("RIGHT");
  expect(EDGE_KINDS.find(e => e.kind === "aux")!.defaultHidden).toBe(true);
  expect(categoryOf("db_proxy")).toBe("data");
});
```

- [ ] **Step 2:** `npx vitest run tests/unit/commands.test.ts` → FAIL.
- [ ] **Step 3:** 세 파일 구현.
- [ ] **Step 4:** 테스트 → PASS.
- [ ] **Step 5: Commit** `feat: 노드·그룹·연결 카탈로그와 명령 스키마`

---

### Task 3: 명령 적용기

**Files:**
- Create: `src/domain/apply.ts`
- Test: `tests/unit/apply.test.ts`

**Interfaces:**
- Consumes: `Command`, `DiagramState` (Task 2)
- Produces: `applyCommand(state: DiagramState, cmd: Command): { ok: true; state: DiagramState } | { ok: false; error: string; state: DiagramState }` — 순수·불변(입력 state 를 바꾸지 않음). 실패 시 `state` 는 입력 그대로. `applyCommands(state, cmds): { state; errors: { index: number; error: string }[] }`.

규칙: id 는 그룹·노드 공간에서 유일. `parent` 는 존재하는 그룹 id 또는 null. 연결 끝점은 노드 또는 그룹. `add_edge` id 생략 시 `e-${from}-${to}`, 이미 있으면 `-2`, `-3` 접미. `remove_node` 는 걸린 연결도 제거. `update_node.attrs` 는 병합(null 값도 기록), `parent` 변경 시 존재 검사. `set_assumption` 은 `confirmed` 가 true 인 키를 바꾸지 않고 오류(`"assumption <key> is confirmed"`). 오류 문자열은 한국어가 아니어도 됨(내부용).

- [ ] **Step 1: Write the failing tests**

```ts
const base = () => applyCommands(emptyState(), [
  { op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: null },
  { op: "add_node", id: "was-1", kind: "was", label: "WAS#1", parent: "vpc" },
  { op: "add_node", id: "db", kind: "db_rdb", label: "DB", parent: "vpc" },
  { op: "add_edge", from: "was-1", to: "db", edge_kind: "request", label: "JDBC" },
]).state;

test("builds state and defaults edge id", () => {
  expect(Object.keys(base().edges)).toEqual(["e-was-1-db"]);
});
test("rejected command leaves state untouched", () => {
  const s = base();
  for (const bad of [
    { op: "add_node", id: "db", kind: "cache", label: "dup", parent: null },
    { op: "add_node", id: "n", kind: "cache", label: "n", parent: "nope" },
    { op: "add_edge", from: "ghost", to: "db", edge_kind: "request" },
  ] as Command[]) {
    const r = applyCommand(s, bad);
    expect(r.ok).toBe(false);
    expect(r.state).toBe(s);
  }
});
test("remove_node drops incident edges", () => {
  const r = applyCommand(base(), { op: "remove_node", id: "db" });
  expect(r.ok && Object.keys(r.state.edges)).toEqual([]);
});
test("update_node merges attrs", () => {
  const r = applyCommand(base(), { op: "update_node", id: "was-1", attrs: { ram: "32GB" } });
  expect(r.ok && r.state.nodes["was-1"].attrs).toEqual({ ram: "32GB" });
});
test("confirmed assumption cannot be overwritten", () => {
  let s = applyCommand(base(), { op: "set_assumption", key: "environment", value: "AWS" }).state;
  s = { ...s, assumptions: { environment: { ...s.assumptions.environment, confirmed: true } } };
  expect(applyCommand(s, { op: "set_assumption", key: "environment", value: "IDC" }).ok).toBe(false);
});
test("input state is never mutated", () => {
  const s = base(); const snap = JSON.stringify(s);
  applyCommand(s, { op: "remove_node", id: "was-1" });
  expect(JSON.stringify(s)).toBe(snap);
});
```

- [ ] **Step 2:** 실행 → FAIL. **Step 3:** 구현. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: 구성도 명령 적용기`

---

### Task 4: 상태 비교와 스파이크 픽스처

**Files:**
- Create: `src/domain/diff.ts`, `tests/fixtures/spike.ts`
- Test: `tests/unit/diff.test.ts`, `tests/unit/fixtures.test.ts`

**Interfaces:**
- Produces: `diffStates(a: DiagramState, b: DiagramState): { added: Set<string>; removed: Set<string>; changed: Set<string> }` — 그룹·노드·연결 id 대상, `changed` 는 같은 id 의 내용이 다름(깊은 비교).
- Produces: `spikeFixtures: { id: "s1"|"s2"|"s3"|"s4"|"s5"; title: string; state: DiagramState }[]` — `docs/superpowers/spike/spike-results.json` 을 import 해서 변환: `redundancy_pair`→`redundancy_group`; `group_kind: "az"` 그룹은 제거하고 그 자식의 parent 를 AZ 그룹의 parent 로 올리며 자식 노드 `attrs.az` 에 AZ 라벨 기록; 스파이크의 `group_kind`/`edge_kind`/`_updated` 필드를 camelCase 타입으로 매핑; `edge_kind` 중 `webhook`·`data_sync` 가 있으면 `async`·`replication` 으로; 모니터링 노드(`monitoring`·`logging`·`ci_cd`·`bastion`)에 걸린 연결은 `aux` 로. 변환 결과는 반드시 `applyCommands` 로 재구성해서 만든다(유효성 보장).
- Produces (테스트 헬퍼, 같은 파일): `fx(id: string): DiagramState`, `isInExternal(state: DiagramState, nodeId: string): boolean`(조상 중 `external_service` 그룹이 있으면 true), `synth(n: number): DiagramState`(vpc>subnet_private 안에 `app_server` n개, 사슬 연결).

- [ ] **Step 1: Write the failing tests**

```ts
test("diff detects added/removed/changed", () => {
  const a = /* base() from Task 3 shape */;
  const b = applyCommands(a, [{ op: "update_node", id: "was-1", label: "WAS-1" }, { op: "add_node", id: "r", kind: "cache", label: "Redis", parent: null }]).state;
  const d = diffStates(a, b);
  expect([...d.added]).toEqual(["r"]); expect([...d.changed]).toEqual(["was-1"]); expect(d.removed.size).toBe(0);
});
test("all 5 spike fixtures convert with zero apply errors and no az groups", () => {
  expect(spikeFixtures).toHaveLength(5);
  for (const f of spikeFixtures) {
    expect(Object.values(f.state.groups).some(g => (g.groupKind as string) === "az")).toBe(false);
    expect(Object.keys(f.state.nodes).length).toBeGreaterThan(5);
  }
});
test("s4 large fixture keeps ≥ 30 nodes", () => expect(Object.keys(spikeFixtures.find(f => f.id === "s4")!.state.nodes).length).toBeGreaterThanOrEqual(30));
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현(변환 중 applyCommands 오류가 있으면 throw). **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: 상태 비교와 스파이크 픽스처`

---

### Task 5: DB 스키마와 버전 저장

**Files:**
- Create: `drizzle.config.ts`, `src/db/schema.ts`, `src/db/client.ts`, `src/db/migrations/*`, `src/server/versions.ts`, `tests/integration/setup.ts`
- Test: `tests/integration/versions.test.ts`

**Interfaces:**
- Produces (테이블, drizzle):
  - `users(id uuid pk default random, username text unique not null, email text unique not null, passwordHash text not null, createdAt)`
  - `accounts(id uuid pk, userId fk→users cascade, provider text, providerAccountId text, unique(provider, providerAccountId))` — Nexus 연동 자리, 지금은 쓰지 않음
  - `passwordResetTokens(tokenHash text pk, userId fk, expiresAt timestamptz, usedAt timestamptz null)`
  - `projects(id uuid pk, ownerId fk→users cascade, name text, createdAt, updatedAt)`
  - `diagrams(id uuid pk, projectId fk→projects cascade, name text, pinnedPositions jsonb not null default '{}', createdAt, updatedAt)`
  - `diagramVersions(id uuid pk, diagramId fk→diagrams cascade, number int not null, state jsonb not null, source text not null /* 'import'|'restore'|'ai'|'form' */, status text not null default 'complete' /* 'complete'|'aborted' */, restoredFrom int null, createdAt, unique(diagramId, number))`
- Produces (`versions.ts`, 모두 `db` 를 첫 인자로 받지 않고 모듈 `db` 사용, 테스트는 `DATABASE_URL_TEST` 로 교체):
  - `createVersion(diagramId: string, state: DiagramState, opts: { source: "import"|"restore"|"ai"|"form"; status?: "complete"|"aborted"; restoredFrom?: number }): Promise<{ id: string; number: number }>` — 트랜잭션 안에서 `pg_advisory_xact_lock(hashtext(diagramId))` 후 `max(number)+1`.
  - `listVersions(diagramId): Promise<{ number; source; status; restoredFrom; createdAt }[]>` (최신 먼저)
  - `getVersion(diagramId, number): Promise<DiagramState | null>`, `getLatestState(diagramId): Promise<{ number: number; state: DiagramState } | null>`
  - `restoreVersion(diagramId, number): Promise<{ number: number }>` — 해당 상태로 새 버전(source 'restore', restoredFrom=number) 생성, 기존 이력 유지.

- [ ] **Step 1:** 스키마 작성, `npx drizzle-kit generate`, `tests/integration/setup.ts` 는 `DATABASE_URL_TEST` 로 마이그레이션 적용 후 각 테스트 전 `TRUNCATE users CASCADE`. `package.json` 스크립트: `"test:int": "vitest run tests/integration"`, `"db:migrate": "drizzle-kit migrate"`.
- [ ] **Step 2: Write the failing tests**

```ts
test("versions number sequentially and restore is non-destructive", async () => {
  const d = await makeDiagram(); // 헬퍼: user→project→diagram
  await createVersion(d, s1, { source: "import" });
  await createVersion(d, s2, { source: "ai" });
  const r = await restoreVersion(d, 1);
  expect(r.number).toBe(3);
  expect((await listVersions(d)).map(v => v.number)).toEqual([3, 2, 1]);
  expect(await getVersion(d, 3)).toEqual(s1);
});
test("concurrent createVersion gets distinct numbers", async () => {
  const d = await makeDiagram();
  const rs = await Promise.all(Array.from({ length: 5 }, () => createVersion(d, s1, { source: "ai" })));
  expect(rs.map(r => r.number).sort()).toEqual([1, 2, 3, 4, 5]);
});
test("aborted status is stored", async () => {
  const d = await makeDiagram();
  await createVersion(d, s1, { source: "ai", status: "aborted" });
  expect((await listVersions(d))[0].status).toBe("aborted");
});
```

- [ ] **Step 3:** `docker compose up -d db_test && npm run test:int -- versions` → FAIL. **Step 4:** 구현. **Step 5:** PASS.
- [ ] **Step 6: Commit** `feat: DB 스키마와 구성도 버전 저장`

---

### Task 6: 회원가입·로그인·비밀번호 찾기

**Files:**
- Create: `src/server/auth/password.ts`, `src/server/auth/signup.ts`, `src/server/auth/reset.ts`, `src/server/auth/mailer.ts`, `src/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/reset/page.tsx`, `src/app/(auth)/reset/[token]/page.tsx`
- Test: `tests/integration/auth.test.ts`

**Interfaces:**
- Produces: `signup(input: { username: string; password: string; email: string }): Promise<{ ok: true; userId: string } | { ok: false; field: "username"|"email"|"password"; message: string }>` — username `/^[a-z0-9_]{3,32}$/`, password 8자 이상, email 형식; 중복이면 해당 field 와 한국어 메시지("이미 쓰는 아이디입니다").
- Produces: `verifyCredentials(username, password): Promise<{ id: string; username: string } | null>` (bcryptjs cost 12).
- Produces: `requestPasswordReset(email): Promise<void>` — 사용자 없어도 같은 결과(존재 노출 금지). 토큰 32바이트 랜덤, DB 에는 sha256, 만료 1시간. 링크 `${APP_URL}/reset/${token}` 를 `sendMail` 로; `SMTP_HOST` 없으면 `console.info("[reset-link]", link)`.
- Produces: `resetPassword(token, newPassword): Promise<{ ok: boolean; message?: string }>` — 만료/사용됨/없음은 `ok:false`, 성공 시 `usedAt` 기록.
- Produces: `auth()` (Auth.js v5) — 세션 `session.user.id`. Credentials provider 가 `verifyCredentials` 사용, JWT 전략. `middleware.ts` 는 `/(app)` 경로 미로그인 시 `/login` 으로.

- [ ] **Step 1: Write the failing tests**

```ts
test("signup then verify", async () => {
  const r = await signup({ username: "jae", password: "password1", email: "a@b.co" });
  expect(r.ok).toBe(true);
  expect(await verifyCredentials("jae", "password1")).toMatchObject({ username: "jae" });
  expect(await verifyCredentials("jae", "wrong")).toBeNull();
});
test("duplicate username is a field error", async () => {
  await signup({ username: "jae", password: "password1", email: "a@b.co" });
  expect(await signup({ username: "jae", password: "password1", email: "c@d.co" })).toMatchObject({ ok: false, field: "username" });
});
test("reset token: single use, logged when no SMTP", async () => {
  const spy = vi.spyOn(console, "info").mockImplementation(() => {});
  await signup({ username: "jae", password: "password1", email: "a@b.co" });
  await requestPasswordReset("a@b.co");
  const token = String(spy.mock.calls[0][1]).split("/reset/")[1];
  expect((await resetPassword(token, "newpass12")).ok).toBe(true);
  expect((await resetPassword(token, "again1234")).ok).toBe(false);
  expect(await verifyCredentials("jae", "newpass12")).not.toBeNull();
});
test("unknown email does not throw and sends nothing", async () => {
  const spy = vi.spyOn(console, "info").mockImplementation(() => {});
  await requestPasswordReset("nobody@x.co");
  expect(spy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2:** FAIL. **Step 3:** 서버 함수 구현 → PASS.
- [ ] **Step 4:** Auth.js 설정·라우트·미들웨어·페이지 3종 구현. 폼 오류는 필드 아래 한국어로. 페이지 문구: 로그인 버튼 "로그인", 가입 버튼 "가입하기", 찾기 버튼 "재설정 링크 보내기", 보낸 뒤 "입력한 이메일로 재설정 링크를 보냈습니다. 메일이 없다면 주소를 확인해 주세요."
- [ ] **Step 5:** `npm run build` 성공 확인.
- [ ] **Step 6: Commit** `feat: 회원가입·로그인·비밀번호 재설정`

---

### Task 7: 프로젝트·구성도 관리와 샘플 가져오기

**Files:**
- Create: `src/server/projects.ts`, `src/server/samples.ts`
- Test: `tests/integration/projects.test.ts`

**Interfaces:**
- Consumes: `createVersion`, `getLatestState` (Task 5), `spikeFixtures` 변환 로직 — 변환 함수를 `tests/fixtures/spike.ts` 에서 `src/server/samples.ts` 로 옮기고 픽스처는 그것을 재사용하도록 바꾼다.
- Produces (모두 `userId` 를 첫 인자로 받아 소유자 검사, 남의 것이면 `NotFoundError` throw):
  - `listProjects(userId): Promise<{ id; name; diagrams: { id; name }[] }[]>`
  - `createProject(userId, name)`, `renameProject(userId, projectId, name)`, `deleteProject(userId, projectId)`
  - `createDiagram(userId, projectId, name): Promise<{ id }>` — 빈 상태로 버전 1(source 'import') 생성
  - `renameDiagram`, `deleteDiagram`, `duplicateDiagram(userId, diagramId): Promise<{ id }>` — 최신 상태로 새 구성도("<이름> 사본"), 버전 1
  - `getDiagram(userId, diagramId): Promise<{ id; name; projectId; pinnedPositions: Record<string,{x:number;y:number}>; latest: { number; state } }>`
  - `savePinnedPositions(userId, diagramId, positions)`, `clearPinnedPositions(userId, diagramId)` — 버전을 만들지 않음
  - `SAMPLES: { id; title }[]` 와 `importSample(userId, diagramId, sampleId)` — 해당 구성도에 새 버전(source 'import')
- 이름 규칙: 1~60자, 공백 trim.

- [ ] **Step 1: Write the failing tests**

```ts
test("other user's project returns not found", async () => {
  const a = await user("a"), b = await user("b");
  const p = await createProject(a, "쇼핑몰");
  await expect(renameProject(b, p.id, "x")).rejects.toBeInstanceOf(NotFoundError);
  const d = await createDiagram(a, p.id, "운영");
  await expect(getDiagram(b, d.id)).rejects.toBeInstanceOf(NotFoundError);
  expect(await listProjects(b)).toEqual([]);
});
test("import sample adds a version, duplicate copies latest", async () => {
  const a = await user("a"); const p = await createProject(a, "쇼핑몰");
  const d = await createDiagram(a, p.id, "운영");
  await importSample(a, d.id, "s2");
  const g = await getDiagram(a, d.id);
  expect(g.latest.number).toBe(2);
  const copy = await duplicateDiagram(a, d.id);
  expect((await getDiagram(a, copy.id)).latest.state).toEqual(g.latest.state);
});
test("pinned positions do not create versions", async () => {
  const a = await user("a"); const p = await createProject(a, "x"); const d = await createDiagram(a, p.id, "y");
  await savePinnedPositions(a, d.id, { "was-1": { x: 10, y: 20 } });
  const g = await getDiagram(a, d.id);
  expect(g.latest.number).toBe(1); expect(g.pinnedPositions["was-1"]).toEqual({ x: 10, y: 20 });
});
test("names are trimmed and length-checked", async () => {
  const a = await user("a");
  await expect(createProject(a, "   ")).rejects.toThrow();
  expect((await createProject(a, "  운영  ")).name).toBe("운영");
});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: 프로젝트·구성도 관리와 샘플 가져오기`

---

### Task 8: 표시 변환 (정리 옵션·접기)

**Files:**
- Create: `src/canvas/display.ts`
- Test: `tests/unit/display.test.ts`

**Interfaces:**
- Consumes: `DiagramState`, `EDGE_KINDS`, `categoryOf`
- Produces:

```ts
export interface DisplayOptions { hideAux: boolean; busSimplify: boolean; mergeDuplicates: boolean; collapsed: Set<string>; selectedId: string | null }
export const defaultDisplayOptions: (state: DiagramState) => DisplayOptions; // 정리 3종 true, selectedId null, collapsed = initialCollapsed(state)
export function initialCollapsed(state: DiagramState): Set<string>; // 노드 > 40 이면 parent 가 null 이 아닌 모든 그룹
export interface DisplayEdge { id: string; from: string; to: string; edgeKind: EdgeKind; label?: string; sourceEdgeIds: string[] }
export interface DisplayGroup extends Group { collapsed: boolean; hiddenCount: number }
export interface DisplayGraph { groups: Record<string, DisplayGroup>; nodes: Record<string, DNode>; edges: DisplayEdge[] }
export function buildDisplayGraph(state: DiagramState, opts: DisplayOptions): DisplayGraph;
```

규칙: `hideAux` 면 `aux` 연결 숨김, 단 `selectedId` 가 끝점이면 보임. `busSimplify` 면 `stream`·`queue` 노드와 연결된 연결을 (서비스→버스) 방향 하나로 정규화하고 같은 쌍 중복 제거, `edgeKind: "async"`, `label: "이벤트"`. `mergeDuplicates` 면 같은 (from,to) 연결을 하나로(첫 연결 종류·라벨 유지, `sourceEdgeIds` 에 원본 모두). 접힌 그룹: 하위 그룹·노드를 숨기고, 숨긴 끝점을 가장 가까운 접힌 조상 그룹 id 로 바꾼 뒤 자기 자신으로의 연결 제거·중복 제거, `hiddenCount` = 숨은 노드 수. 원본 `state` 불변.

- [ ] **Step 1: Write the failing tests** (픽스처 s3: Kafka 발행·구독, s4: 40개 미만이므로 별도 생성)

```ts
test("bus simplify turns pub/sub pairs into one service→bus edge", () => {
  const s3 = fx("s3"); const kafka = Object.values(s3.nodes).find(n => n.kind === "stream")!.id;
  const g = buildDisplayGraph(s3, { ...defaultDisplayOptions(s3) });
  const busEdges = g.edges.filter(e => e.to === kafka || e.from === kafka);
  expect(busEdges.every(e => e.to === kafka && e.edgeKind === "async")).toBe(true);
  expect(new Set(busEdges.map(e => e.from)).size).toBe(busEdges.length);
});
test("aux hidden unless an endpoint is selected", () => { /* s3 prometheus 연결 */ });
test("collapsed group re-targets edges and counts hidden nodes", () => {
  const s2 = fx("s2"); const pair = Object.values(s2.groups).find(g => g.groupKind === "redundancy_group")!.id;
  const g = buildDisplayGraph(s2, { ...defaultDisplayOptions(s2), collapsed: new Set([pair]) });
  expect(g.groups[pair].hiddenCount).toBe(2);
  expect(g.edges.some(e => e.to === pair || e.from === pair)).toBe(true);
  expect(g.edges.some(e => e.from === e.to)).toBe(false);
});
test("> 40 nodes starts with non-root groups collapsed", () => {
  const big = synth(45);
  expect(initialCollapsed(big).size).toBeGreaterThan(0);
  expect(initialCollapsed(fx("s2")).size).toBe(0);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: 표시 변환(보조 숨김·버스 단순화·중복 병합·접기)`

---

### Task 9: ELK 배치와 겹침 검사

**Files:**
- Create: `src/canvas/text.ts`, `src/canvas/layout.ts`, `src/canvas/overlap.ts`, `src/canvas/elbow.ts`
- Test: `tests/unit/layout.test.ts`

**Interfaces:**
- Consumes: `DisplayGraph` (Task 8), `GROUP_KINDS`
- Produces (`text.ts`): `textWidth(s: string, fontPx: number): number` — 한글·CJK·전각 1.0em, 그 외 0.58em. `truncate(s, maxPx, fontPx): string` — 넘으면 끝에 `…`.
- Produces (`layout.ts`):

```ts
export const NODE = { height: 44, minWidth: 132, maxWidth: 220, padLeft: 38 /* 아이콘 */, padRight: 18 /* 배지 자리 */, gap: 28, layerGap: 52 };
export const GROUP_PAD = { top: 30, side: 12, bottom: 12 }; // top 은 이름 머리 공간
export interface Rect { x: number; y: number; width: number; height: number }
export interface LaidOutNode extends Rect { id: string; displayLabel: string; displaySub?: string }
export interface LaidOutGroup extends Rect { id: string }
export interface LaidOutEdge { id: string; points: { x: number; y: number }[]; labelAt?: { x: number; y: number } }
export interface Layout { nodes: Record<string, LaidOutNode>; groups: Record<string, LaidOutGroup>; edges: LaidOutEdge[]; width: number; height: number }
export async function layoutDiagram(g: DisplayGraph, pinned: Record<string, { x: number; y: number }>): Promise<Layout>;
```

  배치 규칙: 노드 너비 = clamp(max(textWidth(label,12), textWidth(sub,9.5)) + padLeft + padRight, minWidth, maxWidth), 넘치는 이름은 `displayLabel` 에 truncate. ELK 옵션: `algorithm layered`, `hierarchyHandling INCLUDE_CHILDREN`, `edgeRouting ORTHOGONAL`, `spacing.nodeNode 28`, `layered.spacing.nodeNodeBetweenLayers 52`, `spacing.edgeNode 18`, `spacing.edgeEdge 12`, `layered.mergeEdges true`, `nodePlacement.strategy NETWORK_SIMPLEX`, 그룹 `padding [top=30,left=12,bottom=12,right=12]`, 그룹 내부 방향은 카탈로그 `innerDirection`. 루트는 두 부분: `main`(DOWN, partition 0)과 `externalLane`(DOWN, partition 1)을 루트 `direction RIGHT` + `partitioning.activate true` 로 배치해 외부 서비스가 항상 오른쪽. 자식 없는 그룹은 160×56. 연결은 **두 끝점의 공통 조상 컨테이너**에 넣고, 결과 좌표는 그 컨테이너의 절대 위치를 더해 절대 좌표로 변환(스파이크 버그 원인). `pinned` 에 있는 노드는 배치 후 그 좌표로 덮고, 그 노드에 걸린 연결은 `elbowRoute` 로 다시 그림.
- Produces (`elbow.ts`): `elbowRoute(a: Rect, b: Rect): {x:number;y:number}[]` — a 아래 중앙 → 중간 y → b 위 중앙(b 가 a 위에 있으면 반대, 같은 높이면 옆면) 3구간 직교.
- Produces (`overlap.ts`): `findOverlaps(l: Layout, opts?: { ring: number; badge: number }): string[]` — 기본 ring 4, badge 8. 검사: 노드끼리(ring 만큼 확장한 사각형 교차), 노드와 자기 조상이 아닌 그룹의 테두리 교차, 노드와 모든 조상 그룹의 머리 띠(`group.y` ~ `group.y + 30`) 교차, 배지 원(노드 오른쪽 위 꼭짓점 중심, 반지름 badge)과 다른 노드 교차. 반환은 `"a×b"` 설명 문자열 목록.

- [ ] **Step 1: Write the failing tests**

```ts
test.each(["s1","s2","s3","s4","s5"])("spike %s lays out with zero overlaps", async (id) => {
  const st = fx(id); const l = await layoutDiagram(buildDisplayGraph(st, defaultDisplayOptions(st)), {});
  expect(findOverlaps(l)).toEqual([]);
});
test("external service groups sit right of the main flow", async () => {
  const st = fx("s1"); const l = await layoutDiagram(buildDisplayGraph(st, defaultDisplayOptions(st)), {});
  const ext = Object.values(st.groups).filter(g => g.groupKind === "external_service").map(g => l.groups[g.id]);
  const mainRight = Math.max(...Object.values(st.nodes).filter(n => !isInExternal(st, n.id)).map(n => l.nodes[n.id].x + l.nodes[n.id].width));
  expect(ext.every(g => g.x >= mainRight)).toBe(true);
});
test("flow goes top→down: client above lb above was above db (s2)", async () => { /* y 순서 비교 */ });
test("redundancy group children sit side by side", async () => { /* s2 was-pair 두 노드 y 같음 */ });
test("edge points are absolute: every edge starts on its source rect border", async () => {
  // 각 edge 첫 점이 from 노드/그룹 사각형 경계에서 1px 이내
});
test("long labels truncate without overlap", async () => {
  const st = applyCommands(fx("s2"), [{ op: "update_node", id: "was-1", label: "주문결제통합처리애플리케이션서버첫번째인스턴스입니다" }]).state;
  const l = await layoutDiagram(buildDisplayGraph(st, defaultDisplayOptions(st)), {});
  expect(l.nodes["was-1"].width).toBe(220); expect(l.nodes["was-1"].displayLabel.endsWith("…")).toBe(true);
  expect(findOverlaps(l)).toEqual([]);
});
test("empty state and empty group", async () => {
  expect((await layoutDiagram(buildDisplayGraph(emptyState(), defaultDisplayOptions(emptyState())), {})).edges).toEqual([]);
  const g = applyCommand(emptyState(), { op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: null }).state;
  const l = await layoutDiagram(buildDisplayGraph(g, defaultDisplayOptions(g)), {});
  expect(l.groups.vpc).toMatchObject({ width: 160, height: 56 });
});
test("pinned node keeps its position and gets an elbow edge", async () => { /* s2 was-1 pinned (900,900) */ });
test("text helpers", () => { expect(textWidth("가나", 12)).toBe(24); expect(truncate("가나다라마", 40, 12)).toBe("가나…"); });
```

  (헬퍼 `fx`, `isInExternal` 은 Task 4 에서 만든 것.)

- [ ] **Step 2:** FAIL. **Step 3:** 구현. 겹침 테스트가 실패하면 간격 상수를 키워 맞추되 `NODE`·`GROUP_PAD` 값 변경은 커밋 메시지에 남긴다. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: ELK 배치(위→아래, 외부 오른쪽, 절대좌표 연결)와 겹침 검사`

---

### Task 10: 갈래 동기화 구간 그래프

**Files:**
- Create: `src/canvas/segments.ts`
- Test: `tests/unit/segments.test.ts`

**Interfaces:**
- Consumes: `LaidOutEdge[]`, `DisplayEdge[]`(종류·속도), `EDGE_KINDS.speedFactor`
- Produces:

```ts
export const BASE_SPEED = 90; // px/s
export interface Segment { key: string; d: string; length: number; edgeKind: EdgeKind; edgeIds: string[]; startMs: number }
export interface Bundle { id: string; periodMs: number; offsetMs: number; segments: Segment[]; junctions: { x: number; y: number }[] }
export function buildSegmentBundles(edges: { id: string; edgeKind: EdgeKind; points: { x: number; y: number }[] }[]): Bundle[];
```

알고리즘: 각 연결 폴리라인을 직선 조각으로 쪼개고 끝점을 0.5px 격자로 반올림해 조각 키를 만든다. 같은 키 조각은 하나의 `Segment`(공유)로 합치고, 연속된 비공유 조각은 이어 붙인다. 조각을 공유하는 연결끼리 한 `Bundle`. 번들 안에서 조각의 진행 그래프(DAG)를 만들고 시작 시각을 정한다: (1) 앞으로: 들어오는 조각이 없으면 0, 아니면 max(앞 조각 start + 앞 조각 length / speed). (2) 뒤로: 각 조각에 대해 앞 조각 start = 이 조각 start − 앞 조각 length / speed 로 끌어올려(합쳐짐에서 동시 도착), 변화가 없을 때까지 최대 10회 반복; 수렴하지 않으면 그 번들은 연결별 독립 타이밍으로 대체. speed = `BASE_SPEED × speedFactor`(한 번들 안 종류가 섞이면 가장 느린 값). `periodMs` = 번들 최대(start + length/speed) + 1200. 번들 `offsetMs` = 번들 순번 × 350 (mod periodMs). `junctions` = 들어오는 조각 ≥ 2 이거나 나가는 조각 ≥ 2 인 점. `aux`(speedFactor 0) 연결은 조각만 만들고 start 0.

- [ ] **Step 1: Write the failing tests**

```ts
// 갈라짐: 몸통 (0,0)→(0,90), 갈래 (0,90)→(-90,90)→(-90,180) / (0,90)→(90,90)→(90,180)
test("fan-out shares the trunk once and both branches start when the trunk ends", () => {
  const [b] = buildSegmentBundles([
    { id: "a", edgeKind: "request", points: [{x:0,y:0},{x:0,y:90},{x:-90,y:90},{x:-90,y:180}] },
    { id: "b", edgeKind: "request", points: [{x:0,y:0},{x:0,y:90},{x:90,y:90},{x:90,y:180}] },
  ]);
  const trunk = b.segments.find(s => s.edgeIds.length === 2)!;
  expect(trunk.length).toBe(90);
  const branches = b.segments.filter(s => s.edgeIds.length === 1);
  expect(branches.map(s => s.startMs)).toEqual([1000, 1000]);
  expect(b.junctions).toEqual([{ x: 0, y: 90 }]);
});
test("fan-in: branches of different length arrive at the join together", () => {
  const [b] = buildSegmentBundles([
    { id: "a", edgeKind: "request", points: [{x:-180,y:0},{x:-180,y:90},{x:0,y:90},{x:0,y:180}] }, // 갈래 270
    { id: "b", edgeKind: "request", points: [{x:90,y:0},{x:90,y:90},{x:0,y:90},{x:0,y:180}] },     // 갈래 180
  ]);
  const ends = b.segments.filter(s => s.edgeIds.length === 1).map(s => s.startMs + s.length / 90 * 1000);
  expect(Math.abs(ends[0] - ends[1])).toBeLessThan(1);
  const tail = b.segments.find(s => s.edgeIds.length === 2)!;
  expect(Math.abs(tail.startMs - ends[0])).toBeLessThan(1);
});
test("unrelated edges are separate bundles with staggered offsets", () => { /* 2 bundles, offset 0 / 350 */ });
test("replication bundle uses half speed", () => { /* 길이 90 조각 다음 조각 start 2000 */ });
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: 갈라지고 합쳐지는 연결선 타이밍 계산`

---

### Task 11: 노드·영역 컴포넌트와 아이콘

**Files:**
- Create: `src/canvas/icons.tsx`, `src/canvas/NodeCard.tsx`, `src/canvas/GroupBox.tsx`, `src/canvas/canvas.css`
- Test: `tests/unit/NodeCard.test.tsx`

**Interfaces:**
- Consumes: `LaidOutNode`, `LaidOutGroup`, `DisplayGroup`, `categoryOf`
- Produces: `CategoryIcon({ category }: { category: Category })` — 16×16 선 아이콘 5종, 경로는 스펙 시안 `design-p1-compare.html` 의 `ICONS` 그대로, `stroke="currentColor"` 1.3px.
- Produces: React Flow 노드 타입 `nodeTypes = { infra: NodeCard, zone: GroupBox }`.
  - `NodeCard` data: `{ label: string; fullLabel: string; sub?: string; category: Category; state: "normal"|"selected"|"dimmed"|"appearing"|"updated"; badge?: { kind: "missing"|"warn"; count?: number } }` — 레이아웃: 왼쪽 22px 색조 원(`--cat-*` 14% 불투명) 안 아이콘, 이름 12px/500, 부제 9.5px `--text-secondary`, 전체 이름은 `title`. 선택 시 노드 **바깥** 4px 떨어진 1.5px `--accent` 테두리(`outline` + `outline-offset:4px`). `updated` 는 하단 안쪽 2px `--accent` 선, 3초 후 사라짐. 배지는 오른쪽 위 꼭짓점 중심 반지름 8 원(missing `--state-missing` 숫자, warn `--state-warn` "!"). `appearing` 은 opacity 0→1, scale .96→1, 0.35s. `attrs.az` 가 있으면 부제 오른쪽에 작은 "AZ <값>" 표시(스펙 §12.1: AZ 는 속성으로 표현).
  - `GroupBox` data: `{ label: string; groupKind: GroupKind; collapsed: boolean; hiddenCount: number; onToggle: () => void }` — 테두리·점선은 카탈로그 `zoneToken`/`dashed`, 이름은 위쪽 30px 머리 공간 안 10.5px `--text-secondary`, 오른쪽에 접기 단추(접힘이면 "펼치기 · 노드 N개", 펼침이면 "접기"). 접힌 그룹은 노드처럼 160×56 상자로 이름과 "노드 N개".
- 그리는 순서는 React Flow zIndex 로: 그룹 0, 노드 10, 배지·선택은 노드 내부(노드 위).

- [ ] **Step 1: Write the failing test**

```tsx
test("selected node shows accent ring outside and full label in title", () => {
  render(<NodeCard data={{ label: "주문결제…", fullLabel: "주문결제통합서버", category: "compute", state: "selected" }} {...rfProps} />);
  const el = screen.getByTitle("주문결제통합서버");
  expect(el).toHaveClass("node--selected");
});
test("missing badge shows count", () => {
  render(<NodeCard data={{ label: "DB", fullLabel: "DB", category: "data", state: "normal", badge: { kind: "missing", count: 3 } }} {...rfProps} />);
  expect(screen.getByText("3")).toBeInTheDocument();
});
test("collapsed group shows hidden count and expand action", () => {
  render(<GroupBox data={{ label: "내부 구역", groupKind: "subnet_private", collapsed: true, hiddenCount: 7, onToggle: vi.fn() }} {...rfProps} />);
  expect(screen.getByRole("button", { name: "펼치기 · 노드 7개" })).toBeInTheDocument();
});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현(색은 CSS 변수만). **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: 노드·영역 컴포넌트와 분류 아이콘`

---

### Task 12: 연결선 레이어와 움직임

**Files:**
- Create: `src/canvas/EdgeLayer.tsx`, `src/canvas/motion.ts`
- Test: `tests/unit/EdgeLayer.test.tsx`

**Interfaces:**
- Consumes: `Layout.edges`, `DisplayEdge[]`, `buildSegmentBundles`, `EDGE_KINDS`
- Produces: `EdgeLayer(props: { layout: Layout; edges: DisplayEdge[]; selectedId: string | null; hoverLabels: boolean; motion: boolean; appearing: Set<string> })` — React Flow `ViewportPortal` 안에 렌더되는 하나의 `<svg>`.
  - 정적 모양(스펙 §5.2 표): request 실선 1.2px; async `7 5` 점선; replication 이중선(3.4px 선 위에 `--bg-canvas` 1.4px); aux `1.5 4` 1px. 화살촉은 열린 꺾쇠(두 선, 길이 5, 각 ±0.5rad) — `marker` 대신 끝 각도로 직접 그림. 공유 조각은 **한 번만** 그림. 갈림·합류점에 반지름 2 점.
  - 라벨: `hoverLabels` 면 연결 hover 시만, 선택 노드에 걸린 연결은 항상. 10px hit 영역(투명 10px 선).
  - 선택: `selectedId` 가 있으면 무관한 연결 `opacity .22`(0.35s).
  - 생성: `appearing` 에 든 연결은 `stroke-dashoffset` 길이→0, 0.6s 로 그어짐.
- Produces (`motion.ts`): `startBundleMotion(svg: SVGSVGElement, bundle: Bundle, kind: "comet"|"capsule"|"sheen"): () => void`(정지 함수 반환) — Web Animations API.
  - comet: 조각마다 3겹 대시 `[34,"#C9D3E2",.35,1.6] [16,"#E9DDBF",.7,1.8] [4,var(--accent),1,2.6]`(길이, 색, 불투명도, 굵기; 앞 둘은 tokens 에 `--motion-comet-tail`, `--motion-comet-mid` 로 추가), `stroke-dasharray: len (L+200)`, 키프레임 `{0: len} {start/period: len} {(start+(L+len)/v)/period: -L} {1: -L}`, duration=periodMs, delay=offsetMs, iterations ∞. (시안 `edge-branch.html` 의 `comet` 함수와 같은 방식)
  - capsule: 조각당 9×4 rx2 캡슐 2개(`--motion-capsule` `#E3C7AE`), 같은 키프레임 창 안에서 `offset-path` 또는 SVG `animateMotion` 대신 `getPointAtLength` 를 쓰는 rAF 루프로 이동·회전.
  - sheen: 22px 대시 `--motion-sheen` `#D5E9DB` .5 불투명.
  - `motion=false` 또는 `matchMedia("(prefers-reduced-motion: reduce)")` 면 아무것도 시작하지 않음. 노드 40개 초과면 `selectedId` 에 걸린 번들만 움직임.

- [ ] **Step 1: Write the failing tests** (jsdom 은 `getTotalLength` 가 없으므로 `motion.ts` 는 테스트에서 mock, 렌더 구조만 검사)

```tsx
test("shared trunk path is rendered once", () => {
  render(<EdgeLayer layout={fanOutLayout} edges={fanOutEdges} selectedId={null} hoverLabels motion={false} appearing={new Set()} />);
  expect(document.querySelectorAll('[data-seg-shared="true"]')).toHaveLength(1);
  expect(document.querySelectorAll("[data-junction]")).toHaveLength(1);
});
test("unrelated edges dim when a node is selected", () => { /* class edge--dim on non-incident */ });
test("reduced motion starts no animations", () => {
  window.matchMedia = mockMatchMedia(true); const spy = vi.spyOn(motion, "startBundleMotion");
  render(<EdgeLayer … motion />); expect(spy).not.toHaveBeenCalled();
});
test("replication renders as double line", () => { /* 같은 d 의 path 2개, 두 번째 stroke var(--bg-canvas) */ });
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS.
- [ ] **Step 5:** 수동 확인 페이지 `src/app/dev/edges/page.tsx`(개발 모드 전용, 시안 `edge-branch.html` 과 같은 4개 패널을 실제 컴포넌트로)에서 `npm run dev` 로 갈라짐·합쳐짐이 시안과 같은지 눈으로 확인.
- [ ] **Step 6: Commit** `feat: 연결선 모양·움직임 레이어(갈래 동기화)`

---

### Task 13: 캔버스 통합 (선택·편집 모드·줌 단계·등장)

**Files:**
- Create: `src/canvas/Canvas.tsx`, `src/canvas/useDiagramView.ts`
- Test: `tests/unit/useDiagramView.test.ts`

**Interfaces:**
- Consumes: Task 8~12 전부, `diffStates`
- Produces: `useDiagramView(state: DiagramState, pinned: Record<string,{x;y}>, opts: DisplayOptions): { layout: Layout | null; display: DisplayGraph; appearing: Set<string>; updated: Set<string> }` — 상태가 바뀌면 이전 상태와 `diffStates` 해서 added→`appearing`(0.6s 후 비움), changed→`updated`(3s 후 비움). 배치는 비동기, 이전 배치를 유지하다 새 배치로 교체(노드 위치 0.4s 전환).
- Produces: `Canvas(props: { state: DiagramState; pinned: Record<string,{x;y}>; editMode: boolean; options: DisplayOptions; onOptionsChange(o: DisplayOptions): void; onSelect(id: string | null): void; onPinnedChange(p: Record<string,{x;y}>): void; onAutoArrange(): void; motion: boolean })`
  - React Flow: `nodesDraggable={editMode}`, `nodesConnectable={false}`, `elementsSelectable`, `deleteKeyCode={null}`, 줌/이동 가능, `fitView` 처음 1회.
  - 클릭 선택 → `onSelect(id)`; 빈 곳 클릭 → `onSelect(null)`.
  - 편집 모드 드래그 끝 → `onPinnedChange({...pinned, [id]: pos})`.
  - 줌 < 0.6 이면 노드 부제와 연결 라벨 숨김(`data-zoom="far"` 클래스).
  - 상단 도구 막대(캔버스 위 오른쪽): "편집 모드" 토글, "자동 정렬"(pinned 비우기, 편집 모드에서만 활성), "움직임" 토글, 정리 옵션 4개 토글(스파이크 결과 페이지 문구: "보조 연결 숨김", "이벤트 버스 단순화", "연결 라벨: 마우스 올릴 때만", "중복 선 병합"). 접기 단추는 GroupBox 의 `onToggle` → `options.collapsed` 갱신.
  - 빈 구성도면 가운데 안내: "아직 구성도가 비어 있어요. 오른쪽 대화에서 만들고 싶은 서비스를 설명하거나, 샘플을 불러와 보세요."

- [ ] **Step 1: Write the failing test** (`renderHook`, ELK 는 실제 사용)

```ts
test("new nodes are marked appearing, changed nodes updated", async () => {
  const s2 = fx("s2");
  const { result, rerender } = renderHook(({ s }) => useDiagramView(s, {}, defaultDisplayOptions(s)), { initialProps: { s: s2 } });
  await waitFor(() => expect(result.current.layout).not.toBeNull());
  const next = applyCommands(s2, [{ op: "add_node", id: "redis-x", kind: "cache", label: "Redis", parent: null }, { op: "update_node", id: "was-1", attrs: { ram: "32GB" } }]).state;
  rerender({ s: next });
  await waitFor(() => expect(result.current.appearing.has("redis-x")).toBe(true));
  expect(result.current.updated.has("was-1")).toBe(true);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS.
- [ ] **Step 5: Commit** `feat: 캔버스 통합(선택·편집 모드·줌 단계·등장 표시)`

---

### Task 14: 3단 화면, 노드 정보, 변경 이력

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`, `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`, `src/app/(app)/actions.ts`, `src/ui/Sidebar.tsx`, `src/ui/RightPanel.tsx`, `src/ui/NodeInfo.tsx`, `src/ui/HistoryPanel.tsx`, `src/ui/DiagramWorkspace.tsx`
- Test: `tests/unit/NodeInfo.test.tsx`, `tests/unit/HistoryPanel.test.tsx`

**Interfaces:**
- Consumes: Task 5·7 서버 함수(서버 액션으로 감쌈, 각 액션은 `auth()` 로 userId 확인), `Canvas`, `diffStates`
- Produces (`actions.ts`, `"use server"`): `createProjectAction(name)`, `renameProjectAction`, `deleteProjectAction`, `createDiagramAction(projectId,name)`, `renameDiagramAction`, `deleteDiagramAction`, `duplicateDiagramAction`, `importSampleAction(diagramId, sampleId)`, `restoreVersionAction(diagramId, number)`, `getVersionAction(diagramId, number)`, `listVersionsAction(diagramId)`, `savePinnedAction(diagramId, positions)`, `clearPinnedAction(diagramId)` — 모두 성공 후 `revalidatePath`.
- 화면(스펙 §3 C안):
  - 왼쪽 `Sidebar` 240px: 프로젝트 목록(펼치면 구성도 목록, 현재 구성도 강조), "새 프로젝트", 프로젝트·구성도 항목 메뉴(이름 바꾸기, 복제(구성도만), 삭제 — 삭제는 확인 대화상자 "‘<이름>’을 삭제할까요? 되돌릴 수 없습니다."). 맨 아래 사용자 이름과 "로그아웃".
  - 가운데 `Canvas`.
  - 오른쪽 `RightPanel` 360px: 탭 "대화" / "설명" / "이력". 노드·연결 선택 시 "설명" 탭 자동 활성, 선택 해제 시 이전 탭으로. "대화" 탭 1단계 내용: 비어 있는 상태 문구 "AI 대화는 곧 연결됩니다. 지금은 샘플을 불러와 화면을 확인할 수 있어요." + 샘플 5개 버튼(제목은 `SAMPLES[].title`), 버튼 "불러오기".
  - `NodeInfo`(설명 탭, 1단계 범위 = 스펙 §6.1 의 1·5·6·7·8): 아이콘+이름+분류명(카탈로그 kind 의 한국어 표시명 — 카탈로그에 `labelKo` 추가), 스펙/SW(attrs 중 `sw cpu ram disk os`), 서버 정보(`hostname ip vip az`), 값이 null 이면 "미입력", 연관관계("<상대> ← 요청 · HTTPS 443" 형식, 방향 화살표), 연결된 노드 칩(클릭하면 그 노드 선택). 정의·역할·ADR 자리는 3단계 — 지금은 그 섹션을 렌더하지 않는다. 연결선 선택 시: 종류 표시명, 양 끝, 라벨.
  - `HistoryPanel`(이력 탭): 버전 목록(번호, 출처 한국어 "가져오기/되돌리기/AI/직접 입력", 상태 "중단됨" 배지, 시각), 항목 선택 시 "이 버전 보기"(캔버스를 읽기 전용으로 그 상태 표시 + 상단 띠 "v3 보는 중 · 현재로 돌아가기"), "이 버전으로 되돌리기", "현재와 비교"(비교 모드: `diffStates(선택, 현재)` 결과로 추가=`--cat-data` 테두리, 삭제=`--state-missing` 점선 유령 노드, 변경=`--accent` 테두리; 범례 표시).
- `DiagramWorkspace` 는 클라이언트 컴포넌트로 상태(현재 state, pinned, options, selectedId, editMode, 보기/비교 모드)를 소유.

- [ ] **Step 1: Write the failing tests**

```tsx
test("NodeInfo shows missing values as 미입력 and connected node chips", async () => {
  const s = fx("s2"); const onSelect = vi.fn();
  render(<NodeInfo state={s} selectedId="was-1" onSelect={onSelect} />);
  expect(screen.getAllByText("미입력").length).toBeGreaterThan(0);
  await userEvent.click(screen.getByRole("button", { name: /DB 중계/ }));
  expect(onSelect).toHaveBeenCalledWith(expect.stringMatching(/proxy/));
});
test("HistoryPanel labels sources and aborted status", () => {
  render(<HistoryPanel versions={[{ number: 2, source: "ai", status: "aborted", restoredFrom: null, createdAt: new Date() }, { number: 1, source: "import", status: "complete", restoredFrom: null, createdAt: new Date() }]} {...handlers} />);
  expect(screen.getByText("중단됨")).toBeInTheDocument(); expect(screen.getByText("가져오기")).toBeInTheDocument();
});
```

- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. `npm run build` 성공.
- [ ] **Step 5: Commit** `feat: 3단 화면, 노드 정보, 변경 이력·비교`

---

### Task 15: 끝에서 끝까지 확인 (E2E)

**Files:**
- Create: `tests/e2e/phase1.spec.ts`, `tests/e2e/global-setup.ts`
- Modify: `package.json` (`"test:e2e": "playwright test"`)

**Interfaces:**
- Consumes: 전체 앱. `global-setup` 은 `DATABASE_URL_TEST` 로 마이그레이션·초기화 후 `next build && next start -p 3100` 를 `DATABASE_URL=$DATABASE_URL_TEST` 로 띄움(playwright `webServer`).

- [ ] **Step 1: Write the test**

```ts
test("가입 → 프로젝트·구성도 → 샘플 → 선택 → 편집 이동 → 되돌리기", async ({ page }) => {
  await page.goto("/signup"); /* jae / password1 / a@b.co → 가입하기 → 로그인 */
  await page.getByRole("button", { name: "새 프로젝트" }).click(); /* 이름 "쇼핑몰" */
  /* 구성도 "운영" 만들기 → 대화 탭에서 "IDC WEB-WAS-DB 이중화" 불러오기 */
  await expect(page.locator(".react-flow__node-infra")).toHaveCount(9);
  await page.getByTitle("WAS#1").click();
  await expect(page.getByRole("tab", { name: "설명", selected: true })).toBeVisible();
  await expect(page.locator(".edge--dim").first()).toBeVisible();
  /* 편집 모드 켜고 WAS#1 드래그 → 새로고침 후 위치 유지 */
  /* 샘플 하나 더 불러오기 → 이력 탭 v3 → v2 "이 버전으로 되돌리기" → v4 생성, 노드 9개 */
  await expect(page.getByText("v4")).toBeVisible();
});
test("다른 사용자는 남의 구성도 URL 에서 404", async ({ browser }) => { /* 두 컨텍스트 */ });
```

- [ ] **Step 2:** `docker compose up -d db_test && npm run test:e2e` → 구현 누락이 있으면 FAIL, 고친 뒤 PASS.
- [ ] **Step 3:** 전체 `npx vitest run && npm run test:int && npm run test:e2e` → 모두 PASS.
- [ ] **Step 4: Commit** `test: 1단계 E2E`

---

## 2·3단계로 넘기는 것 (이 계획 범위 밖)
- 2단계: Qwen 스트리밍(JSON Lines)·`say`/`warn` 처리·대화 탭·메시지 테이블과 버전 연결·중단 처리·`@노드` 참조 칩·가정 칩 UI·Clef 의도 분류·URL 정규화(§12.3)·설정 점검.
- 3단계: 설명 생성·용어 사전(DB, 시드 50개, 미검수)·Clef 품질 검사·빠진 정보 체크리스트와 배지 연결·경고 규칙(+Clef noul)·패턴 라이브러리.
