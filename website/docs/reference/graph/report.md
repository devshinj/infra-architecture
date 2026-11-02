---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1114 nodes · 2871 edges · 49 communities (47 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 97 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `36bc8f27`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- (app)/actions.ts
- domain/warnings.ts
- 연결선 구간 묶음
- schema.ts
- ChatPanel.tsx
- prompt.ts
- 설계 문서와 계획
- MissingChecklist.tsx
- layout.ts
- ask.ts
- 명령 적용과 샘플
- pipeline.ts
- deps.ts
- 설명 생성과 품질 검사
- clef.ts
- createClefClient
- SessionPicker.tsx
- chat/warnings.ts
- 라우트 재수출
- catalog.ts
- Canvas.tsx
- 연결선 그리기
- ref_react
- 연결선 개발용 화면
- Review Focus
- ask/route.ts
- 흐름 애니메이션
- 3C-1 계획 작업 목록
- useSessions.ts
- useExplanations.ts
- normalize.ts
- NodeInfo.tsx
- FlyLayer.tsx
- Explanation.tsx
- DiagramWorkspace.tsx
- InfoCard.tsx
- MentionInput
- NodeCard.tsx
- Legend.tsx
- commands.ts
- domain/assumptions.ts
- domain/explain.ts
- [sessionId]/route.ts
- Review Focus
- qwen.ts
- missing.ts
- intent.ts
- SkipTally
- createThinkStripper

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 37 edges
2. `DiagramWorkspace()` - 37 edges
3. `InfraSketch 설계 문서` - 34 edges
4. `getOwnedDiagram()` - 33 edges
5. `lockedTurn()` - 26 edges
6. `explainTarget()` - 24 edges
7. `Flow()` - 23 edges
8. `ValidationError` - 22 edges
9. `auth` - 22 edges
10. `Sidebar()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Task 7: 대화창 — 말풍선과 진행 카드` --references--> `messagesToLines()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/ui/chat/lines.ts
- `Task 1: 세션 저장` --references--> `listMessages()`  [INFERRED]
  docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md → src/server/chat/messages.ts
- `Task 2: 용어 사전 시드와 서버 함수` --references--> `NotFoundError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 4: 서버 설명 생성` --references--> `NotFoundError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 2: 용어 사전 시드와 서버 함수` --references--> `ValidationError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (49 total, 2 thin omitted)

### Community 0 - "(app)/actions.ts"
Cohesion: 0.05
Nodes (104): ActionResult, clearPinnedAction(), confirmAssumptionAction(), createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction() (+96 more)

### Community 1 - "domain/warnings.ts"
Cohesion: 0.18
Nodes (16): categoryOf(), NodeKind, DNode, Edge, WarningLevel, ancestorKinds(), DATA_KINDS, evaluateRules() (+8 more)

### Community 2 - "연결선 구간 묶음"
Cohesion: 0.21
Nodes (18): 연결선 모양과 움직임, assignStarts(), buildSegmentBundles(), buildSegs(), InEdge, normalize(), Piece, piecesOf() (+10 more)

### Community 3 - "schema.ts"
Cohesion: 0.08
Nodes (32): LoginPage(), ResetRequestPage(), ResetPasswordPage(), SignupPage(), metadata, suit, signIn, db (+24 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.17
Nodes (17): Block, BUILD_STEPS, CardView(), ChatPanel(), Check(), CHIP_KINDS, Dots(), EXAMPLES (+9 more)

### Community 5 - "prompt.ts"
Cohesion: 0.10
Nodes (23): Pattern, patternPromptBlock(), PATTERNS, ancestorsOf(), ANSWER_PROMPT, ASK_PROMPT, buildExplainMessages(), buildMessages() (+15 more)

### Community 6 - "설계 문서와 계획"
Cohesion: 0.09
Nodes (27): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전 (+19 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.16
Nodes (14): MissingItem, Block, blocksOf(), ChecklistDraft, ChecklistDrafts, ChecklistExpanded, Chevron(), Draft (+6 more)

### Community 8 - "layout.ts"
Cohesion: 0.05
Nodes (62): FlowProps, buildDisplayGraph(), defaultDisplayOptions(), DisplayGraph, DisplayGroup, DisplayOptions, initialCollapsed(), isBus() (+54 more)

### Community 9 - "ask.ts"
Cohesion: 0.24
Nodes (15): Task 2: 질문 차례(서버), AskArgs, askInSession(), HANDOFF_REPLY, hasNode(), lockedAsk(), runAskTurn(), ChatEvent (+7 more)

### Community 10 - "명령 적용과 샘플"
Cohesion: 0.05
Nodes (47): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus, Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저) (+39 more)

### Community 11 - "pipeline.ts"
Cohesion: 0.17
Nodes (18): parseCommand(), AI_UNAVAILABLE_MESSAGE, guardEmit(), HISTORY_FETCH, HISTORY_REPLY, KNOWN_OPS, LAYOUT_REPLY, lockedTurn() (+10 more)

### Community 12 - "deps.ts"
Cohesion: 0.27
Nodes (6): Qwen URL 정규화, env, envSchema, parseEnv(), llmConfig, normalizeQwenBaseUrl()

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.11
Nodes (27): ExplanationTargetKind, codePoints(), dbRepo, DepsInput, Draft, draftOf(), easeScore(), EdgeDraft (+19 more)

### Community 14 - "clef.ts"
Cohesion: 0.18
Nodes (9): ClefAnswer, ClefAnswers, ClefHttpError, EXPLAIN_SCORE_QUESTION, INTENT_QUESTION, INTENTS, RESTART_DELAYS, RunOpts (+1 more)

### Community 15 - "createClefClient"
Cohesion: 0.50
Nodes (8): abortError(), createClefClient(), acquire(), classifyIntent(), decide(), post(), release(), run()

### Community 17 - "SessionPicker.tsx"
Cohesion: 0.33
Nodes (8): Chevron(), pad(), sessionName(), SessionPicker(), SessionPickerProps, when(), NEW_SESSION, SessionKey

### Community 18 - "chat/warnings.ts"
Cohesion: 0.15
Nodes (20): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 3: 대화 차례에 점검 단계 넣기, Task 4: "의도된 구성" 저장, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, ChatDeps (+12 more)

### Community 20 - "catalog.ts"
Cohesion: 0.25
Nodes (6): PATHS, Category, DATA, GUARD, NodeKindDef, SERVER

### Community 22 - "Canvas.tsx"
Cohesion: 0.06
Nodes (44): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, Canvas(), CanvasOptions, CanvasProps, DiffMarks, drawnId(), FAR_ZOOM, Flow() (+36 more)

### Community 23 - "연결선 그리기"
Cohesion: 0.19
Nodes (13): Task 2: 마우스 강조·흐리기, ARROW, arrowD(), EdgeLayer(), EdgeLayerPortal(), EdgeLayerProps, motionOf(), prefersReducedMotion() (+5 more)

### Community 24 - "ref_react"
Cohesion: 0.06
Nodes (35): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+27 more)

### Community 25 - "연결선 개발용 화면"
Cohesion: 0.18
Nodes (14): ALB, EdgePanels(), n(), Panel, PanelEdge, PanelNode, PANELS, PanelView() (+6 more)

### Community 26 - "Review Focus"
Cohesion: 0.25
Nodes (7): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), Task 5: E2E — 노드 질문 흐름, 실행 순서

### Community 27 - "ask/route.ts"
Cohesion: 0.14
Nodes (15): BodySchema, dynamic, json(), POST(), runtime, BodySchema, dynamic, POST() (+7 more)

### Community 28 - "흐름 애니메이션"
Cohesion: 0.26
Nodes (11): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+3 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.15
Nodes (12): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+4 more)

### Community 30 - "useSessions.ts"
Cohesion: 0.11
Nodes (29): MessageRole, Warning, MessageMeta, NODE_GONE_MESSAGE, keepsCard(), messagesToLines(), Row, summaryText() (+21 more)

### Community 32 - "useExplanations.ts"
Cohesion: 0.21
Nodes (16): Task 2: 용어 사전 시드와 서버 함수, normalizeTerm(), pickTerm(), termCandidates(), addAiTerm(), findTerm(), ExplanationView, fresh() (+8 more)

### Community 33 - "normalize.ts"
Cohesion: 0.31
Nodes (8): DROP_NULL, flattenAttr(), HAS_ATTRS, ID_FIELDS, isPlainObject(), NEEDS_PARENT, normalizeAiCommand(), normalizeId()

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.15
Nodes (16): CategoryIcon(), isEmpty(), AskNode(), AskNodeProps, CautionProps, Cautions(), edgeKindName(), Fields() (+8 more)

### Community 35 - "FlyLayer.tsx"
Cohesion: 0.15
Nodes (13): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+5 more)

### Community 37 - "Explanation.tsx"
Cohesion: 0.23
Nodes (15): EdgeExplanation, NodeExplanation, ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), ExplanationProps, NodeBody() (+7 more)

### Community 38 - "DiagramWorkspace.tsx"
Cohesion: 0.09
Nodes (21): ChatPanelProps, ELSEWHERE_BUSY, LlmHealth, hasId(), Mode, NO_SESSIONS, Pinned, unionState() (+13 more)

### Community 39 - "InfoCard.tsx"
Cohesion: 0.22
Nodes (6): CardMeasure, Chevron(), Count(), InfoCard(), InfoCardProps, LEVEL_LABEL

### Community 40 - "MentionInput"
Cohesion: 0.19
Nodes (7): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), Mention, MentionInput, MentionInputHandle, MentionInputProps, mentionToken()

### Community 41 - "NodeCard.tsx"
Cohesion: 0.24
Nodes (9): GroupBox(), GroupBoxData, isKeyboardFocus(), NameTooltip(), useNameTooltip(), NodeCard(), nodeTypes, GROUP_KINDS (+1 more)

### Community 42 - "Legend.tsx"
Cohesion: 0.19
Nodes (11): EDGE_KINDS, Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), legendPlacement() (+3 more)

### Community 43 - "commands.ts"
Cohesion: 0.13
Nodes (11): attrs, Command, COMMAND_OPS, commandSchema, edgeKind, groupKind, id, nodeKind (+3 more)

### Community 44 - "domain/assumptions.ts"
Cohesion: 0.22
Nodes (10): 가정 목록 (구조 결정), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage(), STRUCTURAL_KEYS, Assumption, AssumptionChips(), AssumptionChipsProps (+2 more)

### Community 45 - "domain/explain.ts"
Cohesion: 0.21
Nodes (11): Task 4: 서버 설명 생성, Task 7: 설명 큐와 연결, attrText(), endpointOf(), fnv1a(), LIMITS, overLimit(), signatureOf() (+3 more)

### Community 47 - "[sessionId]/route.ts"
Cohesion: 0.17
Nodes (14): dynamic, GET(), runtime, SessionIdSchema, DiagramPage(), chatSessions, listMessages(), GENERIC_ERROR_MESSAGE (+6 more)

### Community 49 - "Review Focus"
Cohesion: 0.20
Nodes (9): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 5: 주의 항목 바로 가기, Task 6: E2E — 3E 흐름 (+1 more)

### Community 51 - "qwen.ts"
Cohesion: 0.26
Nodes (9): Task 5: 설명 API, defaultChatDeps(), setChatDepsForTest(), abortError(), ChatMessage, createQwenClient(), attempt(), isRetryable() (+1 more)

### Community 53 - "missing.ts"
Cohesion: 0.29
Nodes (10): 빠진 정보 채우기, 노드 종류 목록 (kind·group_kind·edge_kind), NODE_KINDS, computeMissing(), FIELD_LABELS, labelOf(), missingReminder(), requiredKeysFor() (+2 more)

### Community 54 - "intent.ts"
Cohesion: 0.50
Nodes (4): isAssumptionChangeMessage(), resolveIntent(), Intent, INTENT_MIN_CONFIDENCE

### Community 56 - "createThinkStripper"
Cohesion: 0.52
Nodes (5): createJsonlParser(), isCompleteJson(), scanLine(), createThinkStripper(), partialTagLen()

## Knowledge Gaps
- **240 isolated node(s):** `TextPatch`, `GlossarySeedEntry`, `Attrs`, `TextField`, `Draft` (+235 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 285 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `(app)/actions.ts` to `domain/warnings.ts`, `schema.ts`, `prompt.ts`, `MissingChecklist.tsx`, `layout.ts`, `ask.ts`, `명령 적용과 샘플`, `pipeline.ts`, `설명 생성과 품질 검사`, `chat/warnings.ts`, `Canvas.tsx`, `useSessions.ts`, `useExplanations.ts`, `NodeInfo.tsx`, `DiagramWorkspace.tsx`, `InfoCard.tsx`, `domain/assumptions.ts`, `domain/explain.ts`, `missing.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` connect `명령 적용과 샘플` to `(app)/actions.ts`, `commands.ts`, `ChatPanel.tsx`, `MissingChecklist.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `TextPatch`, `GlossarySeedEntry`, `Attrs` to the rest of the system?**
  _240 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `(app)/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05067064083457526 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08082706766917293 - nodes in this community are weakly interconnected._
- **Should `prompt.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10333333333333333 - nodes in this community are weakly interconnected._