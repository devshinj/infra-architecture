---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1598 nodes · 4168 edges · 82 communities (79 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 168 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `81187ef4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Sidebar.tsx
- useFlows
- segments.ts
- FlowPanel.tsx
- ChatPanel.tsx
- prompt.ts
- 설계 문서와 계획
- MissingChecklist.tsx
- layout.ts
- types.ts
- projects.ts
- ask.ts
- exportImage.ts
- 설명 생성과 품질 검사
- display.ts
- InfoCard.tsx
- useCamera.ts
- SessionPicker.tsx
- server/flows.ts
- 라우트 재수출
- DiagramWorkspace.tsx
- missing.ts
- Canvas.tsx
- EdgeLayer.tsx
- auth
- 연결선 개발용 화면
- NodeMenu
- ask/route.ts
- Flow
- 3C-1 계획 작업 목록
- useSessions.ts
- Review Focus
- useExplanations.ts
- normalize.ts
- NodeInfo.tsx
- FlyLayer.tsx
- Explanation.tsx
- ExportMenu.tsx
- DiagramState
- [sessionId]/route.ts
- edgeLabels.ts
- NodeCard.tsx
- text.ts
- Legend.tsx
- clef.ts
- samples.ts
- Review Focus
- (app)/actions.ts
- Layout
- motion.ts
- layoutMetrics.ts
- commands.ts
- ref_react
- GlossaryPage.tsx
- schema.ts
- pipeline.ts
- Rect
- ZoneNameLayer.tsx
- flowSuggest.ts
- ref_zod
- auth
- lines.ts
- deps.ts
- createClefClient
- types.ts
- 2단계 계획: AI 대화
- 구성도 배치 조화 1단계 — 선택 강조와 선 간격
- getOwnedDiagram
- useChatTurn
- 흐름 보기와 망 경계 표시 — 설계
- getSession
- deps.ts
- stacking.ts
- ValidationError
- display.ts
- NODE_KINDS
- explain/route.ts
- Canvas
- suggest/route.ts
- Review Focus
- EdgeLayerProps
- flows/route.ts

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 47 edges
2. `DiagramWorkspace()` - 43 edges
3. `getOwnedDiagram()` - 40 edges
4. `Flow()` - 36 edges
5. `ValidationError` - 34 edges
6. `InfraSketch 설계 문서` - 34 edges
7. `lockedTurn()` - 32 edges
8. `auth` - 28 edges
9. `Sidebar()` - 27 edges
10. `NotFoundError` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인` --references--> `createdAt()`  [INFERRED]
  docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md → src/db/schema.ts
- `Task 1: 세션 저장` --references--> `listMessages()`  [INFERRED]
  docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md → src/server/chat/messages.ts
- `Task 2: 용어 사전 시드와 서버 함수` --references--> `NotFoundError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 4: 서버 설명 생성` --references--> `NotFoundError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 3: 대화 차례에 점검 단계 넣기` --references--> `ChatEvent`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/server/chat/events.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (82 total, 3 thin omitted)

### Community 0 - "Sidebar.tsx"
Cohesion: 0.17
Nodes (20): LogoMark(), ShellValue, deleteMessage(), diagramPath(), IconBook(), IconClose(), IconCollapse(), IconExpand() (+12 more)

### Community 1 - "useFlows"
Cohesion: 0.12
Nodes (17): Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인, confirmFlowAction(), deleteFlowAction(), removeFlowStepAction(), renameFlowAction(), FlowSource, BusyError, byKey() (+9 more)

### Community 2 - "segments.ts"
Cohesion: 0.17
Nodes (21): Task 2: 평소 화면 평행선 16px, 연결선 모양과 움직임, assignStarts(), BASE_SPEED, buildSegmentBundles(), buildSegs(), Bundle, InEdge (+13 more)

### Community 3 - "FlowPanel.tsx"
Cohesion: 0.12
Nodes (14): FlowOrigin, DeleteDialog, Dialog, DialogView(), focusables(), GENERIC_ERROR, NameDialog, RowMenuItem (+6 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.09
Nodes (27): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), Block, BUILD_STEPS, CardView(), ChatPanel(), Check(), CHIP_KINDS (+19 more)

### Community 5 - "prompt.ts"
Cohesion: 0.05
Nodes (62): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 3: 대화 차례에 점검 단계 넣기, Task 4: "의도된 구성" 저장, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, Task 1: 망 영역·망연계 노드·연결 전달물/방향 (+54 more)

### Community 6 - "설계 문서와 계획"
Cohesion: 0.14
Nodes (17): 대화 차례 파이프라인, 이상한 구성 경고, 로그인·회원 (Auth.js Credentials), 자동 배치 (ELK layered), 변경 명령 (add_node·add_edge·set_assumption 등), Clef-Flash 판정 모델, InfraSketch 설계 문서, 설명 패널 (+9 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.13
Nodes (18): CategoryIcon(), PATHS, Category, MissingItem, Block, blocksOf(), ChecklistDraft, ChecklistDrafts (+10 more)

### Community 8 - "layout.ts"
Cohesion: 0.11
Nodes (25): Task 6: 영역 이름 크기 보정과 접힌 상자 폭, azOf(), BASE_OPTIONS, COLLAPSED_MAX_WIDTH, collapsedGroupWidth(), CONTENT_WIDTH, crossings(), elk (+17 more)

### Community 9 - "types.ts"
Cohesion: 0.22
Nodes (10): 가정 목록 (구조 결정), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage(), STRUCTURAL_KEYS, Assumption, AssumptionChips(), AssumptionChipsProps (+2 more)

### Community 10 - "projects.ts"
Cohesion: 0.18
Nodes (22): assertOwnedProject(), assertUniqueDiagramName(), assertUniqueProjectName(), assertUuid(), cleanName(), clip(), coord, copyName() (+14 more)

### Community 11 - "ask.ts"
Cohesion: 0.21
Nodes (17): Task 2: 질문 차례(서버), AskArgs, askInSession(), HANDOFF_REPLY, hasNode(), lockedAsk(), runAskTurn(), ChatEvent (+9 more)

### Community 12 - "exportImage.ts"
Cohesion: 0.12
Nodes (21): 제약, buildStage(), CHROME, decodeSvgDataUrl(), diagramBounds(), download(), EdgeLabel, EXPORT_PADDING (+13 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.10
Nodes (29): explanations, ExplanationTargetKind, overLimit(), cachedNodeExplanation(), codePoints(), dbRepo, DepsInput, Draft (+21 more)

### Community 14 - "display.ts"
Cohesion: 0.18
Nodes (14): FlowProps, DisplayGraph, elbowRoute(), Pt, ExportRequest, Layout, MeasuredView, APPEARING_MS (+6 more)

### Community 15 - "InfoCard.tsx"
Cohesion: 0.19
Nodes (8): Task 5: 주의 항목 바로 가기, mergeWarnings(), CardMeasure, Chevron(), Count(), InfoCard(), InfoCardProps, LEVEL_LABEL

### Community 16 - "useCamera.ts"
Cohesion: 0.12
Nodes (20): CameraInput, EDGE_GAP_PX, FINAL_FIT_DURATION, fitViewport(), FOCUS_DURATION, FOCUS_MIN_ZOOM, FOCUS_SIDE_MIN, focusViewport() (+12 more)

### Community 17 - "SessionPicker.tsx"
Cohesion: 0.14
Nodes (16): Action, byRecent(), Chevron(), MAIN_LABEL, menuRootId(), MORE_LABEL, pad(), Plus() (+8 more)

### Community 18 - "server/flows.ts"
Cohesion: 0.19
Nodes (20): Task 3: 흐름 도메인(모양·검사·끊김), Task 8: "흐름" 탭·지나는 흐름·연동, BOUNDARY_NODE_KINDS, crossesBoundary(), isDirectCrossing(), networkZoneOf(), checkFlow(), crossingNote() (+12 more)

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.11
Nodes (22): NEW_SESSION, escapeBelongsElsewhere(), hasId(), MOBILE_VIEW_KEY, Mode, NO_SESSIONS, Pinned, unionState() (+14 more)

### Community 21 - "missing.ts"
Cohesion: 0.52
Nodes (6): Task 2: 망 경계 판정·경고·채워야 할 정보, computeMissing(), labelOf(), requiredKeysFor(), requiredKeysForEdge(), requiredKeysForNode()

### Community 22 - "Canvas.tsx"
Cohesion: 0.10
Nodes (22): canvasAriaLabels(), DIRECTION, zoneDescription(), CanvasOptions, DiffMarks, FAR_ZOOM, NO_INSETS, Pinned (+14 more)

### Community 23 - "EdgeLayer.tsx"
Cohesion: 0.16
Nodes (21): boundaryDotAt(), boxOf(), labelBox(), placeAlong(), ringOf(), stepLabels(), tagSpots(), tooClose() (+13 more)

### Community 24 - "auth"
Cohesion: 0.17
Nodes (15): AppLayout(), Home(), lastActiveDiagram(), listProjects(), COMPACT_QUERY, CreateButton(), CreateRequest, extentOf() (+7 more)

### Community 25 - "연결선 개발용 화면"
Cohesion: 0.19
Nodes (13): ALB, EdgePanels(), n(), Panel, PanelEdge, PanelNode, PANELS, PanelView() (+5 more)

### Community 26 - "NodeMenu"
Cohesion: 0.48
Nodes (3): NodeMenu(), NodeMenuProps, placeMenu()

### Community 27 - "ask/route.ts"
Cohesion: 0.10
Nodes (21): BodySchema, dynamic, json(), maxDuration, POST(), runtime, BodySchema, dynamic (+13 more)

### Community 28 - "Flow"
Cohesion: 0.14
Nodes (12): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, Task 3: 강조 토큰과 노드·영역 흐림, CanvasProps, drawnId(), Flow(), ZoomVar(), displayEdgeFor(), Emphasis (+4 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.09
Nodes (20): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+12 more)

### Community 30 - "useSessions.ts"
Cohesion: 0.20
Nodes (14): ChatLine, errorOf(), Lines, mergeSessions(), NEW_CHAT_TITLE, NO_PAGING, SessionPaging, SessionSummary (+6 more)

### Community 31 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 6: E2E — 3E 흐름, 실행 순서

### Community 32 - "useExplanations.ts"
Cohesion: 0.15
Nodes (23): Task 2: 용어 사전 시드와 서버 함수, attrText(), endpointOf(), fnv1a(), LIMITS, normalizeTerm(), pickTerm(), signatureOf() (+15 more)

### Community 33 - "normalize.ts"
Cohesion: 0.19
Nodes (12): DIRECTIONS, DROP_NULL, flattenAttr(), HAS_ATTRS, HAS_STEPS, ID_FIELDS, isPlainObject(), NEEDS_PARENT (+4 more)

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.11
Nodes (21): Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), categoryOf(), FIELD_LABELS, isEmpty(), AskNode(), AskNodeProps, CautionProps, Cautions() (+13 more)

### Community 35 - "FlyLayer.tsx"
Cohesion: 0.15
Nodes (13): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+5 more)

### Community 36 - "Explanation.tsx"
Cohesion: 0.17
Nodes (19): EdgeExplanation, NodeExplanation, ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), ExplanationProps, NodeBody() (+11 more)

### Community 37 - "ExportMenu.tsx"
Cohesion: 0.12
Nodes (20): SamplePicker(), ExportBackground, ExportFormat, LIGHT_BACKGROUND, BACKGROUNDS, EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON (+12 more)

### Community 38 - "DiagramState"
Cohesion: 0.14
Nodes (10): ChatPanelProps, HistoryPanel(), HistoryPanelProps, SOURCE_LABEL, VersionRow, RIGHT_PANEL_BODY_ID, RightPanel(), RightPanelProps (+2 more)

### Community 39 - "[sessionId]/route.ts"
Cohesion: 0.12
Nodes (26): Ctx, DELETE(), dynamic, failed(), GET(), guard(), json(), PATCH() (+18 more)

### Community 40 - "edgeLabels.ts"
Cohesion: 0.09
Nodes (32): alongCandidates(), AlongItem, arcOf(), Beside, besideNode(), Box, commonPrefix(), fromSelected() (+24 more)

### Community 41 - "NodeCard.tsx"
Cohesion: 0.50
Nodes (4): isKeyboardFocus(), NameTooltip(), useNameTooltip(), NodeCard()

### Community 42 - "text.ts"
Cohesion: 0.27
Nodes (11): tagDetail(), azChipWidth(), nodeWidth(), charWidth(), EXTRA_WIDE_LATIN, isUpper(), isWide(), ratio() (+3 more)

### Community 43 - "Legend.tsx"
Cohesion: 0.19
Nodes (11): EDGE_KINDS, Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), legendPlacement() (+3 more)

### Community 44 - "clef.ts"
Cohesion: 0.17
Nodes (10): ClefAnswer, ClefAnswers, ClefHttpError, EXPLAIN_SCORE_QUESTION, INTENT_MIN_CONFIDENCE, INTENT_QUESTION, INTENTS, RESTART_DELAYS (+2 more)

### Community 45 - "samples.ts"
Cohesion: 0.05
Nodes (47): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus, Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저) (+39 more)

### Community 46 - "Review Focus"
Cohesion: 0.29
Nodes (6): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 5: E2E — 노드 질문 흐름, 실행 순서

### Community 47 - "(app)/actions.ts"
Cohesion: 0.16
Nodes (32): clearPinnedAction(), confirmAssumptionAction(), createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction(), getVersionAction() (+24 more)

### Community 48 - "Layout"
Cohesion: 0.39
Nodes (7): GROUP_PAD, circleHitsRect(), findOverlaps(), grow(), intersects(), PAIR_BADGE_OFFSET, strictlyInside()

### Community 49 - "motion.ts"
Cohesion: 0.33
Nodes (9): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+1 more)

### Community 50 - "layoutMetrics.ts"
Cohesion: 0.18
Nodes (17): Task 1: 배치 측정 모듈과 기준선 테스트, defaultViewLayout(), END_TRIM, hi(), isH(), isV(), LayoutMetrics, lo() (+9 more)

### Community 51 - "commands.ts"
Cohesion: 0.11
Nodes (18): attrs, COMMAND_OPS, commandSchema, direction, edgeKind, FLOW_OPS, flowName, flowNote (+10 more)

### Community 52 - "ref_react"
Cohesion: 0.07
Nodes (54): AuthField(), AuthSubmit(), Props, FieldErrors, Options, useAuthForm(), LoginForm(), validate() (+46 more)

### Community 53 - "GlossaryPage.tsx"
Cohesion: 0.21
Nodes (15): ActionResult, listGlossaryAction(), listTermsAction(), setTermReviewedAction(), updateTermAction(), Glossary(), GlossaryItem, toGlossaryItem() (+7 more)

### Community 54 - "schema.ts"
Cohesion: 0.14
Nodes (18): db, accounts, createdAt(), diagramVersions, GlossarySource, messages, passwordResetTokens, projects (+10 more)

### Community 55 - "pipeline.ts"
Cohesion: 0.10
Nodes (25): Task 5: 대화 차례의 흐름 명령, isAssumptionChangeMessage(), isFlowCommand(), isStructural(), resolveIntent(), abortError(), AI_UNAVAILABLE_MESSAGE, ChatDeps (+17 more)

### Community 56 - "Rect"
Cohesion: 0.15
Nodes (12): Global Constraints, Review Focus, Task 4: 강조 겹선 층(선택·호버)과 갈림점·움직임 층, Task 5: 같은 연결 이름 합치기, Task 7: 화면 확인, 전후 비교, E2E, 문서 동기화, 구성도 배치 조화 1단계 — 선택 강조와 선 간격 Implementation Plan, edgeLabels(), LaidOutGroup (+4 more)

### Community 57 - "ZoneNameLayer.tsx"
Cohesion: 0.15
Nodes (17): GroupBox(), GroupBoxData, groupToggleLabel(), groupToggleWidth(), nodeTypes, ZoneName, ZoneNameLayer(), ZoneNameLayerPortal() (+9 more)

### Community 58 - "flowSuggest.ts"
Cohesion: 0.16
Nodes (14): diagrams, flows, Flow, DiagramState, AddFlowOp, dbRepo, DepsInput, FLOW_SUGGEST_FAIL_MESSAGE (+6 more)

### Community 60 - "auth"
Cohesion: 0.24
Nodes (13): dynamic, GET(), json(), runtime, DiagramPage(), auth, handlers, verifyCredentials() (+5 more)

### Community 61 - "lines.ts"
Cohesion: 0.23
Nodes (12): Task 7: 대화창 — 말풍선과 진행 카드, MessageRole, changedOf(), keepsCard(), legacySummaryText(), messagesToLines(), NOT_APPLIED_MESSAGE, Row (+4 more)

### Community 62 - "deps.ts"
Cohesion: 0.36
Nodes (6): abortError(), ChatMessage, createQwenClient(), attempt(), isRetryable(), RETRY_DELAYS

### Community 63 - "createClefClient"
Cohesion: 0.50
Nodes (8): abortError(), createClefClient(), acquire(), classifyIntent(), decide(), post(), release(), run()

### Community 64 - "types.ts"
Cohesion: 0.14
Nodes (16): Command, Attrs, EDGE_DIRECTIONS, EDGE_PAYLOADS, Warning, MessageMeta, SessionEventPayload, ANSWER_INTENTS (+8 more)

### Community 65 - "2단계 계획: AI 대화"
Cohesion: 0.33
Nodes (5): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409)

### Community 66 - "구성도 배치 조화 1단계 — 선택 강조와 선 간격"
Cohesion: 0.12
Nodes (15): 1. 강조 방식: "굵게 + 은은한 빛, 선 종류 색 유지", 2. 함께 지나는 구간: "한 줄기로 묶기", 3. 반복되는 연결 이름: "같은 이름은 한 번만, 개수와 함께", 4. 평행선 간격, 5. 영역 이름 크기: "확대에 맞춰 보정", 6. 접힌 영역 상자: "상자 폭을 이름에 맞춤", 구성도 배치 조화 1단계 — 선택 강조와 선 간격, 내가 정한 것 (사용자 확인 필요) (+7 more)

### Community 67 - "getOwnedDiagram"
Cohesion: 0.29
Nodes (14): confirmAssumption(), emptyState(), confirmAssumptionFor(), saveFieldsFor(), SaveFieldsInput, copyFlows(), listFlows(), setWarningIgnoredFor() (+6 more)

### Community 69 - "흐름 보기와 망 경계 표시 — 설계"
Cohesion: 0.14
Nodes (13): A. 흐름, B. 망 경계, 만드는 사람에게 맡기는 것, 목표, 사용자가 정한 것(설계 검토 뒤), 실패로 보는 것, 왜 하는가, 이미 있는 것 (+5 more)

### Community 70 - "getSession"
Cohesion: 0.48
Nodes (6): POST(), guardEmit(), runChatTurn(), sessionTurn(), TurnArgs, getSession()

### Community 71 - "deps.ts"
Cohesion: 0.21
Nodes (11): Task 5: 설명 API, Qwen URL 정규화, GET(), parseEnv(), defaultChatDeps(), setChatDepsForTest(), llmConfig, normalizeQwenBaseUrl() (+3 more)

### Community 72 - "stacking.ts"
Cohesion: 0.33
Nodes (5): EDGE_Z, NODE_Z, ZONE_NAME_IN_PORTAL_Z, ZONE_Z_MAX, zoneZ()

### Community 73 - "ValidationError"
Cohesion: 0.18
Nodes (11): glossaryTerms, GLOSSARY_SEED, GlossarySeedEntry, addAiTerm(), escapeLike(), TermPatch, TEXT_LIMITS, TextField (+3 more)

### Community 74 - "display.ts"
Cohesion: 0.23
Nodes (12): buildDisplayGraph(), defaultDisplayOptions(), DisplayEdge, DisplayGroup, DisplayOptions, initialCollapsed(), isBus(), outermostCollapsedAncestor() (+4 more)

### Community 75 - "NODE_KINDS"
Cohesion: 0.20
Nodes (9): 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전, "중단됨" 버전, 빠진 정보 채우기, 노드 종류 목록 (kind·group_kind·edge_kind), "모름" 표시, 변경 이력과 비파괴 되돌리기, NODE_KINDS (+1 more)

### Community 76 - "explain/route.ts"
Cohesion: 0.24
Nodes (9): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+1 more)

### Community 77 - "Canvas"
Cohesion: 0.25
Nodes (9): Canvas(), Icon(), IconArrange(), IconChevron(), IconEye(), IconFit(), IconFlow(), IconMove() (+1 more)

### Community 78 - "suggest/route.ts"
Cohesion: 0.22
Nodes (8): BodySchema, Ctx, dynamic, maxDuration, POST(), runtime, FLOW_BUSY_MESSAGE, FLOW_SUGGEST_BUSY_MESSAGE

### Community 79 - "Review Focus"
Cohesion: 0.25
Nodes (7): Global Constraints, Review Focus, Task 6: AI 흐름 제안(처음 그린 뒤 자동 + 버튼), Task 7: 캔버스 흐름 강조·단계 글자·경계 표시, Task 9: E2E·화면 확인·문서, 흐름 보기와 망 경계 표시 Implementation Plan, FlowCommand

### Community 80 - "EdgeLayerProps"
Cohesion: 0.50
Nodes (3): Task 2: 마우스 강조·흐리기, EdgeLayerProps, NodeVisualState

### Community 81 - "flows/route.ts"
Cohesion: 0.40
Nodes (4): Ctx, dynamic, GET(), runtime

## Knowledge Gaps
- **392 isolated node(s):** `MenuAction`, `MenuItem`, `MenuTarget`, `SidebarProject`, `UseFlowsInput` (+387 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 458 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `flowSuggest.ts` to `FlowPanel.tsx`, `prompt.ts`, `MissingChecklist.tsx`, `types.ts`, `projects.ts`, `ask.ts`, `설명 생성과 품질 검사`, `display.ts`, `InfoCard.tsx`, `server/flows.ts`, `DiagramWorkspace.tsx`, `missing.ts`, `Canvas.tsx`, `Flow`, `useSessions.ts`, `useExplanations.ts`, `NodeInfo.tsx`, `DiagramState`, `samples.ts`, `(app)/actions.ts`, `layoutMetrics.ts`, `schema.ts`, `pipeline.ts`, `types.ts`, `getOwnedDiagram`, `display.ts`, `Review Focus`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `neutralizeClone()` connect `exportImage.ts` to `Rect`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `제약` connect `exportImage.ts` to `구성도 배치 조화 1단계 — 선택 강조와 선 간격`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MenuAction`, `MenuItem`, `MenuTarget` to the rest of the system?**
  _392 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useFlows` be split into smaller, more focused modules?**
  _Cohesion score 0.1225071225071225 - nodes in this community are weakly interconnected._
- **Should `FlowPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._