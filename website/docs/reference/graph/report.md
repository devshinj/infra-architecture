---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1331 nodes · 3455 edges · 59 communities (57 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 106 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ee39a16`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Sidebar.tsx
- chat/warnings.ts
- segments.ts
- schema.ts
- ChatPanel.tsx
- prompt.ts
- 설계 문서와 계획
- MissingChecklist.tsx
- layout.ts
- types.ts
- apply.ts
- ask.ts
- exportImage.ts
- 설명 생성과 품질 검사
- display.ts
- InfoCard.tsx
- useCamera.ts
- SessionPicker.tsx
- domain/explain.ts
- 라우트 재수출
- DiagramWorkspace.tsx
- missing.ts
- Canvas.tsx
- 연결선 그리기
- auth
- 연결선 개발용 화면
- NodeMenu
- ask/route.ts
- Flow
- 3C-1 계획 작업 목록
- useChatTurn.ts
- Review Focus
- useExplanations.ts
- normalize.ts
- NodeInfo.tsx
- FlyLayer.tsx
- Explanation.tsx
- ExportMenu.tsx
- DiagramState
- [sessionId]/route.ts
- MentionInput
- catalog.ts
- text.ts
- Legend.tsx
- clef.ts
- samples.ts
- Review Focus
- (app)/actions.ts
- Layout
- motion.ts
- GlossaryPage.tsx
- SessionPickerProps
- ChatPanelProps
- schema.ts
- pipeline.ts
- (app)/actions.ts
- domain/warnings.ts
- auth
- deps.ts

## God Nodes (most connected - your core abstractions)
1. `DiagramWorkspace()` - 39 edges
2. `DiagramState` - 37 edges
3. `getOwnedDiagram()` - 36 edges
4. `InfraSketch 설계 문서` - 34 edges
5. `Flow()` - 31 edges
6. `ValidationError` - 29 edges
7. `lockedTurn()` - 28 edges
8. `Sidebar()` - 27 edges
9. `explainTarget()` - 24 edges
10. `auth` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Task 1: 세션 저장` --references--> `listMessages()`  [INFERRED]
  docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md → src/server/chat/messages.ts
- `Task 7: 대화창 — 말풍선과 진행 카드` --references--> `messagesToLines()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/ui/chat/lines.ts
- `Task 3: 대화 차례에 점검 단계 넣기` --references--> `ChatEvent`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/server/chat/events.ts
- `Task 2: 서버 점검 — Clef 판정과 Qwen 문구` --references--> `Warning`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/domain/types.ts
- `Task 2: 질문 차례(서버)` --references--> `MessageMeta`  [INFERRED]
  docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md → src/server/chat/events.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (59 total, 2 thin omitted)

### Community 0 - "Sidebar.tsx"
Cohesion: 0.15
Nodes (22): LogoMark(), GENERIC_ERROR, NameDialog, ShellValue, deleteMessage(), diagramPath(), IconBook(), IconClose() (+14 more)

### Community 1 - "chat/warnings.ts"
Cohesion: 0.16
Nodes (21): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 3: 대화 차례에 점검 단계 넣기, Task 4: "의도된 구성" 저장, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, buildWarningMessages() (+13 more)

### Community 2 - "segments.ts"
Cohesion: 0.22
Nodes (15): BASE_SPEED, buildSegs(), InEdge, normalize(), Piece, piecesOf(), pk(), Pt (+7 more)

### Community 3 - "schema.ts"
Cohesion: 0.05
Nodes (68): Qwen URL 정규화, GET(), AuthField(), AuthSubmit(), Props, FieldErrors, Options, useAuthForm() (+60 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.15
Nodes (19): Block, BUILD_STEPS, CardView(), ChatPanel(), Check(), CHIP_KINDS, Dots(), ELSEWHERE_BUSY (+11 more)

### Community 5 - "prompt.ts"
Cohesion: 0.10
Nodes (24): Pattern, patternPromptBlock(), PATTERNS, ancestorsOf(), ANSWER_PROMPT, ASK_PROMPT, buildExplainMessages(), buildMessages() (+16 more)

### Community 6 - "설계 문서와 계획"
Cohesion: 0.07
Nodes (40): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전 (+32 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.16
Nodes (14): MissingItem, Block, blocksOf(), ChecklistDraft, ChecklistDrafts, ChecklistExpanded, Chevron(), Draft (+6 more)

### Community 8 - "layout.ts"
Cohesion: 0.09
Nodes (35): elbowRoute(), Pt, azChipWidth(), azOf(), BASE_OPTIONS, CONTENT_WIDTH, crossings(), elk (+27 more)

### Community 9 - "types.ts"
Cohesion: 0.22
Nodes (10): 가정 목록 (구조 결정), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage(), STRUCTURAL_KEYS, Assumption, AssumptionChips(), AssumptionChipsProps (+2 more)

### Community 10 - "apply.ts"
Cohesion: 0.08
Nodes (32): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus, Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저) (+24 more)

### Community 11 - "ask.ts"
Cohesion: 0.15
Nodes (26): Task 2: 질문 차례(서버), POST(), AskArgs, askInSession(), HANDOFF_REPLY, hasNode(), lockedAsk(), runAskTurn() (+18 more)

### Community 12 - "exportImage.ts"
Cohesion: 0.12
Nodes (21): buildStage(), CHROME, decodeSvgDataUrl(), diagramBounds(), download(), EdgeLabel, edgeLabels(), EXPORT_PADDING (+13 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.11
Nodes (28): explanations, ExplanationTargetKind, codePoints(), dbRepo, DepsInput, Draft, draftOf(), easeScore() (+20 more)

### Community 14 - "display.ts"
Cohesion: 0.36
Nodes (7): drawnId(), buildDisplayGraph(), DisplayGroup, DisplayOptions, isBus(), outermostCollapsedAncestor(), Group

### Community 15 - "InfoCard.tsx"
Cohesion: 0.19
Nodes (8): Task 5: 주의 항목 바로 가기, mergeWarnings(), CardMeasure, Chevron(), Count(), InfoCard(), InfoCardProps, LEVEL_LABEL

### Community 16 - "useCamera.ts"
Cohesion: 0.12
Nodes (21): CameraInput, EDGE_GAP_PX, FINAL_FIT_DURATION, FitOptions, fitViewport(), FOCUS_DURATION, FOCUS_MIN_ZOOM, FOCUS_SIDE_MIN (+13 more)

### Community 17 - "SessionPicker.tsx"
Cohesion: 0.15
Nodes (17): Action, byRecent(), Chevron(), MAIN_LABEL, menuRootId(), MORE_LABEL, pad(), Plus() (+9 more)

### Community 18 - "domain/explain.ts"
Cohesion: 0.19
Nodes (11): Task 4: 서버 설명 생성, attrText(), endpointOf(), fnv1a(), LIMITS, overLimit(), signatureOf(), TermCandidate (+3 more)

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.11
Nodes (22): defaultDisplayOptions(), initialCollapsed(), hasId(), MOBILE_VIEW_KEY, Mode, NO_SESSIONS, optionsFor(), Pinned (+14 more)

### Community 21 - "missing.ts"
Cohesion: 0.27
Nodes (11): NodeKind, computeMissing(), FIELD_LABELS, labelOf(), requiredKeysFor(), requiredKeysForEdge(), requiredKeysForNode(), Attrs (+3 more)

### Community 22 - "Canvas.tsx"
Cohesion: 0.10
Nodes (26): Canvas(), CanvasOptions, DiffMarks, FAR_ZOOM, Icon(), IconArrange(), IconChevron(), IconEye() (+18 more)

### Community 23 - "연결선 그리기"
Cohesion: 0.13
Nodes (19): Task 2: 마우스 강조·흐리기, 연결선 모양과 움직임, ARROW, arrowD(), EdgeLayer(), EdgeLayerPortal(), EdgeLayerProps, motionOf() (+11 more)

### Community 24 - "auth"
Cohesion: 0.15
Nodes (17): AppLayout(), Home(), lastActiveDiagram(), listProjects(), COMPACT_QUERY, CreateButton(), CreateRequest, extentOf() (+9 more)

### Community 25 - "연결선 개발용 화면"
Cohesion: 0.17
Nodes (15): ALB, EdgePanels(), n(), Panel, PanelEdge, PanelNode, PANELS, PanelView() (+7 more)

### Community 26 - "NodeMenu"
Cohesion: 0.48
Nodes (3): NodeMenu(), NodeMenuProps, placeMenu()

### Community 27 - "ask/route.ts"
Cohesion: 0.10
Nodes (23): BodySchema, dynamic, json(), maxDuration, POST(), runtime, BodySchema, dynamic (+15 more)

### Community 28 - "Flow"
Cohesion: 0.10
Nodes (16): canvasAriaLabels(), DIRECTION, zoneDescription(), CanvasProps, Flow(), ZoomVar(), CONE_SLACK, gap() (+8 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.13
Nodes (14): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+6 more)

### Community 30 - "useChatTurn.ts"
Cohesion: 0.06
Nodes (48): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, attrs, Command, COMMAND_OPS, commandSchema, edgeKind, groupKind, id (+40 more)

### Community 31 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 6: E2E — 3E 흐름, 실행 순서

### Community 32 - "useExplanations.ts"
Cohesion: 0.23
Nodes (15): Task 2: 용어 사전 시드와 서버 함수, normalizeTerm(), pickTerm(), termCandidates(), addAiTerm(), findTerm(), ExplanationView, fresh() (+7 more)

### Community 33 - "normalize.ts"
Cohesion: 0.31
Nodes (8): DROP_NULL, flattenAttr(), HAS_ATTRS, ID_FIELDS, isPlainObject(), NEEDS_PARENT, normalizeAiCommand(), normalizeId()

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.15
Nodes (15): isEmpty(), AskNode(), AskNodeProps, CautionProps, Cautions(), edgeKindName(), Fields(), kindName() (+7 more)

### Community 35 - "FlyLayer.tsx"
Cohesion: 0.15
Nodes (13): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+5 more)

### Community 36 - "Explanation.tsx"
Cohesion: 0.19
Nodes (17): EdgeExplanation, NodeExplanation, ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), ExplanationProps, NodeBody() (+9 more)

### Community 37 - "ExportMenu.tsx"
Cohesion: 0.13
Nodes (17): ExportBackground, ExportFormat, LIGHT_BACKGROUND, BACKGROUNDS, EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON, EXPORT_FAILED_MESSAGE (+9 more)

### Community 38 - "DiagramState"
Cohesion: 0.17
Nodes (9): HistoryPanel(), HistoryPanelProps, SOURCE_LABEL, VersionRow, RIGHT_PANEL_BODY_ID, RightPanel(), RightPanelProps, tabIdOf() (+1 more)

### Community 39 - "[sessionId]/route.ts"
Cohesion: 0.23
Nodes (15): Ctx, DELETE(), dynamic, failed(), GET(), guard(), json(), PATCH() (+7 more)

### Community 40 - "MentionInput"
Cohesion: 0.19
Nodes (7): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), Mention, MentionInput, MentionInputHandle, MentionInputProps, mentionToken()

### Community 41 - "catalog.ts"
Cohesion: 0.14
Nodes (16): GroupBox(), GroupBoxData, CategoryIcon(), PATHS, isKeyboardFocus(), NameTooltip(), useNameTooltip(), NodeCard() (+8 more)

### Community 42 - "text.ts"
Cohesion: 0.39
Nodes (8): charWidth(), EXTRA_WIDE_LATIN, isUpper(), isWide(), ratio(), textWidth(), truncate(), WIDE

### Community 43 - "Legend.tsx"
Cohesion: 0.19
Nodes (11): EDGE_KINDS, Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), legendPlacement() (+3 more)

### Community 44 - "clef.ts"
Cohesion: 0.18
Nodes (12): isAssumptionChangeMessage(), resolveIntent(), ClefAnswer, ClefAnswers, EXPLAIN_SCORE_QUESTION, Intent, INTENT_MIN_CONFIDENCE, INTENT_QUESTION (+4 more)

### Community 45 - "samples.ts"
Cohesion: 0.12
Nodes (16): AddEdge, AddGroup, AddNode, AUX_NODE_KINDS, convertSpikeScenario(), EDGE_KIND_MAP, EDGE_KIND_SET, importSample() (+8 more)

### Community 46 - "Review Focus"
Cohesion: 0.25
Nodes (7): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), Task 5: E2E — 노드 질문 흐름, 실행 순서

### Community 47 - "(app)/actions.ts"
Cohesion: 0.17
Nodes (29): confirmAssumption(), emptyState(), confirmAssumptionFor(), saveFieldsFor(), setWarningIgnoredFor(), assertUniqueDiagramName(), assertUniqueProjectName(), cleanName() (+21 more)

### Community 48 - "Layout"
Cohesion: 0.24
Nodes (11): FlowProps, DisplayGraph, GROUP_PAD, Layout, circleHitsRect(), findOverlaps(), grow(), intersects() (+3 more)

### Community 49 - "motion.ts"
Cohesion: 0.39
Nodes (8): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), startBundleMotion()

### Community 50 - "GlossaryPage.tsx"
Cohesion: 0.18
Nodes (18): ActionResult, listGlossaryAction(), listTermsAction(), setTermReviewedAction(), updateTermAction(), Glossary(), GlossaryItem, toGlossaryItem() (+10 more)

### Community 51 - "SessionPickerProps"
Cohesion: 0.28
Nodes (4): SessionPickerProps, MoreState, SessionKey, SessionKind

### Community 54 - "schema.ts"
Cohesion: 0.07
Nodes (41): dynamic, GET(), json(), runtime, db, accounts, ChatSessionKind, chatSessions (+33 more)

### Community 55 - "pipeline.ts"
Cohesion: 0.12
Nodes (18): isStructural(), parseCommand(), abortError(), AI_UNAVAILABLE_MESSAGE, HISTORY_FETCH, HISTORY_REPLY, KNOWN_OPS, LAYOUT_REPLY (+10 more)

### Community 56 - "(app)/actions.ts"
Cohesion: 0.15
Nodes (33): clearPinnedAction(), confirmAssumptionAction(), createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction(), getVersionAction() (+25 more)

### Community 58 - "domain/warnings.ts"
Cohesion: 0.21
Nodes (13): categoryOf(), DiagramState, WarningLevel, ancestorKinds(), DATA_KINDS, evaluateRules(), make(), PUBLIC_GROUPS (+5 more)

### Community 60 - "auth"
Cohesion: 0.14
Nodes (16): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+8 more)

### Community 62 - "deps.ts"
Cohesion: 0.18
Nodes (13): Task 5: 설명 API, defaultChatDeps(), setChatDepsForTest(), ChatDeps, ExplainDeps, ClefClient, abortError(), ChatMessage (+5 more)

## Knowledge Gaps
- **304 isolated node(s):** `MenuAction`, `MenuItem`, `MenuTarget`, `SidebarProject`, `Scan` (+299 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 356 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `domain/warnings.ts` to `chat/warnings.ts`, `prompt.ts`, `MissingChecklist.tsx`, `layout.ts`, `types.ts`, `apply.ts`, `ask.ts`, `설명 생성과 품질 검사`, `display.ts`, `InfoCard.tsx`, `domain/explain.ts`, `DiagramWorkspace.tsx`, `missing.ts`, `Canvas.tsx`, `Flow`, `useChatTurn.ts`, `useExplanations.ts`, `NodeInfo.tsx`, `DiagramState`, `samples.ts`, `(app)/actions.ts`, `schema.ts`, `pipeline.ts`, `(app)/actions.ts`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `InfraSketch 설계 문서` connect `설계 문서와 계획` to `MentionInput`, `types.ts`, `schema.ts`, `연결선 그리기`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `CanvasProps` connect `Flow` to `useCamera.ts`, `domain/warnings.ts`, `Layout`, `Canvas.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MenuAction`, `MenuItem`, `MenuTarget` to the rest of the system?**
  _304 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0500990099009901 - nodes in this community are weakly interconnected._
- **Should `ChatPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._