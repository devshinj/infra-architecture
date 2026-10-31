---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 974 nodes · 2458 edges · 38 communities (35 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 74 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2b8ad2aa`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 서버 액션과 작업 화면
- 표시 그래프와 버전 비교
- 연결선 구간 묶음
- DB 스키마와 인증
- ChatPanel.tsx
- 오른쪽 패널과 설명 화면
- 설계 문서와 계획
- MissingChecklist.tsx
- ELK 자동 배치와 꺾은선
- 환경 변수와 AI 상태 점검
- 명령 적용과 샘플
- pipeline.ts
- 프롬프트와 구성 패턴
- 설명 생성과 품질 검사
- useChatTurn.ts
- 캔버스 이벤트
- Clef 질문과 응답 타입
- 용어 사전 저장과 시드
- 경고 규칙과 점검
- 라우트 재수출
- 노드 카드와 아이콘
- useCamera.ts
- Canvas.tsx
- 연결선 그리기
- ref_react
- 연결선 개발용 화면
- 설명 모양·길이·서명
- chat/route.ts
- 흐름 애니메이션
- 3C-1 계획 작업 목록
- deps.ts
- 겹침 검사
- Clef 호출과 동시성
- normalize.ts
- easeScore
- ExplainRepo
- NodeMenu
- SkipTally

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 36 edges
2. `InfraSketch 설계 문서` - 34 edges
3. `DiagramWorkspace()` - 33 edges
4. `getOwnedDiagram()` - 27 edges
5. `lockedTurn()` - 24 edges
6. `explainTarget()` - 23 edges
7. `Sidebar()` - 21 edges
8. `Flow()` - 20 edges
9. `ValidationError` - 19 edges
10. `auth` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙` --references--> `applyCommand()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/domain/apply.ts
- `Task 2: 용어 사전 시드와 서버 함수` --references--> `NotFoundError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 4: 서버 설명 생성` --references--> `NotFoundError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 2: 용어 사전 시드와 서버 함수` --references--> `ValidationError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 5: 설명 API` --references--> `ValidationError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (38 total, 3 thin omitted)

### Community 0 - "서버 액션과 작업 화면"
Cohesion: 0.06
Nodes (97): Task 4: "의도된 구성" 저장, ActionResult, clearPinnedAction(), confirmAssumptionAction(), createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction() (+89 more)

### Community 1 - "표시 그래프와 버전 비교"
Cohesion: 0.15
Nodes (19): FlowProps, buildDisplayGraph(), defaultDisplayOptions(), DisplayGraph, DisplayGroup, DisplayOptions, initialCollapsed(), isBus() (+11 more)

### Community 2 - "연결선 구간 묶음"
Cohesion: 0.21
Nodes (18): 연결선 모양과 움직임, assignStarts(), buildSegmentBundles(), buildSegs(), InEdge, normalize(), Piece, piecesOf() (+10 more)

### Community 3 - "DB 스키마와 인증"
Cohesion: 0.12
Nodes (20): db, accounts, diagrams, diagramVersions, explanations, GlossarySource, messages, passwordResetTokens (+12 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.06
Nodes (37): 노드 참조 (@WAS#1 칩), prefersReducedMotion(), Block, BUILD_STEPS, CardView(), ChatPanel(), ChatPanelProps, Check() (+29 more)

### Community 5 - "오른쪽 패널과 설명 화면"
Cohesion: 0.05
Nodes (56): EdgeExplanation, NodeExplanation, isEmpty(), DiagramState, hasId(), Mode, Pinned, unionState() (+48 more)

### Community 6 - "설계 문서와 계획"
Cohesion: 0.08
Nodes (32): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전 (+24 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.07
Nodes (36): 가정 목록 (구조 결정), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage(), STRUCTURAL_KEYS, computeMissing(), FIELD_LABELS, labelOf() (+28 more)

### Community 8 - "ELK 자동 배치와 꺾은선"
Cohesion: 0.12
Nodes (24): elbowRoute(), Pt, BASE_OPTIONS, elk, ElkRun, EMPTY_GROUP, LaidOutEdge, LaidOutGroup (+16 more)

### Community 9 - "환경 변수와 AI 상태 점검"
Cohesion: 0.36
Nodes (5): env, envSchema, parseEnv(), llmConfig, normalizeQwenBaseUrl()

### Community 10 - "명령 적용과 샘플"
Cohesion: 0.09
Nodes (30): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus, applyCommand(), applyCommands(), ApplyResult, endpointOk() (+22 more)

### Community 11 - "pipeline.ts"
Cohesion: 0.18
Nodes (17): parseCommand(), createMessage(), AI_UNAVAILABLE_MESSAGE, HISTORY_REPLY, KNOWN_OPS, LAYOUT_REPLY, lockedTurn(), opName() (+9 more)

### Community 12 - "프롬프트와 구성 패턴"
Cohesion: 0.12
Nodes (20): Pattern, patternPromptBlock(), PATTERNS, ancestorsOf(), ANSWER_PROMPT, buildExplainMessages(), buildMessages(), describeEndpoint() (+12 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.14
Nodes (20): codePoints(), dbRepo, DepsInput, Draft, draftOf(), EdgeDraft, EXPLAIN_FAIL_MESSAGE, ExplainResult (+12 more)

### Community 14 - "useChatTurn.ts"
Cohesion: 0.05
Nodes (46): Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저), Task 11: 빈 구성도 시작 경험 — 인사말·가이드·예시 질문 (사용자 추가 요청, 2026-10-30), Task 12: 대화에서 캔버스로 날아가는 빛점 (사용자 추가 요청, 2026-10-30), Task 13: 도구 모음 정리와 스크롤 정리 (사용자 추가 요청, 2026-10-30), Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙 (+38 more)

### Community 15 - "캔버스 이벤트"
Cohesion: 0.17
Nodes (6): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, CanvasProps, drawnId(), Flow(), Insets, warningsByNode()

### Community 16 - "Clef 질문과 응답 타입"
Cohesion: 0.18
Nodes (12): isAssumptionChangeMessage(), resolveIntent(), ClefAnswer, ClefAnswers, EXPLAIN_SCORE_QUESTION, Intent, INTENT_MIN_CONFIDENCE, INTENT_QUESTION (+4 more)

### Community 17 - "용어 사전 저장과 시드"
Cohesion: 0.18
Nodes (13): Task 2: 용어 사전 시드와 서버 함수, glossaryTerms, normalizeTerm(), pickTerm(), termCandidates(), GLOSSARY_SEED, GlossarySeedEntry, addAiTerm() (+5 more)

### Community 18 - "경고 규칙과 점검"
Cohesion: 0.11
Nodes (32): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 3: 대화 차례에 점검 단계 넣기, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, categoryOf(), NodeKind (+24 more)

### Community 20 - "노드 카드와 아이콘"
Cohesion: 0.13
Nodes (17): PanelNode, GroupBox(), GroupBoxData, CategoryIcon(), PATHS, NodeCard(), NodeCardData, NodeVisualState (+9 more)

### Community 21 - "useCamera.ts"
Cohesion: 0.17
Nodes (14): CameraInput, FINAL_FIT_DURATION, fitViewport(), FOCUS_DURATION, FOCUS_MIN_ZOOM, FOCUS_SIDE_MIN, focusViewport(), idsKey() (+6 more)

### Community 22 - "Canvas.tsx"
Cohesion: 0.17
Nodes (20): Canvas(), CanvasOptions, DiffMarks, FAR_ZOOM, Icon(), IconArrange(), IconChevron(), IconEye() (+12 more)

### Community 23 - "연결선 그리기"
Cohesion: 0.26
Nodes (9): ARROW, arrowD(), EdgeLayer(), EdgeLayerPortal(), EdgeLayerProps, motionOf(), prefersReducedMotion(), Pt (+1 more)

### Community 24 - "ref_react"
Cohesion: 0.05
Nodes (49): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+41 more)

### Community 25 - "연결선 개발용 화면"
Cohesion: 0.21
Nodes (12): ALB, EdgePanels(), n(), Panel, PanelEdge, PANELS, PanelView(), Pt (+4 more)

### Community 26 - "설명 모양·길이·서명"
Cohesion: 0.21
Nodes (11): Task 4: 서버 설명 생성, Task 7: 설명 큐와 연결, attrText(), endpointOf(), fnv1a(), LIMITS, overLimit(), signatureOf() (+3 more)

### Community 27 - "chat/route.ts"
Cohesion: 0.16
Nodes (12): BodySchema, dynamic, encoder, line(), Outcome, POST(), runtime, ChatEvent (+4 more)

### Community 28 - "흐름 애니메이션"
Cohesion: 0.26
Nodes (11): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+3 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.17
Nodes (11): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+3 more)

### Community 30 - "deps.ts"
Cohesion: 0.18
Nodes (13): Task 5: 설명 API, defaultChatDeps(), setChatDepsForTest(), ChatDeps, ExplainDeps, ClefClient, abortError(), ChatMessage (+5 more)

### Community 31 - "겹침 검사"
Cohesion: 0.39
Nodes (7): GROUP_PAD, circleHitsRect(), findOverlaps(), grow(), intersects(), PAIR_BADGE_OFFSET, strictlyInside()

### Community 32 - "Clef 호출과 동시성"
Cohesion: 0.36
Nodes (9): abortError(), ClefHttpError, createClefClient(), acquire(), classifyIntent(), decide(), post(), release() (+1 more)

### Community 33 - "normalize.ts"
Cohesion: 0.38
Nodes (6): DROP_NULL, flattenAttr(), HAS_ATTRS, isPlainObject(), NEEDS_PARENT, normalizeAiCommand()

### Community 34 - "easeScore"
Cohesion: 0.40
Nodes (4): Task 9: 가짜 AI·smoke·E2E, easeScore(), scoredText(), scoreValue()

### Community 35 - "ExplainRepo"
Cohesion: 0.24
Nodes (4): ExplanationTargetKind, ExplainRepo, AiTermInput, GlossaryRow

## Knowledge Gaps
- **209 isolated node(s):** `TextPatch`, `Draft`, `FieldKey`, `Dialog`, `MenuAction` (+204 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 250 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `오른쪽 패널과 설명 화면` to `서버 액션과 작업 화면`, `표시 그래프와 버전 비교`, `DB 스키마와 인증`, `ExplainRepo`, `MissingChecklist.tsx`, `명령 적용과 샘플`, `pipeline.ts`, `프롬프트와 구성 패턴`, `설명 생성과 품질 검사`, `useChatTurn.ts`, `캔버스 이벤트`, `경고 규칙과 점검`, `Canvas.tsx`, `설명 모양·길이·서명`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Why does `InfraSketch 설계 문서` connect `설계 문서와 계획` to `연결선 구간 묶음`, `ChatPanel.tsx`, `MissingChecklist.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `applyCommand()` connect `명령 적용과 샘플` to `서버 액션과 작업 화면`, `pipeline.ts`, `오른쪽 패널과 설명 화면`, `useChatTurn.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `TextPatch`, `Draft`, `FieldKey` to the rest of the system?**
  _209 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `서버 액션과 작업 화면` be split into smaller, more focused modules?**
  _Cohesion score 0.05558143145474305 - nodes in this community are weakly interconnected._
- **Should `DB 스키마와 인증` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._
- **Should `ChatPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05660377358490566 - nodes in this community are weakly interconnected._