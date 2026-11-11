---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1979 nodes · 5529 edges · 97 communities (92 shown, 5 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 293 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0b152cb6`
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
- drawing/rules.ts
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
- domain/flows.ts
- 라우트 재수출
- DiagramWorkspace.tsx
- ref_react
- read.ts
- EdgeLayer.tsx
- ZoneNameLayer.tsx
- samples.ts
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
- MentionInput
- edgeLabels.ts
- schema.ts
- useRemoteChanges.ts
- NODE_KINDS
- clef.ts
- [diagramId]/page.tsx
- Review Focus
- (app)/actions.ts
- chat/warnings.ts
- Command
- useDiagramView.ts
- mcp/apply.ts
- ref_react
- GlossaryPage.tsx
- projects.ts
- pipeline.ts
- GhostLayer.tsx
- EdgePanels.tsx
- flowSuggest.ts
- [sessionId]/route.ts
- Review Focus
- Legend.tsx
- explain/route.ts
- Shell.tsx
- useChatTurn.ts
- Review Focus
- 구성도 배치 조화 1단계 — 선택 강조와 선 간격
- server/network.ts
- useSessions.ts
- 흐름 보기와 망 경계 표시 — 설계
- FlowPanel.tsx
- deps.ts
- createJsonlParser
- createClefClient
- domain/explain.ts
- networkRules.ts
- health.ts
- commands.ts
- QwenClient
- domain/assumptions.ts
- 목표
- motion.ts
- domain/explain.ts
- dialogs.tsx
- useChatTurn
- Task 2: 서버 점검 — Clef 판정과 Qwen 문구
- networkBlock
- settle.ts
- Claude Code 연동(MCP 서버) — 설계
- 2단계 계획: AI 대화
- ExplanationProps
- InfraSketch 3B단계: 경고·구성 패턴 구현 계획
- SkipTally
- easeScore
- buildFlowSuggestMessages
- 흐름 보기와 망 경계 표시 Implementation Plan
- Claude Code 연동(MCP 서버) Implementation Plan

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 61 edges
2. `ValidationError` - 56 edges
3. `getOwnedDiagram()` - 53 edges
4. `DiagramWorkspace()` - 48 edges
5. `lockedTurn()` - 40 edges
6. `NotFoundError` - 36 edges
7. `Flow()` - 36 edges
8. `InfraSketch 설계 문서` - 34 edges
9. `auth` - 34 edges
10. `runResult()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `5. 기록과 동시 작업` --references--> `withDiagramLock()`  [INFERRED]
  docs/superpowers/specs/2026-11-06-mcp-server-design.md → src/server/chat/lock.ts
- `2. 망 영역에 종류 붙이기` --references--> `MissingChecklist()`  [INFERRED]
  docs/superpowers/specs/2026-11-06-network-character-and-link-guess-design.md → src/ui/chat/MissingChecklist.tsx
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

## Communities (97 total, 5 thin omitted)

### Community 0 - "Sidebar.tsx"
Cohesion: 0.17
Nodes (21): LogoMark(), ShellValue, deleteMessage(), diagramPath(), IconBook(), IconClose(), IconCollapse(), IconExpand() (+13 more)

### Community 1 - "useFlows"
Cohesion: 0.15
Nodes (10): Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인, confirmFlowAction(), deleteFlowAction(), removeFlowStepAction(), renameFlowAction(), createdAt(), GENERIC_ERROR, message() (+2 more)

### Community 2 - "segments.ts"
Cohesion: 0.17
Nodes (21): Task 2: 평소 화면 평행선 16px, 연결선 모양과 움직임, assignStarts(), BASE_SPEED, buildSegmentBundles(), buildSegs(), Bundle, InEdge (+13 more)

### Community 3 - "NetworkKnowledgePage.tsx"
Cohesion: 0.15
Nodes (28): Task 9: 망 지식 화면, ActionResult, addNetworkTypeAction(), bad(), countNetworkTypeUsageAction(), deleteNetworkRuleAction(), deleteNetworkTypeAction(), reqGrade() (+20 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.12
Nodes (21): Block, BUILD_STEPS, CardView(), ChatPanel(), ChatPanelProps, Check(), CHIP_KINDS, Dots() (+13 more)

### Community 5 - "domain/warnings.ts"
Cohesion: 0.16
Nodes (18): categoryOf(), NodeKind, DNode, Edge, WarningLevel, ancestorKinds(), DATA_KINDS, evaluateRules() (+10 more)

### Community 6 - "InfraSketch 설계 문서"
Cohesion: 0.14
Nodes (17): 대화 차례 파이프라인, 이상한 구성 경고, 로그인·회원 (Auth.js Credentials), 자동 배치 (ELK layered), 변경 명령 (add_node·add_edge·set_assumption 등), Clef-Flash 판정 모델, InfraSketch 설계 문서, 설명 패널 (+9 more)

### Community 7 - "drawing/rules.ts"
Cohesion: 0.15
Nodes (18): FIELD_LABELS, ATTR_LIST, byStr(), COMMAND_EXAMPLES, DRAW_RULE_GROUPS, DRAW_RULES, EDGE_KIND_LIST, gradeRuleLines() (+10 more)

### Community 8 - "layout.ts"
Cohesion: 0.08
Nodes (38): Task 6: 영역 이름 크기 보정과 접힌 상자 폭, tagDetail(), elbowRoute(), Pt, azChipWidth(), azOf(), BASE_OPTIONS, COLLAPSED_MAX_WIDTH (+30 more)

### Community 9 - "prompt.ts"
Cohesion: 0.09
Nodes (26): ancestorsOf(), ANSWER_PROMPT, ASK_PROMPT, buildExplainMessages(), commandLine(), CONTINUE_NOTE, describeEndpoint(), EXPLAIN_EDGE_PROMPT (+18 more)

### Community 10 - "Review Focus"
Cohesion: 0.12
Nodes (16): Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저), Task 11: 빈 구성도 시작 경험 — 인사말·가이드·예시 질문 (사용자 추가 요청, 2026-10-30), Task 12: 대화에서 캔버스로 날아가는 빛점 (사용자 추가 요청, 2026-10-30), Task 13: 도구 모음 정리와 스크롤 정리 (사용자 추가 요청, 2026-10-30), Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙 (+8 more)

### Community 11 - "domain/linkGuess.ts"
Cohesion: 0.35
Nodes (11): Task 4: 되돌리기 도메인 — 대신한 연결 기록, 되돌리기, 흐름 단계 나누기·합치기, FlowStep, has(), incident(), recordReplaced(), revertLinkGuess(), sameSet(), StepMerge (+3 more)

### Community 12 - "exportImage.ts"
Cohesion: 0.10
Nodes (26): Review Focus, Task 4: 강조 겹선 층(선택·호버)과 갈림점·움직임 층, Task 5: 같은 연결 이름 합치기, Task 7: 화면 확인, 전후 비교, E2E, 문서 동기화, 제약, buildStage(), CHROME, decodeSvgDataUrl() (+18 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.11
Nodes (26): explanations, ExplanationTargetKind, overLimit(), cachedNodeExplanation(), codePoints(), dbRepo, DepsInput, Draft (+18 more)

### Community 14 - "getOwnedDiagram"
Cohesion: 0.15
Nodes (33): Task 4: "의도된 구성" 저장, Task 7: 서버 액션 — 망 종류 확인·바꾸기, 망연계 맞아요·아니에요, File Structure, Task 10: E2E와 문서, Task 2: 키 테이블과 버전 칸, Task 5: MCP 고치기·되돌리기 서비스, confirmAssumption(), noLinkKey() (+25 more)

### Community 15 - "RightPanel.tsx"
Cohesion: 0.18
Nodes (9): HistoryPanel(), HistoryPanelProps, SOURCE_LABEL, VersionRow, RIGHT_PANEL_BODY_ID, RightPanel(), RightPanelProps, tabIdOf() (+1 more)

### Community 16 - "useCamera.ts"
Cohesion: 0.10
Nodes (25): LaidOutGroup, LaidOutNode, Rect, NavItem, CameraInput, EDGE_GAP_PX, FINAL_FIT_DURATION, FitOptions (+17 more)

### Community 17 - "SessionPicker.tsx"
Cohesion: 0.14
Nodes (17): Action, byRecent(), Chevron(), MAIN_LABEL, menuRootId(), MORE_LABEL, pad(), Plus() (+9 more)

### Community 18 - "domain/flows.ts"
Cohesion: 0.10
Nodes (31): Review Focus, Task 2: 망 경계 판정·경고·채워야 할 정보, Task 3: 흐름 도메인(모양·검사·끊김), Task 8: "흐름" 탭·지나는 흐름·연동, Task 9: E2E·화면 확인·문서, Ctx, dynamic, GET() (+23 more)

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.11
Nodes (23): NetworkKnowledge, SessionPaging, DiagramWorkspaceProps, escapeBelongsElsewhere(), hasId(), MOBILE_VIEW_KEY, Mode, NO_SESSIONS (+15 more)

### Community 21 - "ref_react"
Cohesion: 0.07
Nodes (32): Task 5: 주의 항목 바로 가기, parseLinkWarningId(), ZoneType, CardMeasure, Chevron(), Count(), GuessedZones(), InfoCard() (+24 more)

### Community 22 - "read.ts"
Cohesion: 0.09
Nodes (38): Task 6: 읽기 서비스와 안내서, Task 7: MCP 라우트와 도구, bearerKey(), DELETE(), dynamic, GET(), notAllowed(), POST() (+30 more)

### Community 23 - "EdgeLayer.tsx"
Cohesion: 0.15
Nodes (23): Task 7: 캔버스 흐름 강조·단계 글자·경계 표시, boundaryDotAt(), boxOf(), labelBox(), placeAlong(), ringOf(), stepLabels(), stepNumberOnly() (+15 more)

### Community 24 - "ZoneNameLayer.tsx"
Cohesion: 0.11
Nodes (22): GroupBox(), GroupBoxData, groupToggleLabel(), groupToggleWidth(), nodeTypes, EDGE_Z, NODE_Z, ZONE_NAME_IN_PORTAL_Z (+14 more)

### Community 25 - "samples.ts"
Cohesion: 0.12
Nodes (15): AddEdge, AddGroup, AddNode, AUX_NODE_KINDS, convertSpikeScenario(), EDGE_KIND_MAP, EDGE_KIND_SET, NODE_KIND_SET (+7 more)

### Community 26 - "NodeMenu"
Cohesion: 0.48
Nodes (3): NodeMenu(), NodeMenuProps, placeMenu()

### Community 27 - "ask.ts"
Cohesion: 0.19
Nodes (17): Task 2: 질문 차례(서버), AskArgs, askInSession(), HANDOFF_REPLY, hasNode(), lockedAsk(), runAskTurn(), ChatEvent (+9 more)

### Community 28 - "Canvas.tsx"
Cohesion: 0.06
Nodes (42): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, Task 3: 강조 토큰과 노드·영역 흐림, canvasAriaLabels(), DIRECTION, zoneDescription(), Canvas(), CanvasOptions, CanvasProps (+34 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.12
Nodes (15): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+7 more)

### Community 30 - "ask/route.ts"
Cohesion: 0.11
Nodes (24): BodySchema, dynamic, json(), maxDuration, POST(), runtime, BodySchema, dynamic (+16 more)

### Community 31 - "domain/apply.ts"
Cohesion: 0.33
Nodes (11): applyCommand(), applyCommands(), ApplyOptions, ApplyResult, endpointOk(), fail(), freeEdgeId(), has() (+3 more)

### Community 32 - "layoutMetrics.ts"
Cohesion: 0.10
Nodes (31): Task 1: 배치 측정 모듈과 기준선 테스트, drawnId(), buildDisplayGraph(), defaultDisplayOptions(), DisplayEdge, displayEdgeFor(), initialCollapsed(), isBus() (+23 more)

### Community 33 - "normalize.ts"
Cohesion: 0.19
Nodes (12): DIRECTIONS, DROP_NULL, flattenAttr(), HAS_ATTRS, HAS_STEPS, ID_FIELDS, isPlainObject(), NEEDS_PARENT (+4 more)

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.10
Nodes (22): Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), isEmpty(), AskNode(), AskNodeProps, CautionProps, Cautions(), DIRECTION_NAME, edgeKindName() (+14 more)

### Community 35 - "FlyLayer.tsx"
Cohesion: 0.15
Nodes (13): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+5 more)

### Community 36 - "Explanation.tsx"
Cohesion: 0.22
Nodes (16): ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), NodeBody(), Retry(), Rewrite(), Section() (+8 more)

### Community 37 - "ExportMenu.tsx"
Cohesion: 0.13
Nodes (17): ExportBackground, ExportFormat, LIGHT_BACKGROUND, BACKGROUNDS, EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON, EXPORT_FAILED_MESSAGE (+9 more)

### Community 38 - "deps.ts"
Cohesion: 0.36
Nodes (6): abortError(), ChatMessage, createQwenClient(), attempt(), isRetryable(), RETRY_DELAYS

### Community 39 - "MentionInput"
Cohesion: 0.19
Nodes (7): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), Mention, MentionInput, MentionInputHandle, MentionInputProps, mentionToken()

### Community 40 - "edgeLabels.ts"
Cohesion: 0.09
Nodes (31): alongCandidates(), AlongItem, arcOf(), Beside, besideNode(), Box, commonPrefix(), fromSelected() (+23 more)

### Community 41 - "schema.ts"
Cohesion: 0.11
Nodes (30): db, Tx, accounts, diagramVersions, flows, FlowSource, GlossarySource, mcpKeys (+22 more)

### Community 42 - "useRemoteChanges.ts"
Cohesion: 0.22
Nodes (9): Task 9: 열어 둔 브라우저가 변경을 알아채기, Head, isHead(), POLL_MS, read(), REMOTE_CHANGED, REMOTE_LOAD, useRemoteChanges() (+1 more)

### Community 43 - "NODE_KINDS"
Cohesion: 0.20
Nodes (9): 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전, "중단됨" 버전, 빠진 정보 채우기, 노드 종류 목록 (kind·group_kind·edge_kind), "모름" 표시, 변경 이력과 비파괴 되돌리기, NODE_KINDS (+1 more)

### Community 44 - "clef.ts"
Cohesion: 0.18
Nodes (9): ClefAnswer, ClefAnswers, ClefHttpError, EXPLAIN_SCORE_QUESTION, INTENT_QUESTION, INTENTS, RESTART_DELAYS, RunOpts (+1 more)

### Community 45 - "[diagramId]/page.tsx"
Cohesion: 0.21
Nodes (14): dynamic, GET(), json(), runtime, DiagramPage(), MessageRole, messages, sessionPayload() (+6 more)

### Community 46 - "Review Focus"
Cohesion: 0.29
Nodes (6): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 5: E2E — 노드 질문 흐름, 실행 순서

### Community 47 - "(app)/actions.ts"
Cohesion: 0.11
Nodes (42): Task 8: 구성도 화면 — 지식 전달, 안내 카드, 빠진 정보 줄, 망연계 노드 표시, clearPinnedAction(), confirmAssumptionAction(), confirmLinkGuessAction(), createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction() (+34 more)

### Community 48 - "chat/warnings.ts"
Cohesion: 0.32
Nodes (14): buildWarningMessages(), carryExposed(), checkCodeWarnings(), checkWarnings(), describeTarget(), flaggedPublic(), isLinkRule(), judgeExposed() (+6 more)

### Community 49 - "Command"
Cohesion: 0.21
Nodes (9): Command, commandsBetween(), depth(), diffStates(), equal(), EdgeCoalescer, NOT_COMMAND_PATH, planCommandBackfill() (+1 more)

### Community 50 - "useDiagramView.ts"
Cohesion: 0.12
Nodes (19): Global Constraints, 구성도 배치 조화 1단계 — 선택 강조와 선 간격 Implementation Plan, FlowProps, DisplayGraph, DisplayOptions, ExportRequest, GROUP_PAD, Layout (+11 more)

### Community 51 - "mcp/apply.ts"
Cohesion: 0.14
Nodes (23): FLOW_LIMITS, applyFlowOps(), isFlowOnly(), KNOWN_OPS, lockedApply(), saveInTx(), MCP_BUSY_MESSAGE, McpApplyInput (+15 more)

### Community 52 - "ref_react"
Cohesion: 0.06
Nodes (64): AuthField(), AuthSubmit(), Props, FieldErrors, Options, useAuthForm(), LoginForm(), validate() (+56 more)

### Community 53 - "GlossaryPage.tsx"
Cohesion: 0.14
Nodes (21): listGlossaryAction(), setTermReviewedAction(), updateTermAction(), Glossary(), glossaryTerms, GLOSSARY_SEED, GlossarySeedEntry, GlossaryItem (+13 more)

### Community 54 - "projects.ts"
Cohesion: 0.17
Nodes (25): projects, copyFlows(), assertOwnedProject(), assertUniqueDiagramName(), assertUniqueProjectName(), assertUuid(), cleanName(), clip() (+17 more)

### Community 55 - "pipeline.ts"
Cohesion: 0.12
Nodes (29): Task 5: 대화 차례의 흐름 명령, Global Constraints, isAssumptionChangeMessage(), createFlowRetarget(), isFlowCommand(), isStructural(), parseCommand(), toFlowOp() (+21 more)

### Community 56 - "GhostLayer.tsx"
Cohesion: 0.21
Nodes (8): cssEscape(), GHOST_MS, GhostLayer, GhostLayerProps, GhostRequest, shootEdges(), shootNode(), Shot

### Community 57 - "EdgePanels.tsx"
Cohesion: 0.13
Nodes (20): ALB, EdgePanels(), n(), Panel, PanelEdge, PanelNode, PANELS, PanelView() (+12 more)

### Community 58 - "flowSuggest.ts"
Cohesion: 0.11
Nodes (20): BodySchema, Ctx, dynamic, maxDuration, POST(), runtime, diagrams, FlowOp (+12 more)

### Community 59 - "[sessionId]/route.ts"
Cohesion: 0.12
Nodes (27): Ctx, DELETE(), dynamic, failed(), GET(), guard(), json(), PATCH() (+19 more)

### Community 60 - "Review Focus"
Cohesion: 0.15
Nodes (11): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 2: 마우스 강조·흐리기, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 6: E2E — 3E 흐름 (+3 more)

### Community 61 - "Legend.tsx"
Cohesion: 0.19
Nodes (11): EDGE_KINDS, Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), legendPlacement() (+3 more)

### Community 62 - "explain/route.ts"
Cohesion: 0.16
Nodes (15): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+7 more)

### Community 63 - "Shell.tsx"
Cohesion: 0.15
Nodes (16): AppLayout(), Home(), lastActiveDiagram(), listProjects(), COMPACT_QUERY, CreateButton(), CreateRequest, extentOf() (+8 more)

### Community 64 - "useChatTurn.ts"
Cohesion: 0.12
Nodes (25): Task 7: 대화창 — 말풍선과 진행 카드, Warning, WarningCounts, MessageMeta, SessionEventPayload, changedOf(), keepsCard(), legacySummaryText() (+17 more)

### Community 65 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, Review Focus, Task 10: E2E 와 문서, Task 1: 망 지식 도메인 — 타입, 기본 제공 목록, 필요한 방식 계산, Task 2: 구성도 상태 — 망 종류 칸, `set_zone_type`, 망연계 추정 표시 명령, Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검, 망 종류 지식과 망연계 예상 Implementation Plan, splitFlowSteps()

### Community 66 - "구성도 배치 조화 1단계 — 선택 강조와 선 간격"
Cohesion: 0.12
Nodes (15): 1. 강조 방식: "굵게 + 은은한 빛, 선 종류 색 유지", 2. 함께 지나는 구간: "한 줄기로 묶기", 3. 반복되는 연결 이름: "같은 이름은 한 번만, 개수와 함께", 4. 평행선 간격, 5. 영역 이름 크기: "확대에 맞춰 보정", 6. 접힌 영역 상자: "상자 폭을 이름에 맞춤", 구성도 배치 조화 1단계 — 선택 강조와 선 간격, 내가 정한 것 (사용자 확인 필요) (+7 more)

### Community 67 - "server/network.ts"
Cohesion: 0.10
Nodes (34): Task 5: DB와 서버 — 망 지식 테이블, 기본 제공 채우기, 읽기·고치기, Task 3: 키 만들기·확인, networkRules, networkTypes, GRADE_LABELS, GRADE_RULES, gradeMethod(), LinkMethod (+26 more)

### Community 68 - "useSessions.ts"
Cohesion: 0.27
Nodes (10): errorOf(), Lines, mergeSessions(), NEW_CHAT_TITLE, NO_PAGING, titleOf(), turnOnly(), Update (+2 more)

### Community 69 - "흐름 보기와 망 경계 표시 — 설계"
Cohesion: 0.14
Nodes (13): A. 흐름, B. 망 경계, 만드는 사람에게 맡기는 것, 목표, 사용자가 정한 것(설계 검토 뒤), 실패로 보는 것, 왜 하는가, 이미 있는 것 (+5 more)

### Community 70 - "FlowPanel.tsx"
Cohesion: 0.17
Nodes (7): FlowOrigin, Action, FlowPanel(), FlowPanelProps, GROUPS, menuRootId(), stepMark()

### Community 71 - "deps.ts"
Cohesion: 0.27
Nodes (9): Task 5: 설명 API, Qwen URL 정규화, parseEnv(), defaultChatDeps(), setChatDepsForTest(), resolveDeps(), resolveDeps(), llmConfig (+1 more)

### Community 72 - "createJsonlParser"
Cohesion: 0.38
Nodes (8): createJsonlParser(), isCommandLine(), Scan, scanLine(), step(), stripWrap(), createThinkStripper(), partialTagLen()

### Community 73 - "createClefClient"
Cohesion: 0.50
Nodes (8): abortError(), createClefClient(), acquire(), classifyIntent(), decide(), post(), release(), run()

### Community 74 - "domain/explain.ts"
Cohesion: 0.20
Nodes (17): Task 2: 용어 사전 시드와 서버 함수, listTermsAction(), normalizeTerm(), pickTerm(), termCandidates(), addAiTerm(), findTerm(), ExplanationView (+9 more)

### Community 75 - "networkRules.ts"
Cohesion: 0.27
Nodes (9): Task 3: 판정 — 통신 길, 연결 방식 예상 경고, 빠진 정보, CrossingPath, evaluateNetworkRules(), LINK_GUIDE, LINK_RULES, LinkRule, LinkVerdict, linkWarningId() (+1 more)

### Community 76 - "health.ts"
Cohesion: 0.43
Nodes (4): GET(), checkLlmHealth(), LlmHealth, probe()

### Community 77 - "commands.ts"
Cohesion: 0.08
Nodes (25): Task 6: AI 흐름 제안(처음 그린 뒤 자동 + 버튼), attrs, COMMAND_OPS, commandSchema, direction, edgeKind, FLOW_OPS, FlowCommand (+17 more)

### Community 78 - "QwenClient"
Cohesion: 0.40
Nodes (5): ChatDeps, ExplainDeps, FlowSuggestDeps, ClefClient, QwenClient

### Community 79 - "domain/assumptions.ts"
Cohesion: 0.07
Nodes (30): 가정 목록 (구조 결정), 1-1. 망 종류, 1-2. 연결 규칙, 1-3. 망 지식 화면, 1. 망 지식 (지식베이스), 2. 망 영역에 종류 붙이기, 3. 고려가 시작되는 시점, 4. 연결 방식 예상 (안내) (+22 more)

### Community 80 - "목표"
Cohesion: 0.33
Nodes (6): 2. 어디서 띄우나, 3. 키 관리 (제 판단), 4. 도구, 5. 기록과 동시 작업, 6. 브라우저에서 보기 (사용자: "어렵지 않으면 시각 효과도"), 목표

### Community 81 - "motion.ts"
Cohesion: 0.33
Nodes (9): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+1 more)

### Community 82 - "domain/explain.ts"
Cohesion: 0.27
Nodes (8): attrText(), endpointOf(), fnv1a(), LIMITS, signatureOf(), TermCandidate, TermEntry, TermOrigin

### Community 83 - "dialogs.tsx"
Cohesion: 0.13
Nodes (19): Task 8: 키 화면, createMcpKeyAction(), deleteMcpKeyAction(), listMcpKeysAction(), McpKeyRow, toKeyRow(), ClaudeCodeConnection(), createMcpKey() (+11 more)

### Community 85 - "Task 2: 서버 점검 — Clef 판정과 Qwen 문구"
Cohesion: 0.29
Nodes (7): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 3: 대화 차례에 점검 단계 넣기, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, noulProbability()

### Community 86 - "networkBlock"
Cohesion: 0.25
Nodes (7): Task 1: 그리기 규칙 공용 모듈, 1. 누가 그리나, Pattern, patternPromptBlock(), PATTERNS, byStr(), networkBlock()

### Community 87 - "settle.ts"
Cohesion: 0.46
Nodes (7): Task 4: 차례 끝 정리 공용화와 코드 경고 점검, isEmptyGroup(), pruneEmptyGroups(), splitsFor(), StepSplit, prunedOrder(), settleTurn()

### Community 88 - "Claude Code 연동(MCP 서버) — 설계"
Cohesion: 0.29
Nodes (6): Claude Code 연동(MCP 서버) — 설계, 만드는 사람에게 맡기는 것, 실패로 보는 것, 왜 하는가, 제약, 하지 않는 것

### Community 89 - "2단계 계획: AI 대화"
Cohesion: 0.33
Nodes (5): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409)

### Community 90 - "ExplanationProps"
Cohesion: 0.40
Nodes (4): EdgeExplanation, NodeExplanation, ExplanationProps, Entry

### Community 91 - "InfraSketch 3B단계: 경고·구성 패턴 구현 계획"
Cohesion: 0.40
Nodes (4): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus

### Community 93 - "easeScore"
Cohesion: 0.50
Nodes (4): Task 9: 가짜 AI·smoke·E2E, easeScore(), scoredText(), scoreValue()

### Community 94 - "buildFlowSuggestMessages"
Cohesion: 0.50
Nodes (4): Task 1: 망 영역·망연계 노드·연결 전달물/방향, buildFlowSuggestMessages(), summarizeFlows(), summarizeState()

## Knowledge Gaps
- **467 isolated node(s):** `MenuAction`, `MenuItem`, `MenuTarget`, `SidebarProject`, `UseFlowsInput` (+462 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 543 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `flowSuggest.ts` to `domain/warnings.ts`, `prompt.ts`, `domain/linkGuess.ts`, `설명 생성과 품질 검사`, `getOwnedDiagram`, `RightPanel.tsx`, `domain/flows.ts`, `DiagramWorkspace.tsx`, `ref_react`, `read.ts`, `samples.ts`, `ask.ts`, `Canvas.tsx`, `domain/apply.ts`, `layoutMetrics.ts`, `NodeInfo.tsx`, `schema.ts`, `(app)/actions.ts`, `chat/warnings.ts`, `Command`, `useDiagramView.ts`, `mcp/apply.ts`, `projects.ts`, `pipeline.ts`, `server/network.ts`, `FlowPanel.tsx`, `domain/explain.ts`, `networkRules.ts`, `commands.ts`, `domain/assumptions.ts`, `domain/explain.ts`, `settle.ts`, `흐름 보기와 망 경계 표시 Implementation Plan`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `computeMissing()` connect `domain/flows.ts` to `Review Focus`, `NodeInfo.tsx`, `server/network.ts`, `networkRules.ts`, `NODE_KINDS`, `getOwnedDiagram`, `(app)/actions.ts`, `mcp/apply.ts`, `ref_react`, `read.ts`, `pipeline.ts`, `ask.ts`, `Canvas.tsx`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `ValidationError` connect `projects.ts` to `server/network.ts`, `NetworkKnowledgePage.tsx`, `deps.ts`, `schema.ts`, `domain/explain.ts`, `설명 생성과 품질 검사`, `getOwnedDiagram`, `(app)/actions.ts`, `domain/flows.ts`, `dialogs.tsx`, `pipeline.ts`, `GlossaryPage.tsx`, `ask/route.ts`, `read.ts`, `flowSuggest.ts`, `ask.ts`, `explain/route.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `ValidationError` (e.g. with `Task 2: 용어 사전 시드와 서버 함수` and `Task 5: 설명 API`) actually correct?**
  _`ValidationError` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MenuAction`, `MenuItem`, `MenuTarget` to the rest of the system?**
  _467 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useFlows` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._