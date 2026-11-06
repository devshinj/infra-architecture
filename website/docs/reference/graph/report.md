---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1601 nodes · 4181 edges · 73 communities (71 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 168 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `10cd9e75`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Sidebar.tsx
- useFlows
- segments.ts
- FlowPanel.tsx
- ChatPanel.tsx
- domain/warnings.ts
- InfraSketch 설계 문서
- MissingChecklist.tsx
- layout.ts
- prompt.ts
- Review Focus
- ask.ts
- exportImage.ts
- 설명 생성과 품질 검사
- getOwnedDiagram
- RightPanel.tsx
- useCamera.ts
- SessionPicker.tsx
- domain/flows.ts
- 라우트 재수출
- DiagramWorkspace.tsx
- labelBox
- Canvas.tsx
- EdgeLayer.tsx
- auth
- domain/assumptions.ts
- NodeMenu
- ask/route.ts
- Flow
- 3C-1 계획 작업 목록
- useSessions.ts
- apply.ts
- useExplanations.ts
- normalize.ts
- NodeInfo.tsx
- FlyLayer.tsx
- Explanation.tsx
- ExportMenu.tsx
- deps.ts
- [sessionId]/route.ts
- edgeLabels.ts
- auth
- text.ts
- NODE_KINDS
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
- projects.ts
- pipeline.ts
- Layout
- catalog.ts
- flowSuggest.ts
- createJsonlParser
- Review Focus
- 2단계 계획: AI 대화
- InfraSketch 3B단계: 경고·구성 패턴 구현 계획
- Rect
- types.ts
- ShellValue
- 구성도 배치 조화 1단계 — 선택 강조와 선 간격
- schema.ts
- 흐름 보기와 망 경계 표시 — 설계
- config.ts
- types.ts
- explain/route.ts
- Canvas

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 48 edges
2. `DiagramWorkspace()` - 43 edges
3. `getOwnedDiagram()` - 40 edges
4. `Flow()` - 36 edges
5. `lockedTurn()` - 35 edges
6. `ValidationError` - 34 edges
7. `InfraSketch 설계 문서` - 34 edges
8. `auth` - 28 edges
9. `Sidebar()` - 27 edges
10. `NotFoundError` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Global Constraints` --references--> `applyCommand()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/domain/apply.ts
- `Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙` --references--> `applyCommand()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/domain/apply.ts
- `Task 1: 세션 저장` --references--> `listMessages()`  [INFERRED]
  docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md → src/server/chat/messages.ts
- `Task 2: 서버 점검 — Clef 판정과 Qwen 문구` --references--> `Warning`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/domain/types.ts
- `Task 3: 대화 차례에 점검 단계 넣기` --references--> `ChatEvent`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/server/chat/events.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (73 total, 2 thin omitted)

### Community 0 - "Sidebar.tsx"
Cohesion: 0.20
Nodes (20): LogoMark(), useShell(), deleteMessage(), diagramPath(), IconBook(), IconClose(), IconCollapse(), IconExpand() (+12 more)

### Community 1 - "useFlows"
Cohesion: 0.11
Nodes (24): Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인, confirmFlowAction(), deleteFlowAction(), removeFlowStepAction(), renameFlowAction(), createdAt(), FlowSource, FlowProblem (+16 more)

### Community 2 - "segments.ts"
Cohesion: 0.17
Nodes (21): Task 2: 평소 화면 평행선 16px, 연결선 모양과 움직임, assignStarts(), BASE_SPEED, buildSegmentBundles(), buildSegs(), Bundle, InEdge (+13 more)

### Community 3 - "FlowPanel.tsx"
Cohesion: 0.17
Nodes (7): FlowOrigin, Action, FlowPanel(), FlowPanelProps, GROUPS, menuRootId(), stepMark()

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.09
Nodes (26): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), Block, BUILD_STEPS, CardView(), ChatPanel(), Check(), CHIP_KINDS (+18 more)

### Community 5 - "domain/warnings.ts"
Cohesion: 0.13
Nodes (28): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 3: 대화 차례에 점검 단계 넣기, Task 4: "의도된 구성" 저장, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, isDirectCrossing() (+20 more)

### Community 6 - "InfraSketch 설계 문서"
Cohesion: 0.13
Nodes (18): 대화 차례 파이프라인, 이상한 구성 경고, 로그인·회원 (Auth.js Credentials), 자동 배치 (ELK layered), 변경 명령 (add_node·add_edge·set_assumption 등), Clef-Flash 판정 모델, InfraSketch 설계 문서, 설명 패널 (+10 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.09
Nodes (27): Task 5: 주의 항목 바로 가기, computeMissing(), labelOf(), MissingItem, requiredKeysFor(), requiredKeysForEdge(), requiredKeysForNode(), CardMeasure (+19 more)

### Community 8 - "layout.ts"
Cohesion: 0.11
Nodes (27): Task 6: 영역 이름 크기 보정과 접힌 상자 폭, elbowRoute(), Pt, azOf(), BASE_OPTIONS, COLLAPSED_MAX_WIDTH, collapsedGroupWidth(), CONTENT_WIDTH (+19 more)

### Community 9 - "prompt.ts"
Cohesion: 0.09
Nodes (27): Pattern, patternPromptBlock(), PATTERNS, ancestorsOf(), ANSWER_PROMPT, ASK_PROMPT, buildExplainMessages(), buildFlowSuggestMessages() (+19 more)

### Community 10 - "Review Focus"
Cohesion: 0.12
Nodes (16): Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저), Task 11: 빈 구성도 시작 경험 — 인사말·가이드·예시 질문 (사용자 추가 요청, 2026-10-30), Task 12: 대화에서 캔버스로 날아가는 빛점 (사용자 추가 요청, 2026-10-30), Task 13: 도구 모음 정리와 스크롤 정리 (사용자 추가 요청, 2026-10-30), Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙 (+8 more)

### Community 11 - "ask.ts"
Cohesion: 0.18
Nodes (17): Task 2: 질문 차례(서버), Warning, AskArgs, askInSession(), HANDOFF_REPLY, ChatEvent, MessageMeta, SESSION_GONE_MESSAGE (+9 more)

### Community 12 - "exportImage.ts"
Cohesion: 0.11
Nodes (23): Task 5: 같은 연결 이름 합치기, 제약, buildStage(), CHROME, decodeSvgDataUrl(), diagramBounds(), download(), EdgeLabel (+15 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.10
Nodes (28): ExplanationTargetKind, codePoints(), dbRepo, DepsInput, Draft, draftOf(), easeScore(), EdgeDraft (+20 more)

### Community 14 - "getOwnedDiagram"
Cohesion: 0.22
Nodes (18): Ctx, dynamic, GET(), runtime, confirmAssumption(), emptyState(), confirmAssumptionFor(), saveFieldsFor() (+10 more)

### Community 15 - "RightPanel.tsx"
Cohesion: 0.14
Nodes (10): ChatPanelProps, HistoryPanel(), HistoryPanelProps, SOURCE_LABEL, VersionRow, RIGHT_PANEL_BODY_ID, RightPanel(), RightPanelProps (+2 more)

### Community 16 - "useCamera.ts"
Cohesion: 0.13
Nodes (19): CameraInput, EDGE_GAP_PX, FINAL_FIT_DURATION, fitViewport(), FOCUS_DURATION, FOCUS_MIN_ZOOM, FOCUS_SIDE_MIN, focusViewport() (+11 more)

### Community 17 - "SessionPicker.tsx"
Cohesion: 0.16
Nodes (19): Action, byRecent(), Chevron(), MAIN_LABEL, menuRootId(), MORE_LABEL, pad(), Plus() (+11 more)

### Community 18 - "domain/flows.ts"
Cohesion: 0.24
Nodes (14): Review Focus, Task 2: 망 경계 판정·경고·채워야 할 정보, Task 3: 흐름 도메인(모양·검사·끊김), Task 8: "흐름" 탭·지나는 흐름·연동, Task 9: E2E·화면 확인·문서, BOUNDARY_NODE_KINDS, crossesBoundary(), networkZoneOf() (+6 more)

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.12
Nodes (20): escapeBelongsElsewhere(), hasId(), MOBILE_VIEW_KEY, Mode, NO_SESSIONS, Pinned, unionState(), ICONS (+12 more)

### Community 21 - "labelBox"
Cohesion: 0.31
Nodes (10): Task 7: 캔버스 흐름 강조·단계 글자·경계 표시, boundaryDotAt(), boxOf(), labelBox(), placeAlong(), ringOf(), stepLabels(), stepNumberOnly() (+2 more)

### Community 22 - "Canvas.tsx"
Cohesion: 0.12
Nodes (19): canvasAriaLabels(), DIRECTION, zoneDescription(), CanvasOptions, DiffMarks, drawnId(), FAR_ZOOM, NO_INSETS (+11 more)

### Community 23 - "EdgeLayer.tsx"
Cohesion: 0.14
Nodes (18): Task 2: 마우스 강조·흐리기, Box, ARROW, arrowD(), DIR, DIR_D, EdgeLayer(), EdgeLayerPortal() (+10 more)

### Community 24 - "auth"
Cohesion: 0.16
Nodes (16): AppLayout(), Home(), lastActiveDiagram(), listProjects(), COMPACT_QUERY, CreateButton(), CreateRequest, extentOf() (+8 more)

### Community 25 - "domain/assumptions.ts"
Cohesion: 0.22
Nodes (10): 가정 목록 (구조 결정), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage(), STRUCTURAL_KEYS, Assumption, AssumptionChips(), AssumptionChipsProps (+2 more)

### Community 26 - "NodeMenu"
Cohesion: 0.48
Nodes (3): NodeMenu(), NodeMenuProps, placeMenu()

### Community 27 - "ask/route.ts"
Cohesion: 0.09
Nodes (29): BodySchema, dynamic, json(), maxDuration, POST(), runtime, BodySchema, dynamic (+21 more)

### Community 28 - "Flow"
Cohesion: 0.12
Nodes (13): CanvasProps, Flow(), ZoomVar(), CONE_SLACK, gap(), NAV_KEYS, navItems(), readingOrder() (+5 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.14
Nodes (13): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+5 more)

### Community 30 - "useSessions.ts"
Cohesion: 0.11
Nodes (19): SessionEventPayload, SessionPickerProps, errorOf(), Lines, mergeSessions(), MoreState, NEW_CHAT_TITLE, NO_PAGING (+11 more)

### Community 31 - "apply.ts"
Cohesion: 0.35
Nodes (11): applyCommand(), applyCommands(), ApplyResult, endpointOk(), fail(), has(), idTaken(), isEmptyGroup() (+3 more)

### Community 32 - "useExplanations.ts"
Cohesion: 0.12
Nodes (28): Task 2: 용어 사전 시드와 서버 함수, Task 4: 서버 설명 생성, Task 7: 설명 큐와 연결, listTermsAction(), attrText(), endpointOf(), fnv1a(), LIMITS (+20 more)

### Community 33 - "normalize.ts"
Cohesion: 0.19
Nodes (12): DIRECTIONS, DROP_NULL, flattenAttr(), HAS_ATTRS, HAS_STEPS, ID_FIELDS, isPlainObject(), NEEDS_PARENT (+4 more)

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.11
Nodes (22): Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), Flow, FIELD_LABELS, isEmpty(), AskNode(), AskNodeProps, CautionProps, Cautions() (+14 more)

### Community 35 - "FlyLayer.tsx"
Cohesion: 0.15
Nodes (13): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+5 more)

### Community 36 - "Explanation.tsx"
Cohesion: 0.17
Nodes (19): EdgeExplanation, NodeExplanation, ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), ExplanationProps, NodeBody() (+11 more)

### Community 37 - "ExportMenu.tsx"
Cohesion: 0.12
Nodes (20): SamplePicker(), ExportBackground, ExportFormat, LIGHT_BACKGROUND, BACKGROUNDS, EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON (+12 more)

### Community 38 - "deps.ts"
Cohesion: 0.23
Nodes (10): Task 5: 설명 API, defaultChatDeps(), setChatDepsForTest(), resolveDeps(), abortError(), ChatMessage, createQwenClient(), attempt() (+2 more)

### Community 39 - "[sessionId]/route.ts"
Cohesion: 0.13
Nodes (26): Ctx, DELETE(), dynamic, failed(), GET(), guard(), json(), PATCH() (+18 more)

### Community 40 - "edgeLabels.ts"
Cohesion: 0.09
Nodes (30): alongCandidates(), AlongItem, arcOf(), Beside, besideNode(), commonPrefix(), fromSelected(), IncidentEdge (+22 more)

### Community 41 - "auth"
Cohesion: 0.32
Nodes (11): dynamic, GET(), json(), runtime, DiagramPage(), auth, sessionPayload(), listMessages() (+3 more)

### Community 42 - "text.ts"
Cohesion: 0.27
Nodes (11): tagDetail(), azChipWidth(), nodeWidth(), charWidth(), EXTRA_WIDE_LATIN, isUpper(), isWide(), ratio() (+3 more)

### Community 43 - "NODE_KINDS"
Cohesion: 0.20
Nodes (9): 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전, "중단됨" 버전, 빠진 정보 채우기, 노드 종류 목록 (kind·group_kind·edge_kind), "모름" 표시, 변경 이력과 비파괴 되돌리기, NODE_KINDS (+1 more)

### Community 44 - "clef.ts"
Cohesion: 0.15
Nodes (18): abortError(), ClefAnswer, ClefAnswers, ClefHttpError, createClefClient(), acquire(), classifyIntent(), decide() (+10 more)

### Community 45 - "samples.ts"
Cohesion: 0.12
Nodes (16): AddEdge, AddGroup, AddNode, AUX_NODE_KINDS, convertSpikeScenario(), EDGE_KIND_MAP, EDGE_KIND_SET, NODE_KIND_SET (+8 more)

### Community 46 - "Review Focus"
Cohesion: 0.29
Nodes (6): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 5: E2E — 노드 질문 흐름, 실행 순서

### Community 47 - "(app)/actions.ts"
Cohesion: 0.17
Nodes (30): clearPinnedAction(), confirmAssumptionAction(), createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction(), getVersionAction() (+22 more)

### Community 48 - "Layout"
Cohesion: 0.39
Nodes (7): GROUP_PAD, circleHitsRect(), findOverlaps(), grow(), intersects(), PAIR_BADGE_OFFSET, strictlyInside()

### Community 49 - "motion.ts"
Cohesion: 0.33
Nodes (9): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), startBundleMotion() (+1 more)

### Community 50 - "layoutMetrics.ts"
Cohesion: 0.15
Nodes (20): Task 1: 배치 측정 모듈과 기준선 테스트, defaultDisplayOptions(), initialCollapsed(), defaultViewLayout(), END_TRIM, hi(), isH(), isV() (+12 more)

### Community 51 - "commands.ts"
Cohesion: 0.11
Nodes (17): Task 6: AI 흐름 제안(처음 그린 뒤 자동 + 버튼), attrs, COMMAND_OPS, commandSchema, direction, edgeKind, FLOW_OPS, FlowCommand (+9 more)

### Community 52 - "ref_react"
Cohesion: 0.05
Nodes (65): AuthField(), AuthSubmit(), Props, FieldErrors, Options, useAuthForm(), LoginForm(), validate() (+57 more)

### Community 53 - "GlossaryPage.tsx"
Cohesion: 0.13
Nodes (22): ActionResult, listGlossaryAction(), setTermReviewedAction(), updateTermAction(), Glossary(), glossaryTerms, GLOSSARY_SEED, GlossarySeedEntry (+14 more)

### Community 54 - "projects.ts"
Cohesion: 0.16
Nodes (24): copyFlows(), assertOwnedProject(), assertUniqueDiagramName(), assertUniqueProjectName(), assertUuid(), cleanName(), clearPinnedPositions(), clip() (+16 more)

### Community 55 - "pipeline.ts"
Cohesion: 0.10
Nodes (27): Task 5: 대화 차례의 흐름 명령, isAssumptionChangeMessage(), isFlowCommand(), isStructural(), parseCommand(), toFlowOp(), asksStepText(), keepStepText() (+19 more)

### Community 56 - "Layout"
Cohesion: 0.18
Nodes (11): FlowProps, DisplayGraph, ExportRequest, Layout, MeasuredView, EDGE_Z, NODE_Z, ZONE_NAME_IN_PORTAL_Z (+3 more)

### Community 57 - "catalog.ts"
Cohesion: 0.05
Nodes (47): ALB, EdgePanels(), n(), Panel, PanelEdge, PanelNode, PANELS, PanelView() (+39 more)

### Community 58 - "flowSuggest.ts"
Cohesion: 0.10
Nodes (22): BodySchema, Ctx, dynamic, maxDuration, POST(), runtime, FLOW_LIMITS, FlowOp (+14 more)

### Community 59 - "createJsonlParser"
Cohesion: 0.38
Nodes (8): createJsonlParser(), isCommandLine(), Scan, scanLine(), step(), stripWrap(), createThinkStripper(), partialTagLen()

### Community 60 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 6: E2E — 3E 흐름, 실행 순서

### Community 61 - "2단계 계획: AI 대화"
Cohesion: 0.33
Nodes (5): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409)

### Community 62 - "InfraSketch 3B단계: 경고·구성 패턴 구현 계획"
Cohesion: 0.40
Nodes (4): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus

### Community 63 - "Rect"
Cohesion: 0.40
Nodes (5): LaidOutGroup, LaidOutNode, Rect, NavItem, FitOptions

### Community 64 - "types.ts"
Cohesion: 0.09
Nodes (27): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, Task 7: 대화창 — 말풍선과 진행 카드, MessageRole, Command, warningsByNode(), changedOf(), keepsCard(), legacySummaryText() (+19 more)

### Community 66 - "구성도 배치 조화 1단계 — 선택 강조와 선 간격"
Cohesion: 0.12
Nodes (15): 1. 강조 방식: "굵게 + 은은한 빛, 선 종류 색 유지", 2. 함께 지나는 구간: "한 줄기로 묶기", 3. 반복되는 연결 이름: "같은 이름은 한 번만, 개수와 함께", 4. 평행선 간격, 5. 영역 이름 크기: "확대에 맞춰 보정", 6. 접힌 영역 상자: "상자 폭을 이름에 맞춤", 구성도 배치 조화 1단계 — 선택 강조와 선 간격, 내가 정한 것 (사용자 확인 필요) (+7 more)

### Community 67 - "schema.ts"
Cohesion: 0.16
Nodes (15): accounts, ChatSessionKind, chatSessions, diagrams, diagramVersions, explanations, flows, GlossarySource (+7 more)

### Community 69 - "흐름 보기와 망 경계 표시 — 설계"
Cohesion: 0.14
Nodes (13): A. 흐름, B. 망 경계, 만드는 사람에게 맡기는 것, 목표, 사용자가 정한 것(설계 검토 뒤), 실패로 보는 것, 왜 하는가, 이미 있는 것 (+5 more)

### Community 71 - "config.ts"
Cohesion: 0.31
Nodes (7): GET(), parseEnv(), llmConfig, normalizeQwenBaseUrl(), checkLlmHealth(), LlmHealth, probe()

### Community 74 - "types.ts"
Cohesion: 0.11
Nodes (26): Global Constraints, Task 1: 망 영역·망연계 노드·연결 전달물/방향, 흐름 보기와 망 경계 표시 Implementation Plan, buildDisplayGraph(), DisplayEdge, DisplayGroup, DisplayOptions, isBus() (+18 more)

### Community 76 - "explain/route.ts"
Cohesion: 0.27
Nodes (9): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+1 more)

### Community 77 - "Canvas"
Cohesion: 0.13
Nodes (16): Global Constraints, Review Focus, Task 3: 강조 토큰과 노드·영역 흐림, Task 4: 강조 겹선 층(선택·호버)과 갈림점·움직임 층, Task 7: 화면 확인, 전후 비교, E2E, 문서 동기화, 구성도 배치 조화 1단계 — 선택 강조와 선 간격 Implementation Plan, Canvas(), Icon() (+8 more)

## Knowledge Gaps
- **392 isolated node(s):** `MenuAction`, `MenuItem`, `MenuTarget`, `SidebarProject`, `UseFlowsInput` (+387 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 458 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `types.ts` to `useFlows`, `FlowPanel.tsx`, `domain/warnings.ts`, `MissingChecklist.tsx`, `prompt.ts`, `ask.ts`, `설명 생성과 품질 검사`, `getOwnedDiagram`, `RightPanel.tsx`, `domain/flows.ts`, `DiagramWorkspace.tsx`, `Canvas.tsx`, `domain/assumptions.ts`, `Flow`, `useSessions.ts`, `apply.ts`, `useExplanations.ts`, `NodeInfo.tsx`, `samples.ts`, `(app)/actions.ts`, `layoutMetrics.ts`, `projects.ts`, `pipeline.ts`, `flowSuggest.ts`, `schema.ts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `neutralizeClone()` connect `exportImage.ts` to `Canvas`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `제약` connect `exportImage.ts` to `구성도 배치 조화 1단계 — 선택 강조와 선 간격`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MenuAction`, `MenuItem`, `MenuTarget` to the rest of the system?**
  _392 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useFlows` be split into smaller, more focused modules?**
  _Cohesion score 0.1092436974789916 - nodes in this community are weakly interconnected._
- **Should `ChatPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09243697478991597 - nodes in this community are weakly interconnected._