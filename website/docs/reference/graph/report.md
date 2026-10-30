---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 840 nodes · 2182 edges · 36 communities (35 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 68 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `37037b45`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 서버 액션과 작업 화면
- 표시 그래프와 버전 비교
- 연결선 구간 묶음
- DB 스키마와 인증
- 가정과 대화 패널 UI
- 오른쪽 패널과 설명 화면
- 설계 문서와 계획
- 대화 이벤트와 빠진 정보 체크리스트
- ELK 자동 배치와 꺾은선
- 환경 변수와 AI 상태 점검
- 명령 적용과 샘플
- 대화 파이프라인과 저장
- 프롬프트와 구성 패턴
- 설명 생성과 품질 검사
- 노드 종류 목록과 명령 스키마
- 캔버스 이벤트
- Clef 질문과 응답 타입
- 용어 사전 저장과 시드
- 경고 규칙과 점검
- 라우트 재수출
- 노드 카드와 아이콘
- 설명 요청 차례
- 캔버스 옵션과 노드 메뉴
- 연결선 그리기
- 미들웨어와 로그인 경로
- 연결선 개발용 화면
- 설명 모양·길이·서명
- 설명 API
- 흐름 애니메이션
- 3C-1 계획 작업 목록
- Qwen 클라이언트
- 겹침 검사
- Clef 호출과 동시성
- 글자 폭 계산
- 3C-1단계 계획
- 구성도 상태 타입

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 36 edges
2. `InfraSketch 설계 문서` - 34 edges
3. `getOwnedDiagram()` - 27 edges
4. `DiagramWorkspace()` - 25 edges
5. `explainTarget()` - 23 edges
6. `lockedTurn()` - 21 edges
7. `ValidationError` - 19 edges
8. `auth` - 18 edges
9. `createVersion()` - 17 edges
10. `run()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Task 2: 용어 사전 시드와 서버 함수` --references--> `NotFoundError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 4: 서버 설명 생성` --references--> `NotFoundError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 2: 용어 사전 시드와 서버 함수` --references--> `ValidationError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 2: 서버 점검 — Clef 판정과 Qwen 문구` --references--> `Warning`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/domain/types.ts
- `Task 3: 대화 차례에 점검 단계 넣기` --references--> `ChatEvent`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/server/chat/events.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (36 total, 1 thin omitted)

### Community 0 - "서버 액션과 작업 화면"
Cohesion: 0.05
Nodes (81): GET(), ActionResult, clearPinnedAction(), confirmAssumptionAction(), createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction() (+73 more)

### Community 1 - "표시 그래프와 버전 비교"
Cohesion: 0.19
Nodes (15): FlowProps, buildDisplayGraph(), DisplayGraph, DisplayGroup, DisplayOptions, isBus(), Layout, APPEARING_MS (+7 more)

### Community 2 - "연결선 구간 묶음"
Cohesion: 0.23
Nodes (17): assignStarts(), buildSegmentBundles(), buildSegs(), InEdge, normalize(), Piece, piecesOf(), pk() (+9 more)

### Community 3 - "DB 스키마와 인증"
Cohesion: 0.09
Nodes (30): LoginPage(), ResetRequestPage(), ResetPasswordPage(), SignupPage(), signIn, db, accounts, diagrams (+22 more)

### Community 4 - "가정과 대화 패널 UI"
Cohesion: 0.09
Nodes (21): 가정 목록 (구조 결정), 노드 참조 (@WAS#1 칩), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, confirmAssumption(), Assumption, AssumptionChips(), AssumptionChipsProps (+13 more)

### Community 5 - "오른쪽 패널과 설명 화면"
Cohesion: 0.08
Nodes (31): isEmpty(), ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), ExplanationProps, NodeBody(), Retry() (+23 more)

### Community 6 - "설계 문서와 계획"
Cohesion: 0.09
Nodes (29): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전 (+21 more)

### Community 7 - "대화 이벤트와 빠진 정보 체크리스트"
Cohesion: 0.08
Nodes (35): Task 1: 경고 규칙과 구성 패턴(도메인), Command, computeMissing(), FIELD_LABELS, labelOf(), MissingItem, missingReminder(), requiredKeysFor() (+27 more)

### Community 8 - "ELK 자동 배치와 꺾은선"
Cohesion: 0.13
Nodes (19): elbowRoute(), Pt, BASE_OPTIONS, elk, ElkRun, EMPTY_GROUP, LaidOutEdge, LaidOutGroup (+11 more)

### Community 9 - "환경 변수와 AI 상태 점검"
Cohesion: 0.20
Nodes (9): Qwen URL 정규화, env, envSchema, parseEnv(), llmConfig, normalizeQwenBaseUrl(), checkLlmHealth(), LlmHealth (+1 more)

### Community 10 - "명령 적용과 샘플"
Cohesion: 0.09
Nodes (28): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus, applyCommand(), applyCommands(), ApplyResult, endpointOk() (+20 more)

### Community 11 - "대화 파이프라인과 저장"
Cohesion: 0.06
Nodes (62): Task 4: "의도된 구성" 저장, Task 5: 설명 API, BodySchema, dynamic, encoder, line(), Outcome, POST() (+54 more)

### Community 12 - "프롬프트와 구성 패턴"
Cohesion: 0.12
Nodes (19): Pattern, patternPromptBlock(), PATTERNS, ancestorsOf(), ANSWER_PROMPT, buildMessages(), describeEndpoint(), EDGE_KIND_LIST (+11 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.11
Nodes (27): ExplanationTargetKind, buildExplainMessages(), codePoints(), complete(), dbRepo, DepsInput, Draft, draftOf() (+19 more)

### Community 14 - "노드 종류 목록과 명령 스키마"
Cohesion: 0.12
Nodes (17): GroupBoxData, DATA, EDGE_KINDS, GROUP_KINDS, GroupKind, GUARD, NODE_KINDS, NodeKindDef (+9 more)

### Community 15 - "캔버스 이벤트"
Cohesion: 0.23
Nodes (6): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, Canvas(), CanvasProps, Flow(), mergeWarnings(), warningsByNode()

### Community 16 - "Clef 질문과 응답 타입"
Cohesion: 0.15
Nodes (11): ClefAnswer, ClefAnswers, ClefHttpError, EXPLAIN_SCORE_QUESTION, Intent, INTENT_MIN_CONFIDENCE, INTENT_QUESTION, INTENTS (+3 more)

### Community 17 - "용어 사전 저장과 시드"
Cohesion: 0.18
Nodes (13): Task 2: 용어 사전 시드와 서버 함수, glossaryTerms, normalizeTerm(), pickTerm(), termCandidates(), GLOSSARY_SEED, GlossarySeedEntry, addAiTerm() (+5 more)

### Community 18 - "경고 규칙과 점검"
Cohesion: 0.09
Nodes (34): Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 3: 대화 차례에 점검 단계 넣기, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, categoryOf(), NodeKind, DNode (+26 more)

### Community 20 - "노드 카드와 아이콘"
Cohesion: 0.20
Nodes (10): PanelNode, PanelView(), GroupBox(), CategoryIcon(), PATHS, NodeCard(), NodeCardData, NodeVisualState (+2 more)

### Community 21 - "설명 요청 차례"
Cohesion: 0.25
Nodes (13): listTermsAction(), EdgeExplanation, NodeExplanation, Entry, ExplanationView, fresh(), Job, keyOf() (+5 more)

### Community 22 - "캔버스 옵션과 노드 메뉴"
Cohesion: 0.19
Nodes (10): CanvasOptions, CLEANUP_TOGGLES, DiffMarks, drawnId(), FAR_ZOOM, Pinned, ToggleKey, outermostCollapsedAncestor() (+2 more)

### Community 23 - "연결선 그리기"
Cohesion: 0.23
Nodes (10): 연결선 모양과 움직임, ARROW, arrowD(), EdgeLayer(), EdgeLayerPortal(), EdgeLayerProps, motionOf(), prefersReducedMotion() (+2 more)

### Community 24 - "미들웨어와 로그인 경로"
Cohesion: 0.21
Nodes (8): authConfig, { auth }, config, authDecision, isPublicPath(), PUBLIC, next-auth, Session

### Community 25 - "연결선 개발용 화면"
Cohesion: 0.22
Nodes (11): ALB, EdgePanels(), n(), Panel, PanelEdge, PANELS, Pt, WAS1() (+3 more)

### Community 26 - "설명 모양·길이·서명"
Cohesion: 0.23
Nodes (10): Task 4: 서버 설명 생성, attrText(), endpointOf(), fnv1a(), LIMITS, overLimit(), signatureOf(), TermCandidate (+2 more)

### Community 27 - "설명 API"
Cohesion: 0.21
Nodes (9): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+1 more)

### Community 28 - "흐름 애니메이션"
Cohesion: 0.26
Nodes (11): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+3 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.20
Nodes (10): Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명, Task 6: 설명 패널 화면, Task 7: 설명 큐와 연결, Task 8: 용어 사전 화면, Task 9: 가짜 AI·smoke·E2E (+2 more)

### Community 30 - "Qwen 클라이언트"
Cohesion: 0.36
Nodes (6): abortError(), ChatMessage, createQwenClient(), attempt(), isRetryable(), RETRY_DELAYS

### Community 31 - "겹침 검사"
Cohesion: 0.39
Nodes (7): GROUP_PAD, circleHitsRect(), findOverlaps(), grow(), intersects(), PAIR_BADGE_OFFSET, strictlyInside()

### Community 32 - "Clef 호출과 동시성"
Cohesion: 0.50
Nodes (8): abortError(), createClefClient(), acquire(), classifyIntent(), decide(), post(), release(), run()

### Community 33 - "글자 폭 계산"
Cohesion: 0.60
Nodes (5): charWidth(), isWide(), textWidth(), truncate(), WIDE

### Community 34 - "3C-1단계 계획"
Cohesion: 0.40
Nodes (4): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus

### Community 35 - "구성도 상태 타입"
Cohesion: 0.50
Nodes (3): DiagramState, DiagramWorkspaceProps, UseExplanationsInput

## Knowledge Gaps
- **165 isolated node(s):** `TextPatch`, `Mode`, `Pinned`, `Draft`, `FieldKey` (+160 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 200 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `구성도 상태 타입` to `서버 액션과 작업 화면`, `표시 그래프와 버전 비교`, `DB 스키마와 인증`, `가정과 대화 패널 UI`, `오른쪽 패널과 설명 화면`, `대화 이벤트와 빠진 정보 체크리스트`, `명령 적용과 샘플`, `대화 파이프라인과 저장`, `프롬프트와 구성 패턴`, `설명 생성과 품질 검사`, `캔버스 이벤트`, `경고 규칙과 점검`, `설명 요청 차례`, `캔버스 옵션과 노드 메뉴`, `설명 모양·길이·서명`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `InfraSketch 설계 문서` connect `설계 문서와 계획` to `환경 변수와 AI 상태 점검`, `가정과 대화 패널 UI`, `연결선 그리기`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `파일 구조` connect `3C-1 계획 작업 목록` to `대화 파이프라인과 저장`, `용어 사전 저장과 시드`, `3C-1단계 계획`, `설명 모양·길이·서명`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `TextPatch`, `Mode`, `Pinned` to the rest of the system?**
  _165 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `서버 액션과 작업 화면` be split into smaller, more focused modules?**
  _Cohesion score 0.051287128712871284 - nodes in this community are weakly interconnected._
- **Should `DB 스키마와 인증` be split into smaller, more focused modules?**
  _Cohesion score 0.09098639455782313 - nodes in this community are weakly interconnected._
- **Should `가정과 대화 패널 UI` be split into smaller, more focused modules?**
  _Cohesion score 0.09246088193456614 - nodes in this community are weakly interconnected._