# 학습 모드 1차 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 주제(1차: 대형 쇼핑몰 온프레미스·클라우드)를 고르고 환경을 확정한 뒤, 학습자가 단계마다 직접 말을 입력해 미리 쓴 대본대로 구성도를 완성하는 학습 모드를 만든다.

**Architecture:** 대본은 샘플처럼 코드에 든 자료(`src/domain/guides/`)이고, 단계마다 변경 명령·설명·해설·설명 탭 글을 갖는다. 대화 경로(`runChatTurn`)는 그대로 두고, 구성도 잠금 안에서 학습 중(`guide_runs.status = active`)이면 가이드 차례(`runGuideTurn`)가 먼저 돈다. 가이드 차례는 Clef noul 판정(없으면 키워드)으로 맞음·안 맞음·질문을 가르고, 맞으면 대본 명령을 확정 상태로 적용·버전·메시지·설명 저장을 하며, 질문이면 평소 질문 답변 경로로 넘긴다.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Drizzle + Postgres, zod, Vitest(node·jsdom·integration), Playwright, Clef(noul), Qwen(질문 답변만).

**Spec:** `docs/superpowers/specs/2026-11-19-learning-mode-design.md` — 실행자는 이 계획과 함께 읽는다.

## Global Constraints

- UI 언어는 한국어, 기술 용어는 원어 병기. 문장은 짧고 명확하게(제품 원칙 1).
- 대본 글 길이(코드 포인트): `say` ≤ 160, `notes` 단계당 ≤ 3개·각 ≤ 120, `miss` ≤ 100, `goal` ≤ 30. 설명 탭 글은 기존 `LIMITS`(`src/domain/explain.ts`)를 따른다.
- 한 벌(환경)당 10~14단계.
- 가상 값: IP 는 사설 대역(10.x / 172.16–31.x / 192.168.x), hostname·VIP·방화벽 규칙은 지어낸 값. 주제 화면과 첫 대화에 "값은 예시입니다"를 적는다.
- 주제 화면 위 문구: "실제 회사의 구성이 아니라, 이런 서비스를 만들 때 흔히 쓰는 구성입니다". 제목은 회사 이름이 아니라 종류("대형 쇼핑몰").
- 막을 때 문구(그대로): `학습 중에는 바꿀 수 없어요. 학습을 그만두면 바꿀 수 있어요.`
- 대본 명령이 거절될 때 문구(그대로): `가이드가 바뀌어 이어갈 수 없어요. 처음부터 다시 해 주세요.`
- Clef 판정 상한 3초, 재시도 없음. 판정 기준 시작값 0.6(`GUIDE_MIN_CONFIDENCE`), 평가로 조정.
- 가르치는 글(단계 설명·해설·설명 탭)은 모두 대본에서만 나온다. Qwen 은 학습자 질문 답변에만 쓴다.
- WCAG 2.2 AA, 키보드만으로 전 과정을 마칠 수 있어야 한다. DESIGN.md 와 기존 컴포넌트(`Button` 등)를 쓴다.
- 커밋 메시지는 기존 형식(`feat(guide): …` 한국어 본문) + 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **같은 말을 두 번 보냄**(연타·느린 응답 뒤 재전송): 단계가 두 번 적용되면 안 된다. 두 번째 말은 이미 다음 단계 기준으로 판정돼 "안 맞음"이 되어야 한다 → Task 6 테스트 `same text twice does not apply the step twice`.
2. **Clef 가 늦거나 멈춤**: 3초 안에 키워드 판정으로 넘어가야 한다(차례가 멈추지 않는다) → Task 6 테스트 `a hanging clef falls back to keywords within the cap`.
3. **대본을 고쳐 배포한 뒤 이어서 하기**(단계 수가 줄었거나 명령이 이제 거절됨): 학습을 `quit` 로 바꾸고 정해진 문구를 보이고, 구성도는 일반 구성도로 열린다 → Task 6 `a rejected guide command quits the run`, Task 7 `an out-of-range step quits the run on open`.
4. **환경 확정 전 버전으로 되돌리기**: 환경을 다시 묻고 1단계부터 시작해야 한다 → Task 7 `restoring before the env version asks the env again`.
5. **학습 중 다른 탭·MCP·설명 다시 쓰기로 바꾸기**: 모두 막혀 대본 상태가 깨지지 않아야 한다 → Task 8 각 경로 테스트.

---

### Task 0: 작업 공간

**Files:** 없음(브랜치·worktree)

- [ ] **Step 1:** `superpowers:using-git-worktrees` 로 `feat/learning-mode` 브랜치를 `C:\Users\devsh\Desktop\new-study\infra-learning-mode` worktree 로 만든다(main d72c1f0 기준). node_modules 는 `npm ci` 로 설치한다(junction 금지 — 정리 때 원본이 지워진 일이 있다). `.env` 는 worktree 에 없으므로 명령에 `--env-file=C:\Users\devsh\Desktop\new-study\infra-architecture\.env` 를 넘긴다.
- [ ] **Step 2:** main 폴더에 아직 커밋 안 된 `docs/superpowers/specs/2026-11-19-learning-mode-design.md` 와 이 계획 파일을 worktree 로 옮기고(main 폴더에서는 지운다) 커밋한다.
- [ ] **Step 3:** `npm test` 가 통과하는지 확인한다(기준선).

```bash
git add docs/superpowers/specs/2026-11-19-learning-mode-design.md docs/superpowers/plans/2026-11-19-learning-mode.md
git commit -m "docs(guide): 학습 모드 설계와 1차 구현 계획"
```

---

### Task 1: 대본 타입과 판정 함수

**Files:**
- Create: `src/domain/guides/types.ts`, `src/domain/guides/judge.ts`, `src/domain/guides/index.ts`
- Test: `tests/unit/guide-judge.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export type GuideEnv = "onprem" | "cloud";
  export const GUIDE_ENVS: readonly GuideEnv[] = ["onprem", "cloud"];
  export const ENV_LABEL: Record<GuideEnv, string> = { onprem: "온프레미스", cloud: "클라우드" };
  export type NoteKind = "flow" | "net" | "link" | "caution";
  export const NOTE_LABEL: Record<NoteKind, string> = { flow: "흐름", net: "망 특성", link: "연계 구간", caution: "주의" };
  export interface GuideNote { kind: NoteKind; text: string }
  type Adr = { decision: string; reason: string; alternative: string; cost: string };
  export interface AuthoredTermed { term?: string; definition?: string; role: string; adr: Adr }
  export interface AuthoredGroup extends AuthoredTermed { boundary: string }
  export interface AuthoredEdge { flow: string; method: string; why: string; firewall: string }
  /** key 는 "node:<id>" | "group:<id>" | "edge:<id>". */
  export type AuthoredExplains = Record<string, AuthoredTermed | AuthoredGroup | AuthoredEdge>;
  export interface GuideStep {
    id: string; goal: string; example: string;
    keywords: string[][];
    conflicts?: { pattern: string[]; reply: string }[];
    commands: Command[]; say: string; notes?: GuideNote[]; miss: string;
    explains: AuthoredExplains;
  }
  export interface GuideVariant { environment: string; steps: GuideStep[]; outro: string; otherEnv?: { from: string; to: string }[] }
  export interface Guide { id: string; title: string; intro: string; learns: string[]; envIntro: string; variants: Partial<Record<GuideEnv, GuideVariant>> }
  export const GUIDE_LIMITS = { say: 160, note: 120, notes: 3, miss: 100, goal: 30 } as const;
  export const GUIDE_MIN_CONFIDENCE = 0.6;
  ```
  `GuideVariant.environment` 은 환경 확정 때 넣는 `set_assumption environment` 값이다(예 "사내 IDC", "클라우드(AWS)").
- Produces (`judge.ts`):
  - `normalizeUtterance(text: string): string` — 소문자, 공백·문장부호 제거. "두 대"→"두대".
  - `keywordMatch(text: string, keywords: string[][]): boolean` — 묶음마다 하나 이상이 정규화한 글에 들어 있으면 true. 빈 목록은 false.
  - `findConflict(text: string, step: GuideStep): string | null` — `pattern` 의 모든 조각이 들어 있는 첫 항목의 `reply`.
  - `looksLikeQuestion(text: string): boolean` — `?` 로 끝나거나 "뭐야·뭔가요·무엇·왜·어떻게·차이·알려 줘"류를 포함.
  - `readEnv(text: string, available: GuideEnv[]): GuideEnv | null` — 환경 키워드(온프레미스·온프렘·IDC·사내·자체 / 클라우드·AWS·cloud). 둘 다 또는 아무것도 없으면 null, `available` 밖이면 null. `available` 이 하나뿐이면 질문이 아닌 모든 말을 그 환경으로 본다.
  - `type StepVerdict = { kind: "match" } | { kind: "miss" } | { kind: "question" } | { kind: "conflict"; reply: string }`
  - `decideStep(text: string, step: GuideStep, clef: { match: number | null; question: number | null }, threshold = GUIDE_MIN_CONFIDENCE): StepVerdict` — 순서: 충돌 → (clef.match 가 null 이 아니면) match ≥ 기준 → 맞음, question ≥ 기준 → 질문, 아니면 안 맞음 → (clef.match 가 null 이면) 키워드 맞음 → 맞음, `looksLikeQuestion` → 질문, 아니면 안 맞음. (설계 문서 §한 차례의 흐름 3 그대로.)
- Produces (`index.ts`): `GUIDE_LIST: readonly Guide[]`(이 Task 에서는 빈 배열), `getGuide(id: string): Guide | undefined`, `guideEnvs(g: Guide): GuideEnv[]`(대본이 있는 환경, GUIDE_ENVS 순서).

- [ ] **Step 1: 실패하는 테스트 작성** — `tests/unit/guide-judge.test.ts`

  ```ts
  const step = { id: "was", goal: "WAS 두 대 이중화", example: "WAS 두 대를 이중화해서 넣어 줘",
    keywords: [["was", "앱서버"], ["두대", "2대", "이중화"]],
    conflicts: [{ pattern: ["was", "세대"], reply: "이번에는 두 대로 합니다." }],
    commands: [], say: "", miss: "이번 단계는 WAS 두 대입니다.", explains: {} } satisfies GuideStep;

  test("normalizeUtterance drops spaces and punctuation", () => expect(normalizeUtterance("WAS 두 대!")).toBe("was두대"));
  test("keywordMatch needs one hit per group", () => {
    expect(keywordMatch("앱 서버 2대 넣어줘", step.keywords)).toBe(true);
    expect(keywordMatch("WAS 넣어줘", step.keywords)).toBe(false);
  });
  test("conflict wins over clef", () =>
    expect(decideStep("WAS 세 대 넣어 줘", step, { match: 0.9, question: 0.1 })).toEqual({ kind: "conflict", reply: "이번에는 두 대로 합니다." }));
  test("clef match decides when present", () => {
    expect(decideStep("앱 서버를 이중으로", step, { match: 0.8, question: 0.1 })).toEqual({ kind: "match" });
    expect(decideStep("WAS 두 대 넣어 줘", step, { match: 0.3, question: 0.2 })).toEqual({ kind: "miss" });
    expect(decideStep("WAS 가 뭐야?", step, { match: 0.2, question: 0.9 })).toEqual({ kind: "question" });
  });
  test("keywords decide when clef is absent", () => {
    expect(decideStep("WAS 두 대 넣어 줘", step, { match: null, question: null })).toEqual({ kind: "match" });
    expect(decideStep("L4 가 뭐야?", step, { match: null, question: null })).toEqual({ kind: "question" });
    expect(decideStep("DB 넣어 줘", step, { match: null, question: null })).toEqual({ kind: "miss" });
  });
  test("readEnv reads one env or none", () => {
    expect(readEnv("온프레미스로 할게", ["onprem", "cloud"])).toBe("onprem");
    expect(readEnv("AWS 로", ["onprem", "cloud"])).toBe("cloud");
    expect(readEnv("둘 다 좋아", ["onprem", "cloud"])).toBeNull();
    expect(readEnv("클라우드", ["onprem"])).toBeNull();
    expect(readEnv("네 시작할게요", ["cloud"])).toBe("cloud");
    expect(readEnv("클라우드가 뭐야?", ["cloud"])).toBeNull();
  });
  ```

- [ ] **Step 2:** `npx vitest run tests/unit/guide-judge.test.ts` → FAIL(모듈 없음).
- [ ] **Step 3:** 위 Interfaces 대로 `types.ts`·`judge.ts`·`index.ts` 를 구현한다.
- [ ] **Step 4:** 같은 명령 → PASS. `npx tsc --noEmit` 통과.
- [ ] **Step 5:** 커밋 `feat(guide): 대본 타입과 단계 판정 함수`.

---

### Task 2: 단계 적용(순수 함수)과 대본 검사 틀

**Files:**
- Create: `src/domain/guides/apply.ts`, `src/domain/guides/view.ts`
- Test: `tests/unit/guide-apply.test.ts`, `tests/unit/guides.test.ts`(모든 대본 불변식 — 대본이 생기면 자동으로 돈다)

**Interfaces:**
- Consumes: Task 1 타입, `applyCommand`·`ApplyOptions`(`src/domain/apply.ts`), `isFlowCommand`·`toFlowOp`(`src/domain/commands.ts`), `FlowOp`(`src/domain/flows.ts`).
- Produces (`apply.ts`):
  - `applyGuideStep(state: DiagramState, step: GuideStep, opts?: ApplyOptions): { ok: true; state: DiagramState; emitted: Command[]; flowOps: FlowOp[] } | { ok: false; error: string }` — 구성·가정 명령을 차례로 적용(하나라도 거절되면 `ok:false`, 오류 글은 `#<index> <error>`). 적용 뒤 이번 단계가 `set_assumption` 한 key 는 `confirmed: true`, `set_zone_type` 한 영역은 `netType = { key, source: "user", confirmed: true }` 로 바꾼다. 흐름 명령은 `toFlowOp` 해서 `flowOps` 로. `emitted` 는 적용한 구성·가정 명령(클라이언트 재생용).
  - `confirmEnvironment(state: DiagramState, value: string): { state: DiagramState; cmd: Command }` — `set_assumption environment` 를 적용하고 확정한다(이미 확정이면 값을 덮는다).
  - `buildGuideState(variant: GuideVariant, upTo: number, opts?: ApplyOptions): { state: DiagramState; flowOps: FlowOp[] }` — 빈 상태에 환경 확정 + 0..upTo-1 단계를 적용(테스트·되돌리기 검사용). 거절되면 throw.
  - `stepFlowIds(variant: GuideVariant, from: number): string[]` — `from` 단계 이후가 `add_flow` 하는 흐름 id.
- Produces (`view.ts`):
  ```ts
  export interface GuideView { guideId: string; title: string; env: GuideEnv | null; envChoices: GuideEnv[];
    step: number; total: number; status: "active" | "done" | "quit"; current: { goal: string; example: string } | null }
  export function guideView(run: { guideId: string; env: GuideEnv | null; step: number; status: "active" | "done" | "quit" }, guide: Guide): GuideView
  ```
  `total` 은 env 가 null 이면 0. `current` 는 active·env 확정·범위 안일 때만.

- [ ] **Step 1: 실패하는 테스트** — `tests/unit/guide-apply.test.ts`: 작은 가짜 variant(영역 1·노드 2·연결 1·흐름 1·가정 1·망 종류 1)로
  - `applyGuideStep confirms assumptions and zone types it sets`(가정 `confirmed === true`, `netType.source === "user"`).
  - `applyGuideStep returns flow ops instead of touching state`.
  - `applyGuideStep fails on a rejected command`(없는 parent → `ok:false`, error 에 `#0`).
  - `confirmEnvironment overwrites a confirmed value`.
  - `stepFlowIds lists flows from a step on`.
  - `guideView hides current before env and after done`.
- [ ] **Step 2: 대본 불변식 테스트** — `tests/unit/guides.test.ts`. `GUIDE_LIST` × `guideEnvs(g)` 마다(`describe.each`), 기본 망 지식(`tests/unit/samples.test.ts` 의 `KNOWLEDGE` 와 같은 모양, `NETWORK_TYPE_SEED`·`NETWORK_RULE_SEED`)으로:
  - `every step applies from an empty diagram` — `buildGuideState(variant, steps.length)` 가 throw 하지 않는다. 각 단계 뒤 빈 영역(자식 없는 group)이 없다.
  - `the finished diagram has no missing info` — `computeMissing(state, KNOWLEDGE).count === 0`.
  - `the finished diagram shows only the intended warnings` — `evaluateRules(state, KNOWLEDGE)` 결과를 `EXPECTED_GUIDE_WARNINGS[`${g.id}:${env}`]` 와 비교(파일 안 상수, samples.test.ts 의 `EXPECTED_WARNINGS` 와 같은 표기).
  - `every flow is accepted` — `judgeFlowOps(state, [], flowOps)` 가 모두 saved.
  - `text fits the limits` — `GUIDE_LIMITS`, 단계 수 10~14, explains 는 `LIMITS`(`overLimit` 재사용 가능하면 재사용).
  - `every node, group and edge has an authored explanation` — 끝 상태의 모든 대상 key 가 어느 단계의 `explains` 에 있다. 노드·영역 글에 `definition` 이 없으면 `GLOSSARY_SEED` 에서 `targetTermCandidates` 로 찾을 수 있어야 한다(`pickTerm` + `normalizeTerm`).
  - `each example is a keyword match for its own step` — `keywordMatch(step.example, step.keywords)`.
  - `no guide uses set_link_guess`.
  - `ids are unique` — 단계 id, 대본 id.
  대본이 아직 없으면 이 파일은 `test.skip` 없이 빈 `describe.each([])` 로 통과한다(빈 목록이면 테스트 하나 `GUIDE_LIST is defined` 만 돈다).
- [ ] **Step 3:** `npx vitest run tests/unit/guide-apply.test.ts tests/unit/guides.test.ts` → apply 쪽 FAIL.
- [ ] **Step 4:** `apply.ts`·`view.ts` 구현.
- [ ] **Step 5:** 같은 명령 → PASS.
- [ ] **Step 6:** 커밋 `feat(guide): 대본 단계 적용과 대본 불변식 테스트`.

---

### Task 3: 대형 쇼핑몰 대본 두 벌 (초안 → 사용자 검토)

**Files:**
- Create: `src/domain/guides/shop.ts`(`SHOP: Guide`), 필요하면 `src/domain/guides/shop-onprem.ts`·`shop-cloud.ts` 로 나눔
- Modify: `src/domain/guides/index.ts`(`GUIDE_LIST = [SHOP]`), `tests/unit/guides.test.ts`(`EXPECTED_GUIDE_WARNINGS`), 대본이 쓰는 용어가 seed 에 없으면 `src/domain/glossary-seed-batch4.ts` 가 아닌 **새 묶음** `src/domain/glossary-seed-guide.ts` 에 넣고 `SEED_BATCHES`·`GLOSSARY_SEED` 에 더한다(기존 계정에도 한 번 들어가게).
- Test: Task 2 의 `tests/unit/guides.test.ts`

**Interfaces:** Consumes Task 1 타입, `src/domain/samples/dsl.ts` 의 `group`·`node`·`edge`·`flow`·`assume`·`managed`·`edgeId`.

대본 바탕: 온프레미스는 `src/domain/samples/idc-3tier.ts`, 클라우드는 `src/domain/samples/aws-shop.ts`. 아래 단계표가 확정할 초안 골격이다(단계 0 = 환경 확정은 엔진이 한다). 글(`say`·`notes`·`miss`·`explains`)과 가상 값은 이 Task 에서 쓴다.

`id: "shop"`, `title: "대형 쇼핑몰"`, `learns`: 3계층·이중화 / 결제 외부 연동 / 세일 때 트래픽 몰림 대응(캐시·대기열).

| # | 온프레미스(`environment: "사내 IDC"`) 목표 | 예시 문장 |
|---|---|---|
| 1 | 고객 진입과 외부 방화벽(IDC·DMZ) | 고객이 웹과 앱으로 들어오고 앞에 방화벽을 둬 줘 |
| 2 | L4 두 대 이중화(VIP) | L4 두 대로 이중화해 줘 |
| 3 | WEB 서버 두 대 | 웹 서버 두 대를 L4 뒤에 붙여 줘 |
| 4 | 내부 방화벽과 WAS 두 대 | 내부 방화벽 뒤에 WAS 두 대를 넣어 줘 |
| 5 | 주문·회원 DB 이중화(Active-Standby) | 주문·회원 DB 를 이중화해서 넣어 줘 |
| 6 | 세션·상품 캐시(Redis) | WAS 옆에 Redis 캐시를 넣어 줘 |
| 7 | 상품 이미지 저장소(NAS) | 상품 이미지 저장소를 붙여 줘 |
| 8 | PG 결제 외부 연동(아웃바운드 프록시) | PG사 결제를 연동해 줘 |
| 9 | 주문 대기열(큐) | 주문이 몰릴 때를 대비해 대기열을 넣어 줘 |
| 10 | 운영자 관리자 화면 | 운영자가 쓰는 관리자 화면을 붙여 줘 |
| 11 | 모니터링·로그 수집 | 모니터링과 로그 수집을 붙여 줘 |
| 12 | 상품 보기·결제 흐름 | 상품 보기와 결제 흐름을 정리해 줘 |

| # | 클라우드(`environment: "클라우드(AWS)"`) 목표 | 예시 문장 |
|---|---|---|
| 1 | 리전·VPC·서브넷 나누기 | AWS 서울 리전에 VPC 와 서브넷을 나눠 줘 |
| 2 | 고객 진입: CDN·WAF | 고객이 CloudFront 와 WAF 를 거쳐 들어오게 해 줘 |
| 3 | ALB | WAF 뒤에 ALB 를 둬 줘 |
| 4 | API 두 대를 두 AZ 에(Auto Scaling) | API 서버 두 대를 AZ 두 곳에 나눠 넣어 줘 |
| 5 | RDS Multi-AZ | 주문·회원 DB 는 RDS Multi-AZ 로 넣어 줘 |
| 6 | ElastiCache | 세션·상품 캐시로 ElastiCache 를 넣어 줘 |
| 7 | S3 상품 이미지 | 상품 이미지는 S3 에 두고 CloudFront 로 내보내 줘 |
| 8 | NAT 와 PG 결제 연동 | NAT 를 거쳐 PG사 결제를 연동해 줘 |
| 9 | 주문 대기열(SQS) | 주문이 몰릴 때를 대비해 SQS 대기열을 넣어 줘 |
| 10 | 관리자 앱 | 운영자가 쓰는 관리자 앱을 붙여 줘 |
| 11 | CloudWatch 모니터링·로그 | CloudWatch 로 모니터링과 로그를 붙여 줘 |
| 12 | 상품 보기·결제 흐름 | 상품 보기와 결제 흐름을 정리해 줘 |

- `otherEnv`(양쪽 대칭): L4 → ALB, WEB·WAS 서버 → EC2 Auto Scaling, DB Active-Standby → RDS Multi-AZ, NAS → S3, 외부 방화벽 → WAF·보안 그룹, 사내 큐 → SQS, 아웃바운드 프록시 → NAT 게이트웨이.
- `notes` 는 망 특성·연계 구간·주의를 고르게: DMZ 와 내부 구역(온프레미스 1·4), VIP 와 Active-Standby 차이(2·5), 외부 연계 구간과 방화벽 오픈 요청(8), 대기열이 순서·중복 처리에 주는 주의(9), 관리자 접속 경로 분리(10).
- 끝 상태 경고는 없게 만든다(관리자 앱·DB 중계도 이중화하거나 관리형으로). 일부러 남긴다면 그 단계 `notes` 에 `caution` 으로 설명하고 `EXPECTED_GUIDE_WARNINGS` 에 적는다.
- 학습자가 흔히 다르게 말할 수량(2·3·4단계)에 `conflicts` 를 단다("세 대"·"한 대").

- [ ] **Step 1:** 온프레미스 대본을 쓰고 `npx vitest run tests/unit/guides.test.ts` 가 PASS 할 때까지 고친다.
- [ ] **Step 2:** 클라우드 대본을 쓰고 같은 명령 → PASS.
- [ ] **Step 3:** `npm test` 전체 PASS(사전 seed 테스트 포함).
- [ ] **Step 4: 멈추고 사용자 검토.** 두 벌의 단계별 `goal`·`example`·`say`·`notes`·`miss` 와 노드별 설명 탭 글을 읽기 좋은 표(Markdown, scratchpad 에)로 뽑아 사용자에게 보인다. 망·연계 설명은 틀리면 안 되는 글이라 반드시 확인받는다. 고친 내용을 반영하고 Step 3 을 다시 돈다.
- [ ] **Step 5:** 커밋 `feat(guide): 대형 쇼핑몰 학습 대본(온프레미스·클라우드)`.

---

### Task 4: 진행 상태 저장(`guide_runs`)

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/0011_guide_runs.sql`(`npm run db:generate` 로 만들고 이름 확인), `src/server/guide/runs.ts`
- Test: `tests/integration/guide-runs.test.ts`

**Interfaces:**
- 표 `guide_runs`: `id uuid pk`, `diagram_id uuid not null unique references diagrams on delete cascade`, `guide_id text not null`, `env text null`(`GuideEnv`), `step integer not null default 0`, `step_versions jsonb number[] not null default []`, `env_version integer null`, `status text not null default 'active'`(`"active" | "done" | "quit"`), `created_at`, `updated_at`.
- Produces (`runs.ts`):
  ```ts
  export interface GuideRun { diagramId: string; guideId: string; env: GuideEnv | null; step: number; stepVersions: number[]; envVersion: number | null; status: "active" | "done" | "quit" }
  export const LEARNING_LOCKED_MESSAGE = "학습 중에는 바꿀 수 없어요. 학습을 그만두면 바꿀 수 있어요.";
  export const GUIDE_BROKEN_MESSAGE = "가이드가 바뀌어 이어갈 수 없어요. 처음부터 다시 해 주세요.";
  export async function getGuideRun(diagramId: string, tx?: Tx): Promise<GuideRun | null>
  export async function createGuideRun(run: Pick<GuideRun, "diagramId" | "guideId" | "env">, tx?: Tx): Promise<GuideRun>
  export async function saveGuideRun(run: GuideRun, tx?: Tx): Promise<void>
  /** active 인데 대본이 없거나(getGuide) env 의 variant 가 없거나 step 이 단계 수를 넘으면 quit 로 저장하고 그 상태를 돌려준다. */
  export async function getLiveGuideRun(diagramId: string, tx?: Tx): Promise<GuideRun | null>
  export async function isLearning(diagramId: string): Promise<boolean>
  /** 학습 중이면 ValidationError(LEARNING_LOCKED_MESSAGE). */
  export async function assertNotLearning(diagramId: string): Promise<void>
  export async function listGuideRuns(userId: string): Promise<(GuideRun & { projectId: string; diagramName: string })[]>
  ```

- [ ] **Step 1: 실패하는 통합 테스트** — `create then get round-trips`, `deleting the diagram deletes the run`, `assertNotLearning throws only while active`, `getLiveGuideRun quits a run whose guide is gone`(guideId `"nope"`), `getLiveGuideRun quits a run whose step is out of range`, `listGuideRuns returns only the owner's runs`. 기존 `tests/integration/helpers.ts` 로 사용자·구성도를 만든다.
- [ ] **Step 2:** `npm run test:int -- guide-runs` → FAIL.
- [ ] **Step 3:** 스키마·마이그레이션·`runs.ts` 구현. `npm run db:migrate`(개발 DB) 적용.
- [ ] **Step 4:** 같은 명령 → PASS.
- [ ] **Step 5:** 커밋 `feat(guide): 학습 진행 상태 표 guide_runs`.

---

### Task 5: 대본 설명 저장과 설명 다시 쓰기 막기

**Files:**
- Modify: `src/domain/explain.ts`(세 설명 타입에 `authored?: true`), `src/server/explain.ts`
- Test: `tests/unit/explain.test.ts`(가짜 repo 로)

**Interfaces:**
- Consumes: `AuthoredExplains`(Task 1), `signatureOf`·`targetTermCandidates`·`pickTerm`·`normalizeTerm`(`src/domain/explain.ts`), `GLOSSARY_SEED`, `isLearning`(Task 4).
- Produces:
  - `authoredExplanation(state: DiagramState, key: string, text: AuthoredTermed | AuthoredGroup | AuthoredEdge): { targetKind: ExplainTargetKind; targetId: string; signature: string; data: AnyExplanation } | null` (순수, `src/domain/explain.ts`) — 대상이 없으면 null. 노드·영역 `definition` 이 없으면 seed 에서 찾아 `definitionSource: "glossary"`, `termSource: "seed"`, `why`·`compare` 도 seed 값. 있으면 `definitionSource: "glossary"`, `termSource` 없음. `term` 이 없으면 seed 항목의 `term`, 그것도 없으면 대상 이름. `reviewed: true`, `authored: true`.
  - `saveAuthoredExplanations(diagramId: string, state: DiagramState, explains: AuthoredExplains, depsInput?: { repo?: Partial<ExplainRepo>; now?: () => Date }): Promise<number>` (`src/server/explain.ts`) — 지금 상태에 있는 대상만 현재 서명으로 저장(upsert), 저장 수를 돌려준다.
  - `withCurrentGlossary` 는 `data.authored` 이면 덮지 않고 그대로 돌려준다(캐시 읽기·`cachedNodeExplanation` 둘 다).
  - `explainTarget` 은 `instruction` 이 있거나 `force` 이고 `isLearning(diagramId)` 이면 `ValidationError(LEARNING_LOCKED_MESSAGE)`. 판정은 repo 에 `isLearning(diagramId): Promise<boolean>` 를 더해 가짜로 바꿀 수 있게 한다.

- [ ] **Step 1: 실패하는 테스트** — `authoredExplanation fills the definition from the seed`, `authoredExplanation keeps an authored definition`, `saveAuthoredExplanations skips targets not in the state`, `a cached authored explanation is not overridden by the account glossary`, `rewrite is refused while learning`(instruction, force 각각), `rewrite works when not learning`.
- [ ] **Step 2:** `npx vitest run tests/unit/explain.test.ts` → FAIL.
- [ ] **Step 3:** 구현.
- [ ] **Step 4:** PASS + `npm test` 전체 PASS(기존 설명 테스트가 깨지지 않는다).
- [ ] **Step 5:** 커밋 `feat(guide): 대본 설명을 설명 탭에 저장하고 학습 중 다시 쓰기를 막는다`.

---

### Task 6: 가이드 차례와 대화 경로 연결

**Files:**
- Create: `src/server/guide/judge.ts`, `src/server/guide/turn.ts`
- Modify: `src/server/chat/events.ts`(이벤트·메타), `src/server/chat/pipeline.ts`(분기), `src/server/flows.ts`(대본 흐름 저장)
- Test: `tests/unit/guide-turn.test.ts`(가짜 clef·repo), `tests/integration/guide-turn.test.ts`(실제 DB·가짜 LLM, `tests/integration/pipeline.test.ts` 방식)

**Interfaces:**
- Consumes: Task 1·2·4·5, `createVersion`, `createMessage`, `checkWarnings`, `withDiagramLock`(이미 잠긴 안에서 불린다), `ClefClient.decide`, `noulProbability`.
- Produces (`events.ts`):
  - `ChatEvent` 에 `| { t: "guide"; view: GuideView }`(done 앞에 보낸다).
  - `MessageMeta.guide?: { kind: "env" | "step" | "miss" | "done" | "quit"; step?: number; notes?: GuideNote[]; envChoices?: GuideEnv[]; outro?: string; otherEnv?: { from: string; to: string }[]; rebuild?: GuideEnv[] }` — `rebuild` 는 완료 때 다시 만들 수 있는 다른 환경.
- Produces (`server/guide/judge.ts`): `askClef(clef: ClefClient, text: string, goal: string, signal: AbortSignal): Promise<{ match: number | null; question: number | null }>` — `clef.decide({ 사용자_말: text, 이번_단계_목표: goal }, { match: { type: "noul", instructions: "사용자의 말이 이번 단계 목표를 그리도록 요청하는가" }, question: { type: "noul", instructions: "사용자의 말이 무언가를 묻는 질문인가" } }, signal, { capMs: 3000, maxRetries: 0 })` 를 `warnings.ts` 처럼 3초 경주로 감싸고, 실패·시간 초과면 둘 다 null. 문구는 짧게 둔다(긴 Clef 문구는 확신도를 떨어뜨렸다).
- Produces (`flows.ts`): `saveGuideFlows(diagramId: string, state: DiagramState, ops: FlowOp[], tx?: Tx): Promise<{ saved: number; rejected: { id: string; reason: string }[] }>` — `judgeFlowOps(state, [], ops)` 로 검사하고(이미 있는 흐름과 견주지 않는다), 같은 key 는 지우고 넣는다. `source: "user"`, `reviewed: true`(`importSample` 과 같다). `deleteGuideFlows(diagramId: string, keys: string[], tx?: Tx): Promise<void>`.
- Produces (`turn.ts`):
  ```ts
  export type GuideTurnOutcome = { handled: true } | { handled: false; intent: "question" };
  export interface GuideTurnArgs { userId: string; diagramId: string; text: string; userMessageId: string; state: DiagramState;
    knowledge: NetworkKnowledge | null; run: GuideRun; signal: AbortSignal; emit(e: ChatEvent): void }
  export async function runGuideTurn(args: GuideTurnArgs, deps: { clef: ClefClient }): Promise<GuideTurnOutcome>
  /** 환경 확정: 가정 확정 → 버전(summary "학습: 환경 <라벨>") → run.env·envVersion 저장 → assistant 메시지 "<라벨>으로 진행합니다. 위 카드의 이번 단계를 말로 요청해 보세요."(meta.guide 없음 — 단계 안내는 카드가 GuideView 로 보인다). start(Task 7)도 쓴다. */
  export async function confirmGuideEnv(diagramId: string, run: GuideRun, env: GuideEnv, state: DiagramState, messageId: string | null): Promise<{ run: GuideRun; version: number; cmd: Command }>
  ```
  `runGuideTurn` 동작(설계 문서 §한 차례의 흐름 2~6):
  - env null: `readEnv` → 확정하면 `cmd` 이벤트·`confirmGuideEnv`·그 메시지 글로 `say`·`guide` 이벤트·`done`. 못 읽으면 `envIntro` 를 다시 보내고 `meta.guide.kind "env"`.
  - env 있음: `findConflict` 가 먼저, 아니면 `askClef` → `decideStep`. 로그 `console.info("[guide] verdict", { diagramId, step, kind, clefMatch, clefQuestion, ms })`(사용자 글은 남기지 않는다).
  - 맞음: `applyGuideStep(state, step, { netTypes })` → 실패면 run `quit` 저장, `error` 이벤트 `GUIDE_BROKEN_MESSAGE`, 메시지 저장(meta.guide kind "quit"), `guide` 이벤트, done. 성공이면 `status` drawing → 명령마다 `cmd` 이벤트 → `checkWarnings(state, prev, deps, AbortSignal.abort(), { knowledge })`(코드 규칙만 — AI 경고 문구는 대본 밖 글이다) → `createVersion(source "ai", messageId, summary `학습 ${n}단계: ${goal}`)` → `saveGuideFlows` → `saveAuthoredExplanations`(0..n 단계 explains 합본) → `say` 이벤트 → 메시지(content = say, meta.guide `{ kind: "step", step: n, notes }`, applied·changed·version·nodes·edges) → run `step+1`, `stepVersions` 에 버전 추가. 마지막 단계면 `status "done"` 과 완료 메시지(content = outro, meta.guide `{ kind: "done", outro, otherEnv, rebuild }`)를 더 남긴다 → `guide` 이벤트 → `done`(평소 필드: version, applied, changed, flows, missing 등).
  - 안 맞음·충돌: `say` = miss 또는 reply, 메시지 meta.guide kind "miss", 버전 없음.
  - 질문: `{ handled: false, intent: "question" }`.
- `pipeline.ts`: `runChatTurn` 은 `session` 이 있고 학습 중이면 `ValidationError(LEARNING_LOCKED_MESSAGE)`(라우트가 400). `lockedTurn` 은 사용자 메시지를 저장하고 망 지식을 읽은 직후, `sessionId === null` 이면 `getLiveGuideRun(diagramId)` 를 읽어 active 면 `runGuideTurn` 을 부른다. `handled` 면 끝, 아니면 intent 를 `"question"` 으로 고정하고(Clef 분류 생략) 기존 흐름을 그대로 탄다(Qwen 이 없으면 기존 `AI_UNAVAILABLE_MESSAGE` 경로). 되묻기(`detectForks`)는 학습 중 돌지 않는다(질문 경로라 이미 안 돈다 — 확인만).

- [ ] **Step 1: 실패하는 단위 테스트**(`tests/unit/guide-turn.test.ts`, 가짜 clef 와 Task 1 의 작은 variant 를 가진 가짜 guide 를 `getGuide` 대신 주입할 수 있게 `runGuideTurn` 의 deps 에 `guides?: (id: string) => Guide | undefined` 를 둔다):
  - `env is confirmed from text and the first step card is sent`
  - `unreadable env asks again`
  - `a matching step draws, versions, saves flows and explanations, and advances`
  - `a miss sends the step's miss text and draws nothing`
  - `a conflict sends its reply`
  - `a question is handed back as intent question`
  - `the last step marks the run done and sends the outro with rebuild envs`
  - `a rejected guide command quits the run` (Review Focus 3)
  - `a hanging clef falls back to keywords within the cap` (Review Focus 2: decide 가 끝나지 않는 가짜, 가짜 타이머로 3초 진행 → 키워드로 맞음)
  - `same text twice does not apply the step twice` (Review Focus 1: 같은 예시 문장 두 번 → 두 번째는 miss)
  - `the event order is cmd…, say, guide, done`
- [ ] **Step 2: 실패하는 통합 테스트**(`tests/integration/guide-turn.test.ts`): 실제 DB 에 run 을 만들고 `runChatTurn` 을 불러 `pipeline routes an active run to the guide turn`, `a question in learning streams an answer and keeps the step`, `a diagram session is refused while learning`, `a finished run goes back to the normal chat`.
- [ ] **Step 3:** `npx vitest run tests/unit/guide-turn.test.ts` 와 `npm run test:int -- guide-turn` → FAIL.
- [ ] **Step 4:** 구현.
- [ ] **Step 5:** 두 명령 PASS, `npm test` 전체 PASS.
- [ ] **Step 6:** 커밋 `feat(guide): 학습 중 대화 차례를 가이드 차례로 돌린다`.

---

### Task 7: 시작·그만두기·되돌리기 맞추기

**Files:**
- Create: `src/server/guide/start.ts`
- Modify: `src/app/(app)/actions.ts`(액션 셋 + 되돌리기 액션), `src/server/projects.ts`(필요하면 이름으로 프로젝트 찾기)
- Test: `tests/integration/guide-start.test.ts`

**Interfaces:**
- Produces (`start.ts`):
  - `LEARNING_PROJECT_NAME = "학습"`
  - `startGuide(userId: string, guideId: string, env: GuideEnv | null): Promise<{ projectId: string; diagramId: string }>` — "학습" 프로젝트를 찾거나(대소문자 무시) 만든다. 구성도 이름은 env 가 null 이면 `title`, 아니면 `${title} (${ENV_LABEL[env]})`, 겹치면 `copyName`. run 을 만든다. env null 이면 assistant 메시지(content = envIntro + "\n값은 예시입니다.", meta.guide `{ kind: "env", envChoices }`), env 가 있으면 `confirmGuideEnv`(messageId null)로 확정하고 1단계 안내 메시지. 없는 guideId·없는 env 면 `ValidationError`.
  - `quitGuide(userId: string, diagramId: string): Promise<void>` — 잠금(`withDiagramLock`) 안에서 active 면 `quit` 저장, system 메시지 `학습을 그만뒀어요. 이제 자유롭게 고칠 수 있어요.`
  - `syncGuideAfterRestore(diagramId: string, restoredFrom: number): Promise<GuideView | null>` — active 일 때만. `envVersion !== null && restoredFrom < envVersion` 이면 env null·step 0·stepVersions []·흐름 전부(`stepFlowIds(variant, 0)`) 삭제. 아니면 step = `stepVersions.filter(v => v <= restoredFrom).length`, stepVersions 를 그 길이로 자르고 `stepFlowIds(variant, step)` 삭제. 그 뒤 지금 상태로 0..step-1 explains 를 `saveAuthoredExplanations`. 새 GuideView 를 돌려준다.
- `actions.ts`: `startGuideAction(guideId: string, env: GuideEnv | null): Promise<ActionResult<{ projectId: string; diagramId: string }>>`, `quitGuideAction(diagramId: string): Promise<ActionResult>`, `restoreVersionAction` 이 학습 중이면 `syncGuideAfterRestore` 를 불러 결과에 `guide?: GuideView` 를 더한다.
- 구성도 페이지(`src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`)가 `getLiveGuideRun` 으로 읽어 `GuideView | null` 을 `DiagramWorkspace` 에 넘긴다(Task 9 가 쓴다). 여기서 범위 밖 run 이 quit 로 바뀐다(Review Focus 3).

- [ ] **Step 1: 실패하는 통합 테스트** — `startGuide creates the learning project once and a diagram per start`, `startGuide with env confirms it and posts the first step`, `startGuide without env posts the env question`, `startGuide rejects an unknown guide or env`, `quitGuide stops the run and unlocks edits`, `restoring to an earlier step moves the step back and drops later flows`, `restoring before the env version asks the env again` (Review Focus 4), `an out-of-range step quits the run on open` (Review Focus 3, `getLiveGuideRun` 경유), `explanations are re-saved for the restored state`.
- [ ] **Step 2:** `npm run test:int -- guide-start` → FAIL.
- [ ] **Step 3:** 구현.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** 커밋 `feat(guide): 학습 시작·그만두기와 되돌리기 뒤 단계 맞추기`.

---

### Task 8: 학습 중 가이드 밖 변경 막기

**Files:**
- Modify: `src/server/fields.ts`(`saveFieldsFor`), `src/server/assumptions.ts`(`confirmAssumptionFor`), `src/server/ignore.ts`(`setWarningIgnoredFor`), `src/server/zoneType.ts`(`setZoneTypeFor`), `src/server/linkGuess.ts`(`confirmLinkGuessFor`·`rejectLinkGuessFor`·`removeNoLinkFor`), `src/server/flows.ts`(`renameFlow`·`deleteFlow`·`confirmFlow`·`removeFlowStep`), `src/server/flowSuggest.ts`(`suggestFlows`), `src/server/samples.ts`(`importSample`), `src/server/mcp/apply.ts`(`applyMcpCommands`·`restoreMcpVersion`)
- Test: `tests/integration/guide-lock.test.ts`

**Interfaces:** Consumes `assertNotLearning`·`isLearning`·`LEARNING_LOCKED_MESSAGE`(Task 4).

- 위 함수마다 소유 확인 직후 `await assertNotLearning(diagramId)`. 서버 액션은 기존 `runResult` 가 `ValidationError` 를 `{ ok: false, error }` 로 돌려주므로 화면은 기존 오류 표시로 문구를 보인다(`run` 만 쓰는 `importSampleAction` 은 `runResult` 로 바꾸거나 같은 모양으로 돌려준다).
- `suggestFlows`: 학습 중이면 `auto` 는 `{ ok: true, saved: 0 }`(조용히), 수동은 `{ ok: false, message: LEARNING_LOCKED_MESSAGE }`.
- MCP: 학습 중이면 쓰기 도구가 `LEARNING_LOCKED_MESSAGE` 를 오류로 돌려준다(기존 바쁨 오류와 같은 모양). 읽기 도구는 그대로.
- 허용(막지 않음): 위치 저장·정렬 풀기(`savePinnedPositions`·`clearPinnedPositions`), 되돌리기, 복제(`duplicateDiagram` — 복제본에 run 을 만들지 않는다), 이름 바꾸기, 지우기, 설명 보기, 노드 질문(`/ask`).

- [ ] **Step 1: 실패하는 통합 테스트** — 학습 중 구성도로 각 함수를 불러 `ValidationError`(또는 MCP 오류 결과)와 문구를 확인: `field edits are locked`, `assumption confirm is locked`, `warning ignore is locked`, `zone type is locked`, `link guess actions are locked`, `flow edits are locked`, `auto flow suggest is a silent no-op`, `manual flow suggest is refused`, `sample import is locked`, `mcp writes are refused`, `pins, restore and duplicate still work`, `the duplicate is a normal diagram`, `everything unlocks after quit`.
- [ ] **Step 2:** `npm run test:int -- guide-lock` → FAIL.
- [ ] **Step 3:** 구현.
- [ ] **Step 4:** PASS + `npm run test:int` 전체 PASS.
- [ ] **Step 5:** 커밋 `feat(guide): 학습 중 가이드 밖 변경을 막는다`.

---

### Task 9: 화면

**Files:**
- Create: `src/app/(app)/learn/page.tsx`, `src/ui/guide/GuidePicker.tsx`, `src/ui/guide/GuideCard.tsx`, `src/ui/guide/GuideNotes.tsx`, `src/ui/guide/GuideDone.tsx`, `src/ui/guide/guide.module.css`
- Modify: `src/ui/Sidebar.tsx`(항목 "학습 모드" → `/learn`, 학습 중 구성도 표시 "학습 3/12"), `src/ui/DiagramWorkspace.tsx`(guide 상태 보관·`guide` 이벤트·되돌리기 결과 반영·그만두기), `src/ui/chat/ChatPanel.tsx`(카드·칩·새 대화 숨김), `src/ui/chat/lines.ts`(meta.guide → 줄), `src/ui/chat/useChatTurn.ts`(`guide` 이벤트 전달)
- Test: `tests/unit/GuidePicker.test.tsx`, `tests/unit/GuideCard.test.tsx`, `tests/unit/ChatPanel.test.tsx`(추가), `tests/unit/lines.test.ts`(추가)

**Interfaces:** Consumes `GuideView`(Task 2), `MessageMeta.guide`·`ChatEvent guide`(Task 6), `startGuideAction`·`quitGuideAction`·`restoreVersionAction().guide`(Task 7), `listGuideRuns`(Task 4), `GUIDE_LIST`·`guideEnvs`·`ENV_LABEL`·`NOTE_LABEL`.

- `/learn`: 위 문구 두 줄(실제 회사 아님 / 값은 예시). 주제 카드(제목·intro·learns·단계 수·환경 표시), 카드 버튼 "시작" → `startGuideAction(id, null)` → 구성도로 이동. 아래 "진행 중"·"끝낸 학습" 목록(구성도 링크, 진행 n/N).
- `GuideCard`(채팅 패널 위, active 일 때): 제목+환경, `n / N`, 이번 단계 goal, "이렇게 말해 보세요" + 예시 + [입력창에 넣기], [학습 그만두기](확인 대화 뒤 `quitGuideAction`). env 미확정이면 환경 칩(`envChoices`, 누르면 `ENV_LABEL[env]` 을 바로 보낸다).
- 메시지 줄: meta.guide kind "step" → 아래 접힌 해설 칩(`NOTE_LABEL`), 누르면 펼침(`aria-expanded`). kind "done" → `GuideDone`(outro, otherEnv 표, `rebuild` 마다 "<환경>으로 다시 만들기" → `startGuideAction(guideId, env)`).
- 학습 중 새 대화 세션 버튼 숨김. 막힌 조작은 숨기지 않고 서버 문구를 기존 오류 자리에 보인다(Task 8).

- [ ] **Step 1: 실패하는 jsdom 테스트** — `GuidePicker lists guides with the disclaimer`, `GuidePicker start calls the action and navigates`, `GuideCard shows step n/N, goal and example`, `insert example fills the input`, `env chips send the env label`, `quit asks to confirm`, `note chips expand with aria-expanded`, `done shows the other-env table and rebuild buttons`, `ChatPanel hides new session while learning`, `messagesToLines keeps meta.guide`. 키보드로 칩·버튼 조작(`userEvent.tab`/`keyboard`) 포함.
- [ ] **Step 2:** `npx vitest run tests/unit/Guide*.test.tsx tests/unit/ChatPanel.test.tsx tests/unit/lines.test.ts` → FAIL.
- [ ] **Step 3:** 구현.
- [ ] **Step 4:** PASS, `npm test`·`npm run lint`·`npx tsc --noEmit` PASS.
- [ ] **Step 5:** `npm run dev`(다른 포트가 쓰이면 따른다)로 띄워 `/learn` → 쇼핑몰 → 온프레미스 → 두 단계를 직접 해 보고 화면을 확인한다(가짜 LLM 이면 키워드 판정).
- [ ] **Step 6:** 커밋 `feat(guide): 학습 모드 화면(주제 고르기·단계 카드·해설 칩·완료)`.

---

### Task 10: 판정 평가 스크립트

**Files:**
- Create: `scripts/eval-guide.ts`, `tests/fixtures/guide/cases.json`, (`--update` 로) `tests/fixtures/guide/baseline.json`
- Modify: `package.json`(`"eval:guide": "tsx --env-file=.env scripts/eval-guide.ts"`)

**Interfaces:** Consumes `askClef`(Task 6), `decideStep`(Task 1), `getGuide`, `defaultChatDeps().clef`. DB 를 쓰지 않는다. `npm test`·CI 에 넣지 않는다.

- cases: `{ id, guide: "shop", env, step, text, expect: "match" | "miss" | "question" | "conflict" }`. 단계마다 맞는 문장 2개 이상(예시와 다른 자기 말 표현), 반대 문장(다른 단계 요청·수량 다름·질문) 2개 이상. 두 벌 × 12단계 기준 약 100문장.
- 옵션은 `eval-intent.ts` 와 같게: `--only`, `--repeat N`, `--update`, `--threshold X`(기준 바꿔 보기). 출력: 문장별 판정·match/question 확률, 맞은 비율, 기준 파일보다 나빠진 문장(있으면 exit 1). `formatTable`(`scripts/smoke-table.ts`) 재사용.
- [ ] **Step 1:** 스크립트·문장을 쓴다. `npx tsc --noEmit` 통과.
- [ ] **Step 2:** 사내망에서 `npm run eval:guide -- --repeat 3` 를 돌린다(밖이면 `CLEF_API_URL=https://open-llm.cudo.co.kr:7777 npx tsx --env-file=<원래 폴더>/.env scripts/eval-guide.ts --repeat 3`). Clef 에 닿지 못하면 이 Step 을 건너뛰었다고 보고한다.
- [ ] **Step 3:** 결과로 `GUIDE_MIN_CONFIDENCE`·Clef 문구·대본 `keywords`/`conflicts` 를 조정하고, 바꾸면 `--repeat 3` 로 다시 본 뒤 `--update` 로 기준을 저장한다.
- [ ] **Step 4:** 커밋 `test(eval): 학습 단계 판정 평가 eval:guide`.

---

### Task 11: E2E

**Files:**
- Create: `tests/e2e/guide.spec.ts`
- Modify(필요하면): `tests/e2e/fake-llm.ts`(Clef noul 가짜 응답)

- [ ] **Step 1: 테스트** — 로그인 → 사이드바 "학습 모드" → 쇼핑몰 "시작" → 환경 칩 "온프레미스" → 1단계 예시 [입력창에 넣기]·전송 → 노드가 그려지고 카드 `2 / 12` → 다른 말("DB 넣어 줘") → 안내 문구, 카드 그대로 → 새로 고침 → 같은 카드(이어서 하기) → 노드 눌러 설명 탭에 대본 글 → 설명 패널 값 고치기 시도 → 막힘 문구 → [학습 그만두기] 확인 → 카드 사라짐, 값 고치기 됨.
- [ ] **Step 2:** `npm run test:e2e -- guide` → PASS(처음엔 구현 버그로 실패하면 고친다).
- [ ] **Step 3:** `npm run test:e2e` 전체 PASS.
- [ ] **Step 4:** 커밋 `test(e2e): 학습 모드 한 바퀴`.

---

### Task 12: 마무리

- [ ] **Step 1:** `npm test`, `npm run test:int`, `npm run lint`, `npx tsc --noEmit`, `npm run build` 전부 통과를 확인하고 출력을 보고한다.
- [ ] **Step 2:** `PRODUCT.md` 의 Capabilities 에 학습 모드 한 줄을 더한다(주제 고르기, 대화로 단계별 완성, 일반 구성도로 남음). 커밋 `docs: 학습 모드를 제품 문서에 적는다`.
- [ ] **Step 3:** `superpowers:finishing-a-development-branch` 로 합치는 방법을 사용자에게 묻는다. main 에 합칠 때는 main 폴더에 열린 브랜치를 먼저 확인하고, main 이 아니면 `git fetch . feat/learning-mode:main` 으로 옮긴다.
- [ ] **Step 4:** 합친 뒤 문서 사이트(`feat/docs-site` worktree)의 `website/docs/guide/architecture.md` 에서 대화 한 차례 흐름(pipeline 분기)·이벤트 표(`guide`)·데이터 모델(`guide_runs`) 절을 고쳐야 한다고 사용자에게 알린다(그 worktree 작업은 사용자가 요청할 때).
