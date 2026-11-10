---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1961 nodes · 5481 edges · 84 communities (81 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 292 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7d1185d6`
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
- FlowPanel.tsx
- useCamera.ts
- SessionPicker.tsx
- domain/flows.ts
- 라우트 재수출
- DiagramWorkspace.tsx
- ref_react
- read.ts
- EdgeLayer.tsx
- commands.ts
- types.ts
- NodeMenu
- ask.ts
- Canvas.tsx
- 3C-1 계획 작업 목록
- ask/route.ts
- domain/apply.ts
- layoutMetrics.ts
- normalize.ts
- NodeInfo.tsx
- FlyLayer.tsx
- Explanation.tsx
- ExportMenu.tsx
- deps.ts
- chat/warnings.ts
- edgeLabels.ts
- server/flows.ts
- useRemoteChanges.ts
- missing.ts
- clef.ts
- auth
- Review Focus
- (app)/actions.ts
- Layout
- samples.ts
- display.ts
- mcp/apply.ts
- ref_react
- GlossaryPage.tsx
- projects.ts
- pipeline.ts
- Claude Code 연동(MCP 서버) — 설계
- EdgePanels.tsx
- flowSuggest.ts
- [sessionId]/route.ts
- Review Focus
- Legend.tsx
- motion.ts
- Shell.tsx
- useChatTurn.ts
- Review Focus
- 구성도 배치 조화 1단계 — 선택 강조와 선 간격
- server/network.ts
- mcp/route.ts
- 흐름 보기와 망 경계 표시 — 설계
- 파일 구조
- deps.ts
- createJsonlParser
- settle.ts
- domain/explain.ts
- NodeCard.tsx
- EdgeLayerProps
- edgeCoalesce.ts
- SkipTally
- 목표
- schema.ts
- Global Constraints
- 흐름 보기와 망 경계 표시 Implementation Plan
- dialogs.tsx

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 60 edges
2. `ValidationError` - 56 edges
3. `getOwnedDiagram()` - 53 edges
4. `DiagramWorkspace()` - 48 edges
5. `lockedTurn()` - 38 edges
6. `NotFoundError` - 36 edges
7. `Flow()` - 36 edges
8. `InfraSketch 설계 문서` - 34 edges
9. `auth` - 34 edges
10. `runResult()` - 33 edges

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

## Communities (84 total, 3 thin omitted)

### Community 0 - "Sidebar.tsx"
Cohesion: 0.13
Nodes (30): createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction(), refreshAll(), renameDiagramAction(), renameProjectAction() (+22 more)

### Community 1 - "useFlows"
Cohesion: 0.17
Nodes (9): Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인, confirmFlowAction(), deleteFlowAction(), removeFlowStepAction(), renameFlowAction(), GENERIC_ERROR, message(), useFlows (+1 more)

### Community 2 - "segments.ts"
Cohesion: 0.19
Nodes (19): Task 2: 평소 화면 평행선 16px, 연결선 모양과 움직임, assignStarts(), buildSegmentBundles(), buildSegs(), InEdge, normalize(), Piece (+11 more)

### Community 3 - "NetworkKnowledgePage.tsx"
Cohesion: 0.15
Nodes (29): Task 9: 망 지식 화면, ActionResult, addNetworkTypeAction(), bad(), countNetworkTypeUsageAction(), deleteNetworkRuleAction(), deleteNetworkTypeAction(), reqGrade() (+21 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.08
Nodes (27): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), Block, BUILD_STEPS, CardView(), ChatPanel(), ChatPanelProps, Check() (+19 more)

### Community 5 - "domain/warnings.ts"
Cohesion: 0.11
Nodes (27): Task 3: 판정 — 통신 길, 연결 방식 예상 경고, 빠진 정보, BOUNDARY_NODE_KINDS, isDirectCrossing(), categoryOf(), NodeKind, CrossingPath, evaluateNetworkRules(), LINK_GUIDE (+19 more)

### Community 6 - "InfraSketch 설계 문서"
Cohesion: 0.10
Nodes (24): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), "중단됨" 버전, 이상한 구성 경고 (+16 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.15
Nodes (15): Block, blocksOf(), ChecklistDraft, ChecklistDrafts, ChecklistExpanded, Chevron(), CHOICES, Draft (+7 more)

### Community 8 - "layout.ts"
Cohesion: 0.08
Nodes (42): Task 6: 영역 이름 크기 보정과 접힌 상자 폭, DisplayOptions, elbowRoute(), Pt, azChipWidth(), azOf(), BASE_OPTIONS, COLLAPSED_MAX_WIDTH (+34 more)

### Community 9 - "prompt.ts"
Cohesion: 0.07
Nodes (45): Task 1: 그리기 규칙 공용 모듈, gradeMethod(), pairKey(), requiredMethod(), Pattern, patternPromptBlock(), PATTERNS, ancestorsOf() (+37 more)

### Community 10 - "Review Focus"
Cohesion: 0.11
Nodes (17): Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저), Task 11: 빈 구성도 시작 경험 — 인사말·가이드·예시 질문 (사용자 추가 요청, 2026-10-30), Task 12: 대화에서 캔버스로 날아가는 빛점 (사용자 추가 요청, 2026-10-30), Task 13: 도구 모음 정리와 스크롤 정리 (사용자 추가 요청, 2026-10-30), Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙 (+9 more)

### Community 11 - "domain/linkGuess.ts"
Cohesion: 0.31
Nodes (12): Task 4: 되돌리기 도메인 — 대신한 연결 기록, 되돌리기, 흐름 단계 나누기·합치기, FlowStep, has(), incident(), recordReplaced(), revertLinkGuess(), sameSet(), StepMerge (+4 more)

### Community 12 - "exportImage.ts"
Cohesion: 0.09
Nodes (27): Review Focus, Task 1: 배치 측정 모듈과 기준선 테스트, Task 4: 강조 겹선 층(선택·호버)과 갈림점·움직임 층, Task 5: 같은 연결 이름 합치기, Task 7: 화면 확인, 전후 비교, E2E, 문서 동기화, 제약, buildStage(), CHROME (+19 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.09
Nodes (30): explanations, ExplanationTargetKind, codePoints(), dbRepo, DepsInput, Draft, draftOf(), easeScore() (+22 more)

### Community 14 - "getOwnedDiagram"
Cohesion: 0.19
Nodes (27): Task 4: "의도된 구성" 저장, Task 7: 서버 액션 — 망 종류 확인·바꾸기, 망연계 맞아요·아니에요, confirmAssumption(), noLinkKey(), parseNoLinkKey(), STRUCTURAL_KEYS, mergeFlowSteps(), crossingPaths() (+19 more)

### Community 15 - "FlowPanel.tsx"
Cohesion: 0.13
Nodes (12): FlowOrigin, Dialog, DialogView(), focusables(), NameDialog, RowMenuItem, Action, FlowPanel() (+4 more)

### Community 16 - "useCamera.ts"
Cohesion: 0.10
Nodes (25): LaidOutGroup, LaidOutNode, Rect, NavItem, CameraInput, EDGE_GAP_PX, FINAL_FIT_DURATION, FitOptions (+17 more)

### Community 17 - "SessionPicker.tsx"
Cohesion: 0.14
Nodes (16): Action, byRecent(), Chevron(), MAIN_LABEL, menuRootId(), MORE_LABEL, pad(), Plus() (+8 more)

### Community 18 - "domain/flows.ts"
Cohesion: 0.18
Nodes (20): Review Focus, Task 1: 망 영역·망연계 노드·연결 전달물/방향, Task 2: 망 경계 판정·경고·채워야 할 정보, Task 3: 흐름 도메인(모양·검사·끊김), Task 8: "흐름" 탭·지나는 흐름·연동, Task 9: E2E·화면 확인·문서, crossesBoundary(), networkZoneOf() (+12 more)

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.07
Nodes (35): assumptionChangeMessage(), diffStates(), equal(), NetworkKnowledge, escapeBelongsElsewhere(), hasId(), MOBILE_VIEW_KEY, Mode (+27 more)

### Community 21 - "ref_react"
Cohesion: 0.12
Nodes (15): Task 5: 주의 항목 바로 가기, parseLinkWarningId(), ZoneType, CardMeasure, Chevron(), Count(), GuessedZones(), InfoCard() (+7 more)

### Community 22 - "read.ts"
Cohesion: 0.13
Nodes (29): File Structure, Task 10: E2E와 문서, Task 3: 키 만들기·확인, Task 6: 읽기 서비스와 안내서, applyMcpCommands(), restoreMcpVersion(), createDiagramForMcp(), createProjectForMcp() (+21 more)

### Community 23 - "EdgeLayer.tsx"
Cohesion: 0.18
Nodes (16): Box, ARROW, arrowD(), DIR, DIR_D, EdgeLayer(), EdgeLayerPortal(), motionOf() (+8 more)

### Community 24 - "commands.ts"
Cohesion: 0.10
Nodes (18): attrs, COMMAND_OPS, commandSchema, direction, edgeKind, FLOW_OPS, flowName, flowNote (+10 more)

### Community 25 - "types.ts"
Cohesion: 0.22
Nodes (10): 가정 목록 (구조 결정), DisplayGroup, ASSUMPTION_CHOICES, ASSUMPTION_LABELS, Assumption, Group, AssumptionChips(), AssumptionChipsProps (+2 more)

### Community 26 - "NodeMenu"
Cohesion: 0.48
Nodes (3): NodeMenu(), NodeMenuProps, placeMenu()

### Community 27 - "ask.ts"
Cohesion: 0.18
Nodes (18): Task 2: 질문 차례(서버), isAssumptionChangeMessage(), AskArgs, askInSession(), HANDOFF_REPLY, hasNode(), lockedAsk(), runAskTurn() (+10 more)

### Community 28 - "Canvas.tsx"
Cohesion: 0.06
Nodes (46): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, Task 3: 강조 토큰과 노드·영역 흐림, canvasAriaLabels(), DIRECTION, zoneDescription(), Canvas(), CanvasOptions, CanvasProps (+38 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.14
Nodes (13): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+5 more)

### Community 30 - "ask/route.ts"
Cohesion: 0.12
Nodes (22): BodySchema, dynamic, json(), maxDuration, POST(), runtime, BodySchema, dynamic (+14 more)

### Community 31 - "domain/apply.ts"
Cohesion: 0.35
Nodes (10): applyCommand(), applyCommands(), ApplyOptions, ApplyResult, endpointOk(), fail(), has(), idTaken() (+2 more)

### Community 32 - "layoutMetrics.ts"
Cohesion: 0.13
Nodes (21): Global Constraints, 구성도 배치 조화 1단계 — 선택 강조와 선 간격 Implementation Plan, FlowProps, DisplayGraph, Layout, END_TRIM, hi(), isH() (+13 more)

### Community 33 - "normalize.ts"
Cohesion: 0.14
Nodes (15): Global Constraints, 망 종류 지식과 망연계 예상 Implementation Plan, DIRECTIONS, DROP_NULL, flattenAttr(), HAS_ATTRS, HAS_STEPS, ID_FIELDS (+7 more)

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.10
Nodes (24): Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), Flow, FIELD_LABELS, isEmpty(), AskNode(), AskNodeProps, CautionProps, Cautions() (+16 more)

### Community 35 - "FlyLayer.tsx"
Cohesion: 0.09
Nodes (21): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+13 more)

### Community 36 - "Explanation.tsx"
Cohesion: 0.16
Nodes (20): EdgeExplanation, NodeExplanation, ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), ExplanationProps, NodeBody() (+12 more)

### Community 37 - "ExportMenu.tsx"
Cohesion: 0.13
Nodes (17): ExportBackground, ExportFormat, LIGHT_BACKGROUND, BACKGROUNDS, EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON, EXPORT_FAILED_MESSAGE (+9 more)

### Community 38 - "deps.ts"
Cohesion: 0.23
Nodes (10): Task 5: 설명 API, defaultChatDeps(), setChatDepsForTest(), resolveDeps(), abortError(), ChatMessage, createQwenClient(), attempt() (+2 more)

### Community 39 - "chat/warnings.ts"
Cohesion: 0.26
Nodes (16): Task 2: 서버 점검 — Clef 판정과 Qwen 문구, buildWarningMessages(), carryExposed(), checkCodeWarnings(), checkWarnings(), describeTarget(), flaggedPublic(), isLinkRule() (+8 more)

### Community 40 - "edgeLabels.ts"
Cohesion: 0.09
Nodes (40): Task 7: 캔버스 흐름 강조·단계 글자·경계 표시, alongCandidates(), AlongItem, arcOf(), Beside, besideNode(), boundaryDotAt(), boxOf() (+32 more)

### Community 41 - "server/flows.ts"
Cohesion: 0.11
Nodes (23): Ctx, dynamic, GET(), runtime, Ctx, dynamic, GET(), runtime (+15 more)

### Community 42 - "useRemoteChanges.ts"
Cohesion: 0.22
Nodes (9): Task 9: 열어 둔 브라우저가 변경을 알아채기, Head, isHead(), POLL_MS, read(), REMOTE_CHANGED, REMOTE_LOAD, useRemoteChanges() (+1 more)

### Community 43 - "missing.ts"
Cohesion: 0.20
Nodes (13): 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전, 빠진 정보 채우기, 노드 종류 목록 (kind·group_kind·edge_kind), "모름" 표시, NODE_KINDS, computeMissing(), labelOf() (+5 more)

### Community 44 - "clef.ts"
Cohesion: 0.15
Nodes (18): abortError(), ClefAnswer, ClefAnswers, ClefHttpError, createClefClient(), acquire(), classifyIntent(), decide() (+10 more)

### Community 45 - "auth"
Cohesion: 0.14
Nodes (20): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+12 more)

### Community 46 - "Review Focus"
Cohesion: 0.29
Nodes (6): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 5: E2E — 노드 질문 흐름, 실행 순서

### Community 47 - "(app)/actions.ts"
Cohesion: 0.13
Nodes (35): Task 8: 키 화면, clearPinnedAction(), confirmAssumptionAction(), confirmLinkGuessAction(), getVersionAction(), importSampleAction(), listMcpKeysAction(), listMessagesAction() (+27 more)

### Community 48 - "Layout"
Cohesion: 0.39
Nodes (7): GROUP_PAD, circleHitsRect(), findOverlaps(), grow(), intersects(), PAIR_BADGE_OFFSET, strictlyInside()

### Community 49 - "samples.ts"
Cohesion: 0.12
Nodes (16): AddEdge, AddGroup, AddNode, AUX_NODE_KINDS, convertSpikeScenario(), EDGE_KIND_MAP, EDGE_KIND_SET, NODE_KIND_SET (+8 more)

### Community 50 - "display.ts"
Cohesion: 0.15
Nodes (18): PanelEdge, drawnId(), buildDisplayGraph(), defaultDisplayOptions(), DisplayEdge, displayEdgeFor(), initialCollapsed(), isBus() (+10 more)

### Community 51 - "mcp/apply.ts"
Cohesion: 0.12
Nodes (26): FLOW_LIMITS, FlowOp, applyFlowOps(), rewriteFlows(), Checked, isFlowOnly(), KNOWN_OPS, lockedApply() (+18 more)

### Community 52 - "ref_react"
Cohesion: 0.06
Nodes (63): AuthField(), AuthShowcase(), AuthSubmit(), Props, SAMPLE, FieldErrors, Options, useAuthForm() (+55 more)

### Community 53 - "GlossaryPage.tsx"
Cohesion: 0.14
Nodes (21): listGlossaryAction(), setTermReviewedAction(), updateTermAction(), Glossary(), glossaryTerms, GLOSSARY_SEED, GlossarySeedEntry, GlossaryItem (+13 more)

### Community 54 - "projects.ts"
Cohesion: 0.18
Nodes (23): assertOwnedProject(), assertUniqueDiagramName(), assertUniqueProjectName(), assertUuid(), cleanName(), clip(), coord, copyName() (+15 more)

### Community 55 - "pipeline.ts"
Cohesion: 0.13
Nodes (28): Task 5: 대화 차례의 흐름 명령, isFlowCommand(), isStructural(), parseCommand(), toFlowOp(), asksStepText(), keepStepText(), splitFlowSteps() (+20 more)

### Community 56 - "Claude Code 연동(MCP 서버) — 설계"
Cohesion: 0.15
Nodes (12): 1. 누가 그리나, 2. 어디서 띄우나, 3. 키 관리 (제 판단), 5. 기록과 동시 작업, 6. 브라우저에서 보기 (사용자: "어렵지 않으면 시각 효과도"), Claude Code 연동(MCP 서버) — 설계, 만드는 사람에게 맡기는 것, 목표 (+4 more)

### Community 57 - "EdgePanels.tsx"
Cohesion: 0.21
Nodes (12): ALB, EdgePanels(), n(), Panel, PanelNode, PANELS, PanelView(), Pt (+4 more)

### Community 58 - "flowSuggest.ts"
Cohesion: 0.10
Nodes (21): BodySchema, Ctx, dynamic, maxDuration, POST(), runtime, diagrams, complete() (+13 more)

### Community 59 - "[sessionId]/route.ts"
Cohesion: 0.12
Nodes (28): Ctx, DELETE(), dynamic, failed(), GET(), guard(), json(), PATCH() (+20 more)

### Community 60 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 6: E2E — 3E 흐름, 실행 순서

### Community 61 - "Legend.tsx"
Cohesion: 0.19
Nodes (11): EDGE_KINDS, Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), legendPlacement() (+3 more)

### Community 62 - "motion.ts"
Cohesion: 0.26
Nodes (11): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+3 more)

### Community 63 - "Shell.tsx"
Cohesion: 0.16
Nodes (16): AppLayout(), Home(), lastActiveDiagram(), listProjects(), COMPACT_QUERY, CreateButton(), CreateRequest, extentOf() (+8 more)

### Community 64 - "useChatTurn.ts"
Cohesion: 0.08
Nodes (39): Warning, MessageMeta, SessionEventPayload, changedOf(), keepsCard(), legacySummaryText(), messagesToLines(), NOT_APPLIED_MESSAGE (+31 more)

### Community 65 - "Review Focus"
Cohesion: 0.22
Nodes (11): Review Focus, Task 10: E2E 와 문서, Task 1: 망 지식 도메인 — 타입, 기본 제공 목록, 필요한 방식 계산, Task 2: 구성도 상태 — 망 종류 칸, `set_zone_type`, 망연계 추정 표시 명령, Task 5: DB와 서버 — 망 지식 테이블, 기본 제공 채우기, 읽기·고치기, Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검, Task 8: 구성도 화면 — 지식 전달, 안내 카드, 빠진 정보 줄, 망연계 노드 표시, buildFlowSuggestMessages() (+3 more)

### Community 66 - "구성도 배치 조화 1단계 — 선택 강조와 선 간격"
Cohesion: 0.12
Nodes (15): 1. 강조 방식: "굵게 + 은은한 빛, 선 종류 색 유지", 2. 함께 지나는 구간: "한 줄기로 묶기", 3. 반복되는 연결 이름: "같은 이름은 한 번만, 개수와 함께", 4. 평행선 간격, 5. 영역 이름 크기: "확대에 맞춰 보정", 6. 접힌 영역 상자: "상자 폭을 이름에 맞춤", 구성도 배치 조화 1단계 — 선택 강조와 선 간격, 내가 정한 것 (사용자 확인 필요) (+7 more)

### Community 67 - "server/network.ts"
Cohesion: 0.15
Nodes (24): GRADE_LABELS, GRADE_RULES, LinkMethod, METHOD_LABELS, NetGrade, NetRule, NetType, NETWORK_TYPE_SEED (+16 more)

### Community 68 - "mcp/route.ts"
Cohesion: 0.25
Nodes (9): Task 7: MCP 라우트와 도구, bearerKey(), DELETE(), dynamic, GET(), notAllowed(), POST(), runtime (+1 more)

### Community 69 - "흐름 보기와 망 경계 표시 — 설계"
Cohesion: 0.14
Nodes (13): A. 흐름, B. 망 경계, 만드는 사람에게 맡기는 것, 목표, 사용자가 정한 것(설계 검토 뒤), 실패로 보는 것, 왜 하는가, 이미 있는 것 (+5 more)

### Community 70 - "파일 구조"
Cohesion: 0.20
Nodes (9): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus, Task 1: 경고 규칙과 구성 패턴(도메인), Task 3: 대화 차례에 점검 단계 넣기, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름 (+1 more)

### Community 71 - "deps.ts"
Cohesion: 0.18
Nodes (10): Qwen URL 정규화, GET(), env, envSchema, parseEnv(), llmConfig, normalizeQwenBaseUrl(), checkLlmHealth() (+2 more)

### Community 72 - "createJsonlParser"
Cohesion: 0.29
Nodes (10): Task 6: AI 흐름 제안(처음 그린 뒤 자동 + 버튼), FlowCommand, createJsonlParser(), isCommandLine(), Scan, scanLine(), step(), stripWrap() (+2 more)

### Community 73 - "settle.ts"
Cohesion: 0.57
Nodes (6): Task 4: 차례 끝 정리 공용화와 코드 경고 점검, isEmptyGroup(), pruneEmptyGroups(), splitsFor(), prunedOrder(), settleTurn()

### Community 74 - "domain/explain.ts"
Cohesion: 0.12
Nodes (28): Task 2: 용어 사전 시드와 서버 함수, Task 4: 서버 설명 생성, Task 7: 설명 큐와 연결, listTermsAction(), attrText(), endpointOf(), fnv1a(), LIMITS (+20 more)

### Community 75 - "NodeCard.tsx"
Cohesion: 0.11
Nodes (24): GroupBox(), GroupBoxData, CategoryIcon(), PATHS, groupToggleLabel(), groupToggleWidth(), isKeyboardFocus(), NameTooltip() (+16 more)

### Community 76 - "EdgeLayerProps"
Cohesion: 0.50
Nodes (3): Task 2: 마우스 강조·흐리기, EdgeLayerProps, NodeVisualState

### Community 77 - "edgeCoalesce.ts"
Cohesion: 0.27
Nodes (9): Task 5: MCP 고치기·되돌리기 서비스, freeEdgeId(), Command, AddEdge, createEdgeCoalescer(), EdgeCoalescer, has(), idTaken() (+1 more)

### Community 79 - "목표"
Cohesion: 0.11
Nodes (17): 1-1. 망 종류, 1-2. 연결 규칙, 1-3. 망 지식 화면, 1. 망 지식 (지식베이스), 2. 망 영역에 종류 붙이기, 3. 고려가 시작되는 시점, 4. 연결 방식 예상 (안내), 5. AI가 망연계를 넣어 그리기 (+9 more)

### Community 80 - "schema.ts"
Cohesion: 0.08
Nodes (30): Task 2: 키 테이블과 버전 칸, 4. 도구, db, Tx, accounts, createdAt(), diagramVersions, flows (+22 more)

### Community 81 - "Global Constraints"
Cohesion: 0.50
Nodes (3): Claude Code 연동(MCP 서버) Implementation Plan, Global Constraints, Review Focus

### Community 83 - "dialogs.tsx"
Cohesion: 0.24
Nodes (10): createMcpKeyAction(), deleteMcpKeyAction(), McpKeyRow, ClaudeCodeConnection(), deleteMcpKey(), listMcpKeys(), commandFor(), day() (+2 more)

## Knowledge Gaps
- **462 isolated node(s):** `MenuAction`, `MenuItem`, `MenuTarget`, `SidebarProject`, `UseFlowsInput` (+457 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 538 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `getOwnedDiagram` to `domain/warnings.ts`, `MissingChecklist.tsx`, `layout.ts`, `prompt.ts`, `domain/linkGuess.ts`, `설명 생성과 품질 검사`, `FlowPanel.tsx`, `domain/flows.ts`, `DiagramWorkspace.tsx`, `ref_react`, `read.ts`, `ask.ts`, `Canvas.tsx`, `domain/apply.ts`, `layoutMetrics.ts`, `NodeInfo.tsx`, `chat/warnings.ts`, `server/flows.ts`, `missing.ts`, `(app)/actions.ts`, `samples.ts`, `display.ts`, `mcp/apply.ts`, `projects.ts`, `pipeline.ts`, `flowSuggest.ts`, `useChatTurn.ts`, `server/network.ts`, `settle.ts`, `domain/explain.ts`, `edgeCoalesce.ts`, `schema.ts`, `흐름 보기와 망 경계 표시 Implementation Plan`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `DiagramWorkspace()` connect `(app)/actions.ts` to `useChatTurn.ts`, `useFlows`, `NodeInfo.tsx`, `FlyLayer.tsx`, `Sidebar.tsx`, `Review Focus`, `domain/explain.ts`, `useRemoteChanges.ts`, `auth`, `getOwnedDiagram`, `domain/flows.ts`, `display.ts`, `DiagramWorkspace.tsx`, `ref_react`, `pipeline.ts`, `Canvas.tsx`, `Legend.tsx`, `domain/apply.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `applyCommand()` connect `domain/apply.ts` to `normalize.ts`, `파일 구조`, `settle.ts`, `Review Focus`, `edgeCoalesce.ts`, `(app)/actions.ts`, `Global Constraints`, `흐름 보기와 망 경계 표시 Implementation Plan`, `mcp/apply.ts`, `DiagramWorkspace.tsx`, `pipeline.ts`, `Claude Code 연동(MCP 서버) — 설계`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `ValidationError` (e.g. with `Task 2: 용어 사전 시드와 서버 함수` and `Task 5: 설명 API`) actually correct?**
  _`ValidationError` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MenuAction`, `MenuItem`, `MenuTarget` to the rest of the system?**
  _462 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13068181818181818 - nodes in this community are weakly interconnected._