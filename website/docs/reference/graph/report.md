---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1799 nodes · 4910 edges · 88 communities (87 shown, 1 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 236 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `794e281c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Sidebar.tsx
- useFlows
- segments.ts
- NetworkKnowledgePage.tsx
- ChatPanel.tsx
- domain/warnings.ts
- InfraSketch 설계 문서
- MissingChecklist.tsx
- layout.ts
- prompt.ts
- Review Focus
- domain/linkGuess.ts
- exportImage.ts
- 설명 생성과 품질 검사
- getOwnedDiagram
- RightPanel.tsx
- useCamera.ts
- SessionPicker.tsx
- server/flows.ts
- 라우트 재수출
- DiagramWorkspace.tsx
- FlowPanel.tsx
- DiagramState
- EdgeLayer.tsx
- middleware.ts
- domain/assumptions.ts
- NodeMenu
- ask.ts
- Canvas.tsx
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
- MentionInput
- missing.ts
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
- ZoneNameLayer.tsx
- EdgePanels.tsx
- flowSuggest.ts
- [sessionId]/route.ts
- Review Focus
- Legend.tsx
- networkRules.ts
- Shell.tsx
- types.ts
- schema.ts
- 구성도 배치 조화 1단계 — 선택 강조와 선 간격
- server/network.ts
- glossary.ts
- 흐름 보기와 망 경계 표시 — 설계
- domain/warnings.ts
- config.ts
- createJsonlParser
- Review Focus
- domain/explain.ts
- NodeCard.tsx
- lines.ts
- edgeCoalesce.ts
- NODE_KINDS
- 목표
- 목표
- createClefClient
- explain/route.ts
- dialogs.tsx
- Claude Code 연동(MCP 서버) — 설계
- 2단계 계획: AI 대화
- app/layout.tsx
- InfraSketch 3B단계: 경고·구성 패턴 구현 계획

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 56 edges
2. `ValidationError` - 52 edges
3. `getOwnedDiagram()` - 46 edges
4. `DiagramWorkspace()` - 46 edges
5. `lockedTurn()` - 41 edges
6. `Flow()` - 36 edges
7. `InfraSketch 설계 문서` - 34 edges
8. `NotFoundError` - 30 edges
9. `auth` - 30 edges
10. `runResult()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `만드는 사람에게 맡기는 것` --references--> `Group`  [INFERRED]
  docs/superpowers/specs/2026-11-06-network-character-and-link-guess-design.md → src/domain/types.ts
- `5. 기록과 동시 작업` --references--> `withDiagramLock()`  [INFERRED]
  docs/superpowers/specs/2026-11-06-mcp-server-design.md → src/server/chat/lock.ts
- `Global Constraints` --references--> `applyCommand()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/domain/apply.ts
- `Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙` --references--> `applyCommand()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/domain/apply.ts
- `만드는 사람에게 맡기는 것` --references--> `applyCommand()`  [INFERRED]
  docs/superpowers/specs/2026-11-06-mcp-server-design.md → src/domain/apply.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (88 total, 1 thin omitted)

### Community 0 - "Sidebar.tsx"
Cohesion: 0.16
Nodes (22): LogoMark(), ShellValue, useShell(), deleteMessage(), diagramPath(), IconBook(), IconClose(), IconCollapse() (+14 more)

### Community 1 - "useFlows"
Cohesion: 0.13
Nodes (16): Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인, confirmFlowAction(), deleteFlowAction(), removeFlowStepAction(), renameFlowAction(), BusyError, byKey(), confirmFlow() (+8 more)

### Community 2 - "segments.ts"
Cohesion: 0.19
Nodes (19): Task 2: 평소 화면 평행선 16px, 연결선 모양과 움직임, assignStarts(), buildSegmentBundles(), buildSegs(), InEdge, normalize(), Piece (+11 more)

### Community 3 - "NetworkKnowledgePage.tsx"
Cohesion: 0.16
Nodes (29): Task 9: 망 지식 화면, ActionResult, addNetworkTypeAction(), bad(), countNetworkTypeUsageAction(), deleteNetworkRuleAction(), deleteNetworkTypeAction(), reqGrade() (+21 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.12
Nodes (20): Block, BUILD_STEPS, CardView(), ChatPanel(), ChatPanelProps, Check(), CHIP_KINDS, Dots() (+12 more)

### Community 5 - "domain/warnings.ts"
Cohesion: 0.17
Nodes (17): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, buildWarningMessages(), carryExposed(), checkWarnings() (+9 more)

### Community 6 - "InfraSketch 설계 문서"
Cohesion: 0.13
Nodes (18): 대화 차례 파이프라인, 이상한 구성 경고, 가정 목록 (구조 결정), 로그인·회원 (Auth.js Credentials), 자동 배치 (ELK layered), 변경 명령 (add_node·add_edge·set_assumption 등), Clef-Flash 판정 모델, InfraSketch 설계 문서 (+10 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.08
Nodes (26): Task 5: 주의 항목 바로 가기, MissingItem, parseLinkWarningId(), CardMeasure, Chevron(), Count(), GuessedZones(), InfoCard() (+18 more)

### Community 8 - "layout.ts"
Cohesion: 0.08
Nodes (39): Task 6: 영역 이름 크기 보정과 접힌 상자 폭, tagDetail(), elbowRoute(), Pt, azChipWidth(), azOf(), BASE_OPTIONS, COLLAPSED_MAX_WIDTH (+31 more)

### Community 9 - "prompt.ts"
Cohesion: 0.10
Nodes (27): ancestorsOf(), ANSWER_PROMPT, ASK_PROMPT, ATTR_LIST, buildExplainMessages(), buildFlowSuggestMessages(), buildMessages(), byStr() (+19 more)

### Community 10 - "Review Focus"
Cohesion: 0.12
Nodes (16): Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저), Task 11: 빈 구성도 시작 경험 — 인사말·가이드·예시 질문 (사용자 추가 요청, 2026-10-30), Task 12: 대화에서 캔버스로 날아가는 빛점 (사용자 추가 요청, 2026-10-30), Task 13: 도구 모음 정리와 스크롤 정리 (사용자 추가 요청, 2026-10-30), Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙 (+8 more)

### Community 11 - "domain/linkGuess.ts"
Cohesion: 0.26
Nodes (15): Task 4: 되돌리기 도메인 — 대신한 연결 기록, 되돌리기, 흐름 단계 나누기·합치기, Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검, FlowStep, has(), incident(), recordReplaced(), revertLinkGuess(), sameSet() (+7 more)

### Community 12 - "exportImage.ts"
Cohesion: 0.08
Nodes (28): Global Constraints, Review Focus, Task 4: 강조 겹선 층(선택·호버)과 갈림점·움직임 층, Task 5: 같은 연결 이름 합치기, Task 7: 화면 확인, 전후 비교, E2E, 문서 동기화, 구성도 배치 조화 1단계 — 선택 강조와 선 간격 Implementation Plan, 제약, buildStage() (+20 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.11
Nodes (28): ExplanationTargetKind, cachedNodeExplanation(), codePoints(), complete(), dbRepo, DepsInput, Draft, draftOf() (+20 more)

### Community 14 - "getOwnedDiagram"
Cohesion: 0.19
Nodes (28): Task 4: "의도된 구성" 저장, Task 7: 서버 액션 — 망 종류 확인·바꾸기, 망연계 맞아요·아니에요, confirmAssumption(), noLinkKey(), parseNoLinkKey(), mergeFlowSteps(), Attrs, EDGE_DIRECTIONS (+20 more)

### Community 15 - "RightPanel.tsx"
Cohesion: 0.13
Nodes (10): ExplanationProps, HistoryPanel(), HistoryPanelProps, SOURCE_LABEL, VersionRow, NodeInfoProps, RightPanel(), RightPanelProps (+2 more)

### Community 16 - "useCamera.ts"
Cohesion: 0.10
Nodes (25): LaidOutGroup, LaidOutNode, Rect, NavItem, CameraInput, EDGE_GAP_PX, FINAL_FIT_DURATION, FitOptions (+17 more)

### Community 17 - "SessionPicker.tsx"
Cohesion: 0.15
Nodes (15): Action, byRecent(), Chevron(), MAIN_LABEL, menuRootId(), MORE_LABEL, pad(), Plus() (+7 more)

### Community 18 - "server/flows.ts"
Cohesion: 0.16
Nodes (20): FlowSource, asksStepText(), checkFlow(), crossingBase(), Flow, FLOW_LIMITS, FlowOp, FlowProblem (+12 more)

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.10
Nodes (23): assumptionChangeMessage(), escapeBelongsElsewhere(), hasId(), MOBILE_VIEW_KEY, Mode, NO_SESSIONS, Pinned, unionState() (+15 more)

### Community 21 - "FlowPanel.tsx"
Cohesion: 0.10
Nodes (17): FlowOrigin, ZoneType, Action, FlowPanel(), FlowPanelProps, GROUPS, menuRootId(), stepMark() (+9 more)

### Community 22 - "DiagramState"
Cohesion: 0.43
Nodes (5): isAssumptionChangeMessage(), STRUCTURAL_KEYS, DiagramState, resolveIntent(), Intent

### Community 23 - "EdgeLayer.tsx"
Cohesion: 0.15
Nodes (16): Task 2: 마우스 강조·흐리기, Box, ARROW, arrowD(), DIR, DIR_D, EdgeLayer(), EdgeLayerProps (+8 more)

### Community 24 - "middleware.ts"
Cohesion: 0.21
Nodes (8): authConfig, { auth }, config, authDecision, isPublicPath(), PUBLIC, next-auth, Session

### Community 25 - "domain/assumptions.ts"
Cohesion: 0.29
Nodes (7): ASSUMPTION_CHOICES, ASSUMPTION_LABELS, Assumption, AssumptionChips(), AssumptionChipsProps, labelOf(), orderedKeys()

### Community 26 - "NodeMenu"
Cohesion: 0.48
Nodes (3): NodeMenu(), NodeMenuProps, placeMenu()

### Community 27 - "ask.ts"
Cohesion: 0.08
Nodes (45): Task 3: 대화 차례에 점검 단계 넣기, Task 2: 질문 차례(서버), BodySchema, dynamic, json(), maxDuration, POST(), runtime (+37 more)

### Community 28 - "Canvas.tsx"
Cohesion: 0.06
Nodes (43): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, Task 3: 강조 토큰과 노드·영역 흐림, canvasAriaLabels(), DIRECTION, zoneDescription(), Canvas(), CanvasOptions, CanvasProps (+35 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.13
Nodes (14): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+6 more)

### Community 30 - "useSessions.ts"
Cohesion: 0.15
Nodes (19): NetworkKnowledge, Warning, MessageMeta, SessionEventPayload, ChatLine, errorOf(), Lines, mergeSessions() (+11 more)

### Community 31 - "apply.ts"
Cohesion: 0.30
Nodes (13): applyCommand(), applyCommands(), ApplyOptions, ApplyResult, endpointOk(), fail(), freeEdgeId(), has() (+5 more)

### Community 32 - "useExplanations.ts"
Cohesion: 0.24
Nodes (13): EdgeExplanation, NodeExplanation, Entry, ExplanationView, fresh(), Job, keyOf(), omit() (+5 more)

### Community 33 - "normalize.ts"
Cohesion: 0.19
Nodes (12): DIRECTIONS, DROP_NULL, flattenAttr(), HAS_ATTRS, HAS_STEPS, ID_FIELDS, isPlainObject(), NEEDS_PARENT (+4 more)

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.12
Nodes (21): Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), isEmpty(), mergeWarnings(), AskNode(), AskNodeProps, CautionProps, Cautions(), DIRECTION_NAME (+13 more)

### Community 35 - "FlyLayer.tsx"
Cohesion: 0.15
Nodes (13): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+5 more)

### Community 36 - "Explanation.tsx"
Cohesion: 0.33
Nodes (12): ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), NodeBody(), Retry(), Rewrite(), Section() (+4 more)

### Community 37 - "ExportMenu.tsx"
Cohesion: 0.12
Nodes (20): SamplePicker(), ExportBackground, ExportFormat, LIGHT_BACKGROUND, BACKGROUNDS, EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON (+12 more)

### Community 38 - "deps.ts"
Cohesion: 0.26
Nodes (9): Task 5: 설명 API, defaultChatDeps(), setChatDepsForTest(), abortError(), ChatMessage, createQwenClient(), attempt(), isRetryable() (+1 more)

### Community 39 - "[sessionId]/route.ts"
Cohesion: 0.16
Nodes (18): dynamic, GET(), json(), runtime, chatSessions, asRow(), columns, isDbTimestamp() (+10 more)

### Community 40 - "edgeLabels.ts"
Cohesion: 0.09
Nodes (40): Task 7: 캔버스 흐름 강조·단계 글자·경계 표시, alongCandidates(), AlongItem, arcOf(), Beside, besideNode(), boundaryDotAt(), boxOf() (+32 more)

### Community 41 - "auth"
Cohesion: 0.17
Nodes (15): Ctx, dynamic, GET(), runtime, GET(), AppLayout(), DiagramPage(), Home() (+7 more)

### Community 42 - "MentionInput"
Cohesion: 0.19
Nodes (7): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), Mention, MentionInput, MentionInputHandle, MentionInputProps, mentionToken()

### Community 43 - "missing.ts"
Cohesion: 0.14
Nodes (18): Task 3: 흐름 도메인(모양·검사·끊김), Review Focus, Task 10: E2E 와 문서, Task 1: 망 지식 도메인 — 타입, 기본 제공 목록, 필요한 방식 계산, Task 2: 구성도 상태 — 망 종류 칸, `set_zone_type`, 망연계 추정 표시 명령, Task 5: DB와 서버 — 망 지식 테이블, 기본 제공 채우기, 읽기·고치기, Task 8: 구성도 화면 — 지식 전달, 안내 카드, 빠진 정보 줄, 망연계 노드 표시, 망 종류 지식과 망연계 예상 Implementation Plan (+10 more)

### Community 44 - "clef.ts"
Cohesion: 0.17
Nodes (10): ClefAnswer, ClefAnswers, ClefHttpError, EXPLAIN_SCORE_QUESTION, INTENT_MIN_CONFIDENCE, INTENT_QUESTION, INTENTS, RESTART_DELAYS (+2 more)

### Community 45 - "samples.ts"
Cohesion: 0.12
Nodes (15): AddEdge, AddGroup, AddNode, AUX_NODE_KINDS, convertSpikeScenario(), EDGE_KIND_MAP, EDGE_KIND_SET, NODE_KIND_SET (+7 more)

### Community 46 - "Review Focus"
Cohesion: 0.29
Nodes (6): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 5: E2E — 노드 질문 흐름, 실행 순서

### Community 47 - "(app)/actions.ts"
Cohesion: 0.11
Nodes (36): clearPinnedAction(), confirmAssumptionAction(), confirmLinkGuessAction(), getVersionAction(), importSampleAction(), listVersionsAction(), logoutAction(), NetworkKnowledgeData (+28 more)

### Community 48 - "Layout"
Cohesion: 0.39
Nodes (7): GROUP_PAD, circleHitsRect(), findOverlaps(), grow(), intersects(), PAIR_BADGE_OFFSET, strictlyInside()

### Community 49 - "motion.ts"
Cohesion: 0.26
Nodes (11): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+3 more)

### Community 50 - "layoutMetrics.ts"
Cohesion: 0.08
Nodes (37): Task 1: 배치 측정 모듈과 기준선 테스트, drawnId(), FlowProps, buildDisplayGraph(), defaultDisplayOptions(), DisplayGraph, DisplayGroup, DisplayOptions (+29 more)

### Community 51 - "commands.ts"
Cohesion: 0.09
Nodes (21): Task 5: 대화 차례의 흐름 명령, attrs, COMMAND_OPS, commandSchema, direction, edgeKind, FLOW_OPS, flowName (+13 more)

### Community 52 - "ref_react"
Cohesion: 0.08
Nodes (51): AuthField(), AuthSubmit(), Props, FieldErrors, Options, useAuthForm(), LoginForm(), validate() (+43 more)

### Community 53 - "GlossaryPage.tsx"
Cohesion: 0.17
Nodes (19): listGlossaryAction(), listMessagesAction(), listTermsAction(), run(), setTermReviewedAction(), updateTermAction(), userId(), Glossary() (+11 more)

### Community 54 - "projects.ts"
Cohesion: 0.11
Nodes (34): createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction(), refreshAll(), renameDiagramAction(), renameProjectAction() (+26 more)

### Community 55 - "pipeline.ts"
Cohesion: 0.11
Nodes (20): 4. 도구, clefOpenItems(), createMessage(), abortError(), AI_UNAVAILABLE_MESSAGE, HISTORY_REPLY, KNOWN_OPS, LAYOUT_REPLY (+12 more)

### Community 56 - "ZoneNameLayer.tsx"
Cohesion: 0.14
Nodes (18): GroupBox(), GroupBoxData, groupToggleLabel(), groupToggleWidth(), nodeTypes, EDGE_Z, NODE_Z, ZONE_NAME_IN_PORTAL_Z (+10 more)

### Community 57 - "EdgePanels.tsx"
Cohesion: 0.17
Nodes (15): ALB, EdgePanels(), n(), Panel, PanelEdge, PanelNode, PANELS, PanelView() (+7 more)

### Community 58 - "flowSuggest.ts"
Cohesion: 0.09
Nodes (27): Global Constraints, BodySchema, Ctx, dynamic, maxDuration, POST(), runtime, diagrams (+19 more)

### Community 59 - "[sessionId]/route.ts"
Cohesion: 0.26
Nodes (14): Ctx, DELETE(), dynamic, failed(), GET(), guard(), json(), PATCH() (+6 more)

### Community 60 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 6: E2E — 3E 흐름, 실행 순서

### Community 61 - "Legend.tsx"
Cohesion: 0.19
Nodes (11): EDGE_KINDS, Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), legendPlacement() (+3 more)

### Community 62 - "networkRules.ts"
Cohesion: 0.22
Nodes (15): Task 3: 판정 — 통신 길, 연결 방식 예상 경고, 빠진 정보, BOUNDARY_NODE_KINDS, networkZoneOf(), gradeMethod(), pairKey(), requiredMethod(), CrossingPath, crossingPaths() (+7 more)

### Community 63 - "Shell.tsx"
Cohesion: 0.19
Nodes (11): COMPACT_QUERY, CreateRequest, extentOf(), NARROW_QUERY, PANEL_GAP, RAIL_WIDTH, ShellContext, ShellProvider() (+3 more)

### Community 64 - "types.ts"
Cohesion: 0.16
Nodes (11): ANSWER_INTENTS, CardStep, DoneEvent, isAbort(), MAIN, nextId(), ProgressCard, TurnTarget (+3 more)

### Community 65 - "schema.ts"
Cohesion: 0.15
Nodes (13): db, accounts, ChatSessionKind, createdAt(), explanations, GlossarySource, MessageRole, messages (+5 more)

### Community 66 - "구성도 배치 조화 1단계 — 선택 강조와 선 간격"
Cohesion: 0.12
Nodes (15): 1. 강조 방식: "굵게 + 은은한 빛, 선 종류 색 유지", 2. 함께 지나는 구간: "한 줄기로 묶기", 3. 반복되는 연결 이름: "같은 이름은 한 번만, 개수와 함께", 4. 평행선 간격, 5. 영역 이름 크기: "확대에 맞춰 보정", 6. 접힌 영역 상자: "상자 폭을 이름에 맞춤", 구성도 배치 조화 1단계 — 선택 강조와 선 간격, 내가 정한 것 (사용자 확인 필요) (+7 more)

### Community 67 - "server/network.ts"
Cohesion: 0.19
Nodes (19): networkRules, networkTypes, NetType, NETWORK_TYPE_SEED, addNetworkType(), checkAliases(), checkDescription(), checkGrade() (+11 more)

### Community 68 - "glossary.ts"
Cohesion: 0.18
Nodes (13): Task 2: 용어 사전 시드와 서버 함수, glossaryTerms, normalizeTerm(), pickTerm(), termCandidates(), GLOSSARY_SEED, GlossarySeedEntry, addAiTerm() (+5 more)

### Community 69 - "흐름 보기와 망 경계 표시 — 설계"
Cohesion: 0.14
Nodes (13): A. 흐름, B. 망 경계, 만드는 사람에게 맡기는 것, 목표, 사용자가 정한 것(설계 검토 뒤), 실패로 보는 것, 왜 하는가, 이미 있는 것 (+5 more)

### Community 70 - "domain/warnings.ts"
Cohesion: 0.16
Nodes (17): isDirectCrossing(), categoryOf(), NodeKind, LINK_RULES, DNode, Edge, WarningLevel, ancestorKinds() (+9 more)

### Community 71 - "config.ts"
Cohesion: 0.31
Nodes (7): Qwen URL 정규화, parseEnv(), llmConfig, normalizeQwenBaseUrl(), checkLlmHealth(), LlmHealth, probe()

### Community 72 - "createJsonlParser"
Cohesion: 0.52
Nodes (6): createJsonlParser(), isCommandLine(), Scan, scanLine(), step(), stripWrap()

### Community 73 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, Review Focus, Task 1: 망 영역·망연계 노드·연결 전달물/방향, Task 2: 망 경계 판정·경고·채워야 할 정보, Task 6: AI 흐름 제안(처음 그린 뒤 자동 + 버튼), Task 9: E2E·화면 확인·문서, 흐름 보기와 망 경계 표시 Implementation Plan, FlowCommand

### Community 74 - "domain/explain.ts"
Cohesion: 0.23
Nodes (10): Task 4: 서버 설명 생성, attrText(), endpointOf(), fnv1a(), LIMITS, overLimit(), signatureOf(), TermCandidate (+2 more)

### Community 75 - "NodeCard.tsx"
Cohesion: 0.18
Nodes (11): CategoryIcon(), PATHS, isKeyboardFocus(), NameTooltip(), useNameTooltip(), NodeCard(), Category, DATA (+3 more)

### Community 76 - "lines.ts"
Cohesion: 0.26
Nodes (11): Task 7: 대화창 — 말풍선과 진행 카드, changedOf(), keepsCard(), legacySummaryText(), messagesToLines(), NOT_APPLIED_MESSAGE, Row, summaryText() (+3 more)

### Community 77 - "edgeCoalesce.ts"
Cohesion: 0.24
Nodes (7): Command, AddEdge, createEdgeCoalescer(), EdgeCoalescer, has(), idTaken(), UpdateEdge

### Community 78 - "NODE_KINDS"
Cohesion: 0.25
Nodes (7): 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전, "중단됨" 버전, 빠진 정보 채우기, "모름" 표시, 변경 이력과 비파괴 되돌리기, missingReminder()

### Community 79 - "목표"
Cohesion: 0.11
Nodes (17): 1-1. 망 종류, 1-2. 연결 규칙, 1-3. 망 지식 화면, 1. 망 지식 (지식베이스), 2. 망 영역에 종류 붙이기, 3. 고려가 시작되는 시점, 4. 연결 방식 예상 (안내), 5. AI가 망연계를 넣어 그리기 (+9 more)

### Community 80 - "목표"
Cohesion: 0.20
Nodes (9): 1. 누가 그리나, 2. 어디서 띄우나, 3. 키 관리 (제 판단), 5. 기록과 동시 작업, 6. 브라우저에서 보기 (사용자: "어렵지 않으면 시각 효과도"), 목표, Pattern, patternPromptBlock() (+1 more)

### Community 81 - "createClefClient"
Cohesion: 0.50
Nodes (8): abortError(), createClefClient(), acquire(), classifyIntent(), decide(), post(), release(), run()

### Community 82 - "explain/route.ts"
Cohesion: 0.27
Nodes (9): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+1 more)

### Community 83 - "dialogs.tsx"
Cohesion: 0.28
Nodes (8): Task 8: "흐름" 탭·지나는 흐름·연동, DeleteDialog, Dialog, DialogView(), focusables(), NameDialog, RowMenu(), RowMenuItem

### Community 84 - "Claude Code 연동(MCP 서버) — 설계"
Cohesion: 0.29
Nodes (6): Claude Code 연동(MCP 서버) — 설계, 만드는 사람에게 맡기는 것, 실패로 보는 것, 왜 하는가, 제약, 하지 않는 것

### Community 85 - "2단계 계획: AI 대화"
Cohesion: 0.33
Nodes (5): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409)

### Community 86 - "app/layout.tsx"
Cohesion: 0.33
Nodes (3): metadata, suit, viewport

### Community 87 - "InfraSketch 3B단계: 경고·구성 패턴 구현 계획"
Cohesion: 0.40
Nodes (4): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus

## Knowledge Gaps
- **432 isolated node(s):** `MenuAction`, `MenuItem`, `MenuTarget`, `SidebarProject`, `UseFlowsInput` (+427 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 504 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `DiagramState` to `domain/warnings.ts`, `MissingChecklist.tsx`, `prompt.ts`, `domain/linkGuess.ts`, `설명 생성과 품질 검사`, `getOwnedDiagram`, `RightPanel.tsx`, `server/flows.ts`, `DiagramWorkspace.tsx`, `FlowPanel.tsx`, `ask.ts`, `Canvas.tsx`, `useSessions.ts`, `apply.ts`, `useExplanations.ts`, `NodeInfo.tsx`, `missing.ts`, `samples.ts`, `(app)/actions.ts`, `layoutMetrics.ts`, `projects.ts`, `pipeline.ts`, `flowSuggest.ts`, `networkRules.ts`, `schema.ts`, `server/network.ts`, `domain/warnings.ts`, `Review Focus`, `domain/explain.ts`, `edgeCoalesce.ts`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `MissingChecklist()` connect `MissingChecklist.tsx` to `Review Focus`, `missing.ts`, `NodeCard.tsx`, `NODE_KINDS`, `목표`, `FlowPanel.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `ValidationError` (e.g. with `Task 2: 용어 사전 시드와 서버 함수` and `Task 5: 설명 API`) actually correct?**
  _`ValidationError` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MenuAction`, `MenuItem`, `MenuTarget` to the rest of the system?**
  _432 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useFlows` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `ChatPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11956521739130435 - nodes in this community are weakly interconnected._