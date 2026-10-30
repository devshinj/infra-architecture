# InfraSketch 3C-1단계: 설명·용어 사전 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 설명 패널이 노드마다 다음을 보여 준다.
- 정의(사용자의 용어 사전에 있으면 바로, 없으면 AI 생성 후 사전에 "미검수"로 추가)
- 이 구성에서의 역할
- ADR(결정·이유·대안·대가)

설명은 대화가 끝나면 화면이 차례로 만들어 캐시하고, 누른 노드를 먼저 만든다. 길이 규칙과 Clef 난이도 점수로 최대 2회 다시 쓰게 한다. 그 밖에 다음을 만든다.
- 연결선은 누를 때 설명을 만든다.
- 설명 본문의 사전 용어는 점선 밑줄과 한 줄 풀이로 보인다.
- 사용자별 용어 사전 화면에서 목록·검색·수정·검수 완료를 한다.
- 설명 패널의 "다시 쓰기"로 요청을 반영해 다시 만든다.

**Architecture:**
- 새 DB 테이블은 두 개다.
  - `glossary_terms`: 사용자별 용어 사전. 첫 접근 때 시드 50개를 복사한다.
  - `explanations`: 구성도·대상별 캐시. 내용 서명(signature)이 바뀌면 다시 만든다.
- 순수 도메인 코드는 두 파일이다.
  - `src/domain/explain.ts`: 설명 모양·길이 상한·서명·용어 키
  - `src/domain/glossary-seed.ts`: 시드
- 서버 `src/server/explain.ts` 의 처리 순서는 다음과 같다.
  1. 캐시를 확인한다.
  2. 사전을 조회한다.
  3. Qwen 으로 JSON 한 개를 생성한다.
  4. 길이와 Clef `score` 를 검사하고, 필요하면 최대 2회 다시 쓴다.
  5. 결과를 저장한다.
- 화면은 `POST /api/diagrams/[id]/explain` 을 대상 하나씩 차례로 부른다.

**Tech Stack:** 3B 스택 그대로. 새 의존성 없음. drizzle 마이그레이션 1개 추가(`npm run db:migrate` 필요).

**Spec:** `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md` — 이번 범위는 아래와 같다.
- §6.1~6.7
- §4.6 의 설명 품질 검사(`score`)와 Clef 장애 시 "글자 수 검사만"
- §12.2 의 품질 점수 기준(1.3)
- 2026-10-30 사용자 결정(아래)

§6.8 은 3C-2 다.

## Global Constraints

- 2026-10-30 사용자 결정은 다음과 같다.
  - 3C 는 3C-1(설명·용어 사전)과 3C-2(노드에 대해 물어보기)로 나눈다.
  - 노드 설명은 **화면이 차례로 요청**한다. 대화가 끝나거나 구성도를 열면 설명이 없거나 낡은 노드를 하나씩 요청하고, 누른 노드는 맨 앞으로 보낸다.
  - 용어 사전은 **사용자별**이다. 시드는 사용자마다 복사한다.
  - 설명 수정은 **설명 패널의 "다시 쓰기" + 요청 한 줄**로 한다. 본 대화로는 하지 않는다.
  - 연결선 설명은 **누를 때만** 만든다.
- 1·2단계·3A·3B Global Constraints 전부 유지한다.
  - 한국어 UI, CSS 변수 토큰만 쓴다. `--accent` 금지(설명 UI 에는 쓰지 않음).
  - 이모지·글로우·그라데이션·사이드 바 금지.
  - 소유자만 접근한다. 키는 출력하지 않는다. 테스트에서 실제 AI 를 부르지 않는다.
  - 사용자 글(라벨·요청 한 줄)은 프롬프트·Clef state 에 `JSON.stringify` 로 넣는다.
- 설명 길이 상한(§6.5, 글자는 코드 포인트 기준)은 아래와 같다. 넘으면 다시 쓰게 한다.
  - 정의 120자
  - 역할 150자
  - ADR 각 항목 80자
  - 용어 노드의 "필요한 이유"·"비교" 각 120자
  - 연결 설명 각 항목 100자
- Clef 품질 검사는 다음과 같다.
  - 질문: `{ type: "score", instructions: "IT 비전공자가 이 설명을 읽고 바로 이해할 수 있는가? 전문용어가 풀이 없이 많거나 문장이 길고 장황할수록 높은 단계", criteria: ["쉽고 간결함", "보통", "어렵거나 장황함"] }`(스파이크 그대로)
  - 점수(0~2)가 **1.3 초과**면 다시 쓴다.
  - 다시 쓰기는 길이 초과와 합쳐 **최대 2회**다. 2회 뒤에도 넘으면 마지막 결과를 그대로 저장한다.
  - Clef 실패·키 없음이면 길이 검사만 한다. Clef 단계는 3초 상한에 재시도가 없다(3B 와 같은 `decide` 옵션).
- 화면 문구는 아래를 그대로 쓴다.
  - 절 제목: `정의`, `이 구성에서의 역할`, `결정 기록(ADR)`
    - ADR 항목: `결정`, `이유`, `대안`, `대가`
    - 용어 노드 추가 항목: `필요한 이유`, `비교`
  - 연결 설명 항목: `무엇이 오가나`, `방식`, `왜 연결됐나`, `방화벽 규칙`
  - 배지: `미검수`
  - 상태: `설명을 만드는 중…`, 오류: `설명을 만들지 못했어요. 다시 시도해 주세요.`
  - 다시 쓰기: 버튼 `다시 쓰기`, 입력 placeholder `어떻게 고칠까요? (예: 더 쉽게)`, 보내기 버튼 `다시 만들기`
  - 용어 사전 화면
    - 제목 `용어 사전`, 검색 placeholder `용어 검색`, 필터 `미검수만`
    - 버튼 `저장`, `검수 완료`
    - 출처 표시 `초기`/`AI`
    - 사이드바 링크 `용어 사전`
- 설명 생성은 구성도 버전을 만들지 않는다(구조 변경이 아님). 대화 잠금도 잡지 않는다.

## Review Focus

1. **AI 서버가 꺼져 있음** → 사전에 있는 정의는 바로 보이고, 역할·ADR 자리에는 `설명을 만들지 못했어요. 다시 시도해 주세요.` 가 뜬다. 다른 노드 요청은 계속 진행되고 패널은 멈추지 않는다. → Task 4 `qwen unavailable returns glossary-only explanation`, Task 7 `failed target shows the error and the queue continues`.
2. **노드의 SW·종류·연결이 바뀜** → 그 노드와 연결 상대의 설명이 낡은 것으로 판정돼 다시 만들어진다. 바뀌지 않은 노드는 다시 만들지 않는다. → Task 3 `signature changes with kind, sw and neighbours only`, Task 7 `only stale targets are queued`.
3. **같은 노드를 빠르게 여러 번 누르거나, 큐가 도는 중에 누름** → 같은 대상에 요청이 겹치지 않고 누른 노드가 다음 차례가 된다. → Task 7 `clicked node jumps the queue without duplicates`.
4. **AI 가 형식이 틀린 JSON·빈 항목을 냄** → 1회 다시 요청한다. 그래도 틀리면 오류로 저장하지 않고(캐시 없음) 오류를 돌려준다. → Task 4 `malformed output is retried once then fails without caching`.
5. **다른 사용자의 용어 사전·설명 접근** → 볼 수도 고칠 수도 없다(404/거부). → Task 2 `glossary is per user`, Task 5 `explain route is owner-only`.

---

## 파일 구조

```
src/
  db/schema.ts                  (수정) glossaryTerms, explanations + 마이그레이션 0002
  domain/
    glossary-seed.ts            (새) GLOSSARY_SEED(50개)
    explain.ts                  (새) 타입, LIMITS, termCandidates, normalizeTerm, signatureOf, overLimit
  server/
    glossary.ts                 (새) ensureSeeded, findTerm, listTerms, addAiTerm, updateTerm
    explain.ts                  (새) explainTarget, listSignatures
    chat/prompt.ts              (수정) EXPLAIN_NODE_PROMPT, EXPLAIN_EDGE_PROMPT, buildExplainMessages
    llm/clef.ts                 (수정) scoreValue(answer)
  app/
    api/diagrams/[id]/explain/route.ts  (새) POST(대상 1개), GET(서명 목록)
    (app)/glossary/page.tsx     (새) 용어 사전 화면
    (app)/actions.ts            (수정) updateTermAction, setTermReviewedAction
  ui/
    explain/useExplanations.ts  (새) 큐·캐시·우선순위
    explain/Explanation.tsx     (새) 정의·역할·ADR·연결 설명·다시 쓰기
    explain/TermText.tsx        (새) 본문 용어 점선 밑줄·풀이
    glossary/GlossaryPage.tsx   (새)
    NodeInfo.tsx, RightPanel.tsx, DiagramWorkspace.tsx, Sidebar.tsx (수정)
scripts/smoke-llm.ts            (수정) score 응답 모양·점수
tests/e2e/fake-llm.ts           (수정) 설명 프롬프트·score 응답
```

---

### Task 1: DB 테이블과 마이그레이션

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/0002_*.sql`(`npm run db:generate` 로 생성)
- Test: `tests/integration/schema-3c.test.ts`

**Interfaces:**
- Produces:
  - `glossaryTerms` 테이블. 컬럼은 아래와 같다.
    - `id uuid pk`
    - `userId → users.id cascade`
    - `key text`(정규화 키)
    - `term text`(표시 이름)
    - `fullName text`(정식 명칭/약어 풀이, 빈 문자열 허용)
    - `category text`
    - `definition text`
    - `why text`, `compare text`(빈 문자열 허용)
    - `aliases jsonb string[]`(정규화 키들, 기본 `[]`)
    - `reviewed boolean default false`
    - `source text ("seed"|"ai")`
    - `updatedAt timestamptz`
    - unique(`userId`, `key`)
  - `explanations` 테이블. 컬럼은 아래와 같다.
    - `id uuid pk`
    - `diagramId → diagrams.id cascade`
    - `targetKind text ("node"|"edge")`, `targetId text`
    - `signature text`
    - `data jsonb`(Task 3 의 `NodeExplanation | EdgeExplanation`)
    - `updatedAt timestamptz`
    - unique(`diagramId`, `targetKind`, `targetId`)
- [ ] **Step 1: 실패하는 통합 테스트**
  - `glossary key is unique per user but shared keys across users are allowed`
  - `explanations cascade with the diagram`
- [ ] **Step 2:** `npm run test:int -- schema-3c` → FAIL
- [ ] **Step 3: 구현.**
  - schema 를 고친 뒤 `npm run db:generate` 로 0002 를 만든다.
  - 테스트 DB 적용은 기존 `tests/integration/setup.ts` 방식을 따른다.
  - 개발 DB 에는 실행하지 않는다(사용자가 `npm run db:migrate`).
- [ ] **Step 4:** 같은 명령 → PASS, `npm run test:int` 전체, `npx tsc --noEmit`
- [ ] **Step 5: Commit** `feat: 용어 사전·설명 캐시 테이블`

---

### Task 2: 용어 사전 시드와 서버 함수

**Files:**
- Create: `src/domain/glossary-seed.ts`, `src/server/glossary.ts`
- Modify: `src/domain/explain.ts`(새로 만듦, `normalizeTerm`·`termCandidates` 만 이 태스크에서)
- Test: `tests/unit/glossary-seed.test.ts`, `tests/unit/explain-terms.test.ts`, `tests/integration/glossary.test.ts`

**Interfaces:**
- Produces:
  - `normalizeTerm(s: string): string` — 소문자로 바꾸고, 공백·`/`·`-`·`_`·`.` 를 지운 뒤, 끝의 버전 숫자를 지운다. 예:
    - `"Tomcat 10"` → `"tomcat"`
    - `"L4 로드밸런서"` → `"l4로드밸런서"`
    - `"Redis 7.2"` → `"redis"`
  - `termCandidates(node: DNode): { key: string; display: string }[]` — 순서는 `attrs.sw`, `sub`, 종류 한국어 이름(`NODE_KINDS[].labelKo`)이다. 빈 값은 빼고, 중복 key 도 뺀다.
  - `GLOSSARY_SEED`: 한국어 초안 50개. 각 항목은 `{ term, fullName, category, definition, why, compare, aliases: string[] }` 다.
    - 반드시 포함할 것: Redis, Nginx, Apache, Tomcat, MySQL, PostgreSQL, Oracle, MongoDB, Elasticsearch, Kafka, RabbitMQ, SQS, S3, CDN, WAF, DNS, NAT, VPN, VIP, DMZ, L4 로드밸런서, L7 로드밸런서, ALB, NLB, API 게이트웨이, 방화벽, 배스천, VPC, 서브넷, 가용 영역(AZ), 오토스케일링, 쿠버네티스, 인그레스, 파드, 서비스(K8s), 컨테이너, 서버리스 함수, Lambda, 캐시, 세션, Cache-aside, DB 복제, Active/Standby, DB 중계(Proxy), 모니터링, 로깅, CI/CD, OAuth, PG(결제대행)
    - 하나는 자유롭게 정한다.
    - 정의는 §6.1 예처럼 정식 명칭·분류를 포함한 사전식 한 문장 120자 이내다. `why`·`compare` 는 용어·약어(§6.2)에 해당하면 채우고, 아니면 빈 문자열로 둔다.
    - `aliases` 에는 catalog 의 kind 한국어 이름과 흔한 표기를 normalizeTerm 한 값으로 넣는다(예: L4 로드밸런서 ↔ `l4`, `l4로드밸런서`).
  - `ensureSeeded(userId): Promise<void>` — 그 사용자 행이 0개면 시드를 `source:"seed", reviewed:false` 로 넣는다. 동시 호출에도 중복이 생기지 않아야 한다(on conflict do nothing).
  - `findTerm(userId, keys: string[]): Promise<GlossaryRow | null>` — keys 순서대로 `key` 또는 `aliases` 에 맞는 첫 항목을 찾는다.
  - `listTerms(userId, opts?: { q?: string; unreviewedOnly?: boolean }): Promise<GlossaryRow[]>` — q 는 term·fullName·definition 부분 일치, 정렬은 term 이다.
  - `addAiTerm(userId, entry): Promise<GlossaryRow>` — `source:"ai", reviewed:false` 로 넣는다. 같은 key 가 있으면 기존 것을 돌려준다(덮어쓰지 않음).
  - `updateTerm(userId, id, patch: { term?, fullName?, category?, definition?, why?, compare?, reviewed? }): Promise<GlossaryRow>`
    - definition 은 1~120자, why·compare 는 0~120자, 나머지는 1~40자다(fullName·category 는 0~80자).
    - 위반이면 `ValidationError`, 남의 항목이면 `NotFoundError` 다.
    - 내용을 고쳐도 검수 상태는 그대로다. 검수는 `reviewed` 로만 바꾼다.
- [ ] **Step 1: 실패하는 테스트**
  - seed:
    - `fifty entries with required terms`
    - `definitions within 120 chars`
    - `aliases are normalized`
    - `no duplicate keys`
  - terms:
    - `normalizeTerm examples`
    - `candidates prefer sw then sub then kind name`
  - 통합:
    - `ensureSeeded copies 50 once, concurrent calls don't duplicate`
    - `findTerm matches alias`
    - `glossary is per user`
    - `addAiTerm keeps existing`
    - `updateTerm validates and keeps reviewed unless set`
    - `listTerms filters`
- [ ] **Step 2:** `npx vitest run tests/unit/glossary-seed.test.ts tests/unit/explain-terms.test.ts` 와 `npm run test:int -- glossary` → FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4:** 같은 명령 → PASS, `npm test`, `npx tsc --noEmit`
- [ ] **Step 5: Commit** `feat: 사용자별 용어 사전과 시드`

---

### Task 3: 설명 도메인 — 모양·길이·서명

**Files:**
- Modify: `src/domain/explain.ts`
- Test: `tests/unit/explain.test.ts`

**Interfaces:**
- Produces:
  - 타입은 아래와 같다.
    ```ts
    interface NodeExplanation {
      kind: "node";
      term: string;                       // 표시 용어
      definition: string;
      definitionSource: "glossary" | "ai";
      reviewed: boolean;                  // 사전 항목의 검수 상태(ai 생성 직후 false)
      why?: string; compare?: string;     // 사전에 있으면
      role: string;
      adr: { decision: string; reason: string; alternative: string; cost: string };
    }
    interface EdgeExplanation { kind: "edge"; flow: string; method: string; why: string; firewall: string }
    ```
  - `LIMITS = { definition: 120, role: 150, adr: 80, why: 120, compare: 120, edge: 100 }`
  - `overLimit(e: NodeExplanation | EdgeExplanation): string[]` — 넘은 항목 이름 목록이다(코드 포인트 기준).
  - `signatureOf(state, targetKind, id): string | null` — 대상이 없으면 null 이다.
    - 노드: kind, label, sub, attrs.sw, attrs.version, 그리고 연결 목록(edgeKind, 방향, 상대 id, 상대 kind, 상대 label 을 정렬한 것)의 JSON 을 해시한다(짧은 안정 해시, 예: FNV-1a 16진수).
    - 연결: edgeKind, label, 양 끝의 kind·label 이다.
    - attrs 의 다른 값(cpu·ip 등)은 넣지 않는다.
- [ ] **Step 1: 실패하는 테스트**
  - `signature changes with kind, sw and neighbours only`. 이웃 라벨이 바뀌면 변하고, cpu·ip 가 바뀌면 그대로다.
  - `edge signature follows label and endpoints`
  - `missing target gives null`
  - `overLimit lists exceeded fields by code points`
- [ ] **Step 2:** `npx vitest run tests/unit/explain.test.ts` → FAIL
- [ ] **Step 3: 구현** · **Step 4:** PASS, `npm test`
- [ ] **Step 5: Commit** `feat: 설명 모양·길이 상한·서명`

---

### Task 4: 서버 설명 생성

**Files:**
- Create: `src/server/explain.ts`
- Modify: `src/server/chat/prompt.ts`, `src/server/llm/clef.ts`
- Test: `tests/unit/server-explain.test.ts`(가짜 qwen·clef·저장소 주입), `tests/integration/explain.test.ts`, `tests/unit/clef.test.ts`

**Interfaces:**
- Consumes: Task 2(`ensureSeeded`, `findTerm`, `addAiTerm`), Task 3(타입·`overLimit`·`signatureOf`·`termCandidates`), `ClefClient.decide(…, {capMs:3000, maxRetries:0})`, `QwenClient.streamCompletion`
- Produces:
  - `scoreValue(a: ClefAnswer | undefined): number | null`
    - `a.score` 가 숫자면 그 값을 쓴다.
    - `a.probabilities` 가 criteria 이름별 확률이면 기대값 Σ i·p(i) 를 쓴다(i 는 criteria 순서 0~2).
    - `a.choice` 가 criteria 이름이면 그 순번을 쓴다.
    - 그 밖이면 null 이다. 값은 0~2 로 자른다.
  - `EXPLAIN_NODE_PROMPT` / `EXPLAIN_EDGE_PROMPT` 는 JSON 객체 하나만 출력하게 한다(코드펜스 금지).
    - 노드 키: `definition`(사전 정의가 주어지면 생략), `role`, `adr{decision,reason,alternative,cost}`
    - 연결 키: `flow`, `method`, `why`, `firewall`
    - 비유 금지, 정의는 정식 명칭·분류를 포함한 사전식 한 문장이다(§6.1).
    - 역할은 이 구성에서의 역할 1~2문장이다.
    - 각 항목 글자 상한을 프롬프트에 숫자로 적는다.
  - `buildExplainMessages(input: { kind: "node" | "edge"; state: DiagramState; id: string; glossaryDefinition?: string; instruction?: string; previous?: object; problems?: string[] }): ChatMessage[]`
    - 상태 요약은 대상과 이웃만 담고, 라벨은 `JSON.stringify` 한다.
    - `instruction`(다시 쓰기 요청)과 `problems`(길이 초과·어려움 지적)가 있으면 이전 결과와 함께 다시 쓰라고 지시한다.
  - `explainTarget(userId, diagramId, targetKind, targetId, opts?: { instruction?: string; force?: boolean }, deps?): Promise<{ ok: true; explanation: NodeExplanation | EdgeExplanation; signature: string } | { ok: false; message: string; partial?: Partial<NodeExplanation> }>`
    - 소유를 확인하고(남의 구성도는 `NotFoundError`), 최신 상태에서 대상을 찾는다(없으면 `ValidationError("대상을 찾을 수 없어요")`).
    - `instruction` 은 1~200자이고 공백을 접는다.
    - 캐시: `force`·`instruction` 이 없고 저장된 signature 가 같으면 그대로 돌려준다.
    - 노드면 `ensureSeeded` → `findTerm(termCandidates 의 key 들)` 를 거친다.
      - 사전에 있으면 정의·why·compare·reviewed 를 사전에서 쓰고, Qwen 에는 정의를 만들지 말라고 한다.
      - 없으면 Qwen 이 쓴 `definition` 을 `addAiTerm(term=candidates[0].display, category=종류 한국어 이름, why/compare 빈 문자열)` 로 사전에 넣고 `reviewed:false` 로 둔다.
    - 검사: JSON 파싱(앞뒤 코드펜스 제거)과 필수 항목 비어 있지 않음을 본다. 실패하면 1회 다시 요청하고, 또 실패하면 `{ok:false}` 이며 저장하지 않는다.
    - 품질: `overLimit` 이 있거나, Clef 점수(정의+역할을 이어 붙인 글 1회)가 1.3 을 넘으면 problems 를 담아 다시 쓴다. 최대 2회다. Clef 실패·null 이면 길이만 본다.
    - Qwen 이 없으면(키 없음·실패) 노드는 사전 정의가 있을 때만 `{ok:false, message:"설명을 만들지 못했어요. 다시 시도해 주세요.", partial:{term, definition, definitionSource:"glossary", reviewed, why, compare}}` 이다. 사전 정의가 없거나 연결이면 `{ok:false, message}` 다.
    - 저장: upsert(diagramId, targetKind, targetId) 에 signature 와 data 를 넣는다.
  - `listSignatures(userId, diagramId): Promise<Record<string, string>>` — key 는 `"node:<id>"`/`"edge:<id>"`, 값은 저장된 signature 다.
- [ ] **Step 1: 실패하는 테스트**
  - clef: `scoreValue reads score, probabilities and choice`
  - server-explain:
    - `glossary definition is used and qwen is told not to define`
    - `missing term is generated and added unreviewed`
    - `cached explanation is returned when signature matches`
    - `instruction forces regeneration with the instruction in the prompt`
    - `over-limit output is rewritten up to 2 times then saved`
    - `clef score above 1.3 triggers rewrite, clef failure uses length only`
    - `malformed output is retried once then fails without caching`
    - `qwen unavailable returns glossary-only explanation`
    - `edge explanation has four fields`
    - `labels and instruction are JSON-escaped`
  - 통합:
    - `explainTarget round-trips through the cache table`
    - `other user's diagram is not found`
    - `listSignatures`
- [ ] **Step 2:** 위 테스트 → FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4:** PASS, `npm test`, `npm run test:int`, `npx tsc --noEmit`, `npm run lint`
- [ ] **Step 5: Commit** `feat: 노드·연결 설명 생성과 품질 검사`

---

### Task 5: 설명 API

**Files:**
- Create: `src/app/api/diagrams/[id]/explain/route.ts`
- Test: `tests/integration/explain-route.test.ts`(chat-route 테스트 패턴)

**Interfaces:**
- Produces:
  - `POST /api/diagrams/:id/explain`
    - 본문은 `{ targetKind: "node"|"edge", targetId: string, instruction?: string }` 다. zod 로 검증하고, 틀리면 400 이다.
    - 응답은 Task 4 결과 JSON 이다(200).
    - 상태 코드: 비로그인 401(미들웨어), 남의 구성도 404, `ValidationError` 400.
    - 의존성은 `defaultChatDeps` 의 qwen·clef 를 재사용한다(테스트는 `setChatDepsForTest`).
  - `GET /api/diagrams/:id/explain` → `listSignatures` 결과.
- [ ] **Step 1: 실패하는 테스트**
  - `explain route is owner-only`
  - `bad body is 400`
  - `post returns explanation`
  - `get returns signatures`
- [ ] **Step 2:** `npm run test:int -- explain-route` → FAIL
- [ ] **Step 3: 구현** · **Step 4:** PASS, `npm test`, `npx tsc --noEmit`
- [ ] **Step 5: Commit** `feat: 설명 API`

---

### Task 6: 설명 패널 화면

**Files:**
- Create: `src/ui/explain/Explanation.tsx`, `src/ui/explain/TermText.tsx`
- Modify: `src/ui/NodeInfo.tsx`, `src/ui/panel.module.css`
- Test: `tests/unit/Explanation.test.tsx`, `tests/unit/TermText.test.tsx`, `tests/unit/NodeInfo.test.tsx`(추가)

**Interfaces:**
- Produces:
  - `ExplanationProps { status: "idle" | "loading" | "ready" | "error"; data?: NodeExplanation | EdgeExplanation; partial?: Partial<NodeExplanation>; message?: string; terms: { key: string; term: string; definition: string }[]; onRewrite?(instruction: string): void; onRetry?(): void; busy?: boolean }`
  - 노드
    - 순서: `정의`(뒤에 미검수면 `미검수` 배지) → 용어 항목이 있으면 `필요한 이유`·`비교` → `이 구성에서의 역할` → `결정 기록(ADR)`(`결정`/`이유`/`대안`/`대가`)
    - loading 이면 각 자리에 `설명을 만드는 중…` 이다.
    - error 면 `partial` 의 정의를 보이고 나머지 자리에 오류 문구와 `다시 시도` 버튼을 둔다(onRetry).
  - 연결: `무엇이 오가나`·`방식`·`왜 연결됐나`·`방화벽 규칙`
  - 다시 쓰기: `다시 쓰기` 버튼 → 한 줄 입력(placeholder `어떻게 고칠까요? (예: 더 쉽게)`)과 `다시 만들기` → `onRewrite(text)`. 빈 입력이면 `더 쉽고 짧게` 로 보낸다. busy 면 비활성이다.
  - `TermText({ text, terms })`
    - 본문에서 사전 용어(term 표시 이름, 2자 이상, 긴 것 우선, 대소문자 무시)를 찾는다.
    - 찾은 용어는 `<abbr className="term" title={definition} tabIndex={0}>` 로 감싸 점선 밑줄을 긋고, 포커스·호버에 한 줄 풀이를 보인다.
    - 대상 노드 자신의 용어는 정의 절에서 감싸지 않는다.
  - NodeInfo: 노드 헤더·링크 버튼 다음, `주의할 점` 앞에 `Explanation` 을 둔다. 연결 선택 시 기존 필드 아래에 둔다. 새 props: `explain?: ExplanationProps`.
- [ ] **Step 1: 실패하는 테스트**
  - `node sections in spec order with 미검수 badge`
  - `term node shows 필요한 이유 and 비교`
  - `loading text`
  - `error shows partial definition, message and retry`
  - `rewrite sends instruction, empty uses default`
  - `edge four fields`
  - `TermText wraps longest match and shows definition`
  - `own term not wrapped`
- [ ] **Step 2:** → FAIL
- [ ] **Step 3: 구현** · **Step 4:** PASS, `npm test`, `npx tsc --noEmit`, `npm run lint`
- [ ] **Step 5: Commit** `feat: 설명 패널 정의·역할·ADR·용어 풀이`

---

### Task 7: 설명 큐와 연결

**Files:**
- Create: `src/ui/explain/useExplanations.ts`
- Modify: `src/ui/DiagramWorkspace.tsx`, `src/ui/RightPanel.tsx`
- Test: `tests/unit/useExplanations.test.tsx`, `tests/unit/DiagramWorkspace.test.tsx`(추가)

**Interfaces:**
- Consumes: Task 5 API, `signatureOf`(Task 3), Task 6 props
- Produces:
  - `useExplanations({ diagramId, state, live: boolean, busy: boolean, selectedId: string | null, fetchImpl? })`. 반환값은 아래와 같다.
    - `get(kind, id)`: Task 6 의 status/data/partial/message
    - `rewrite(kind, id, instruction)`
    - `retry(kind, id)`
    - `terms`: `GET /api/glossary/terms` 대신 서버 액션 `listTermsAction()` 의 `{key,term,definition}` 목록. Task 8 에서 만드는 액션을 여기서 먼저 만든다.
  - 규칙:
    - 처음 열 때 `GET` 으로 저장된 서명을 받는다.
    - `live && !busy` 일 때 지금 상태의 모든 노드 중 `signatureOf` 가 저장 서명과 다른 노드를 큐에 넣는다. 순서는 삽입 순이고, 선택된 노드가 맨 앞이다.
    - 한 번에 1개씩 POST 한다.
    - 대화 차례(busy) 중에는 새 요청을 시작하지 않는다. 진행 중인 1건은 둔다.
    - 대화가 끝나 상태가 바뀌면 큐를 다시 계산한다.
    - 연결은 선택됐을 때만 요청한다.
    - 같은 대상이 진행 중이면 다시 넣지 않는다.
    - 실패한 대상은 오류로 표시하고 큐는 계속한다. 자동 재시도는 하지 않고 retry 로만 한다.
    - 언마운트하면 진행 중 요청을 abort 한다.
  - 이력 보기·비교 모드에서는 큐를 멈추고, 캐시에 있는 것만 보인다.
- [ ] **Step 1: 실패하는 테스트**(가짜 fetch)
  - `only stale targets are queued`
  - `clicked node jumps the queue without duplicates`
  - `no new requests while busy, resumes after`
  - `failed target shows the error and the queue continues`
  - `edge explained only when selected`
  - `rewrite posts instruction and replaces the entry`
  - `paused in history view`
  - DiagramWorkspace: `selecting a node shows its explanation in 설명`
- [ ] **Step 2:** → FAIL
- [ ] **Step 3: 구현**
- [ ] **Step 4:** PASS, `npm test`, `npx tsc --noEmit`, `npm run lint`
- [ ] **Step 5: Commit** `feat: 설명 차례 생성과 우선순위`

---

### Task 8: 용어 사전 화면

**Files:**
- Create: `src/app/(app)/glossary/page.tsx`, `src/ui/glossary/GlossaryPage.tsx`(+ css module)
- Modify: `src/app/(app)/actions.ts`, `src/ui/Sidebar.tsx`
- Test: `tests/unit/GlossaryPage.test.tsx`, `tests/integration/glossary-actions.test.ts`

**Interfaces:**
- Produces:
  - 액션: `listTermsAction(opts?)`(Task 7 이 이미 만들었으면 재사용), `updateTermAction(id, patch)`, `setTermReviewedAction(id, reviewed: boolean)`. 모두 로그인 사용자 기준이고 `ensureSeeded` 를 먼저 부른다.
  - 화면 `/glossary`
    - 제목 `용어 사전`, 검색 입력(`용어 검색`), `미검수만` 체크
    - 목록: 용어·분류·정의 앞부분·`미검수` 배지·출처 `초기`/`AI`
    - 항목을 누르면 편집 폼(term·fullName·category·definition·why·compare)과 `저장`·`검수 완료`(이미 검수면 `검수 취소`) 버튼이 나온다.
    - 검증 오류는 `role="alert"` 다.
  - Sidebar 에 `용어 사전` 링크를 둔다.
- [ ] **Step 1: 실패하는 테스트**
  - `search and unreviewed filter`
  - `edit saves and shows errors`
  - `검수 완료 toggles badge`
  - 통합: `actions are per user`
- [ ] **Step 2:** → FAIL
- [ ] **Step 3: 구현** · **Step 4:** PASS, `npm test`, `npm run test:int`, `npx tsc --noEmit`, `npm run lint`
- [ ] **Step 5: Commit** `feat: 용어 사전 화면`

---

### Task 9: 가짜 AI·smoke·E2E

**Files:**
- Modify: `tests/e2e/fake-llm.ts`, `scripts/smoke-llm.ts`
- Create: `tests/e2e/phase3c1.spec.ts`

- [ ] **Step 1: 가짜 AI**
  - 가짜 Qwen: system 이 `EXPLAIN_NODE_PROMPT` 면 정해진 JSON(`role`·`adr`, 정의 요청 시 `definition`)을 주고, `EXPLAIN_EDGE_PROMPT` 면 네 항목 JSON 을 준다. 요청에 `"더 쉽게"` 가 있으면 role 을 `"다시 쓴 역할"` 로 준다.
  - 가짜 Clef: `score` 질문에 `{ type:"score", score: 0.5 }` 를 준다.
- [ ] **Step 2: smoke** — 스파이크 good/bad 설명 두 문장(`spike.mjs:217-218`)으로 score 를 판정하고, 원본 응답 키 목록과 `scoreValue` 를 출력한다. 실행은 사용자가 하고, 구현자는 tsc 만 통과하면 된다.
- [ ] **Step 3: E2E** `explanations and glossary`
  1. s1 을 만든다(가짜 AI).
  2. Redis 등 사전에 있는 노드를 누르면 `정의` 에 시드 정의와 `미검수` 가 보인다.
  3. `이 구성에서의 역할` 에 가짜 역할이 보인다.
  4. `다시 쓰기` → `더 쉽게` → `다시 만들기` 하면 `다시 쓴 역할` 이 보인다.
  5. 연결선을 누르면 `무엇이 오가나` 가 보인다.
  6. `/glossary` 에서 그 용어를 검색하고 `검수 완료` 를 누른다.
  7. 구성도로 돌아가 같은 노드를 누르면 `미검수` 가 없다.
- [ ] **Step 4:** `npm run test:e2e` 연속 2회 통과, 기존 10개 유지, 고정 sleep 금지
- [ ] **Step 5: Commit** `test: 3C-1 E2E(설명·용어 사전)`

---

## 3C-2 로 넘기는 것
- §6.8 노드에 대해 물어보기: 노드별 질문 입력 → 대화 영역에 새 대화 세션을 추가하고, 그 노드의 메타정보·설명을 근거로 답한다(구성 변경 없음).
- 세션 목록 모양·전환·저장 방식은 3C-2 계획에서 정한다.
