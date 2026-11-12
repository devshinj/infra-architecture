---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2348 nodes · 6313 edges · 116 communities (111 shown, 5 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 301 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8fc7b619`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Sidebar.tsx
- useFlows
- segments.ts
- NetworkKnowledgePage.tsx
- ChatPanel.tsx
- chat/warnings.ts
- InfraSketch 설계 문서
- ask/route.ts
- layout.ts
- prompt.ts
- Review Focus
- auth.ts
- exportImage.ts
- 설명 생성과 품질 검사
- getOwnedDiagram
- RightPanel.tsx
- useCamera.ts
- 6. 출처 목록
- networkRules.ts
- 라우트 재수출
- DiagramWorkspace.tsx
- drawing/rules.ts
- read.ts
- AuthStage.tsx
- index.ts
- SessionPicker.tsx
- NodeMenu
- schema.ts
- Canvas.tsx
- 3C-1 계획 작업 목록
- catalog.ts
- mcpKeys.ts
- ResetPasswordForm.tsx
- EdgeLayer.tsx
- NodeInfo.tsx
- FlyLayer.tsx
- glossary.ts
- ExportMenu.tsx
- domain/warnings.ts
- 목표
- edgeLabels.ts
- Explanation.tsx
- 3. 망·보안 관점
- B) CCTV·영상 관제 — 구성 지식
- Shell.tsx
- GlossaryPage.tsx
- clarify.ts
- server/network.ts
- Review Focus
- motion.ts
- layoutMetrics.ts
- mcp/apply.ts
- MissingChecklist.tsx
- explain/route.ts
- projects.ts
- pipeline.ts
- app/layout.tsx
- EdgePanels.tsx
- missing.ts
- [sessionId]/route.ts
- flowSuggest.ts
- Legend.tsx
- PageSkeleton.tsx
- commands.ts
- auth/actions.ts
- types.ts
- 구성도 배치 조화 1단계 — 선택 강조와 선 간격
- domain/assumptions.ts
- samples.ts
- 흐름 보기와 망 경계 표시 — 설계
- FlowPanel.tsx
- clef.ts
- useChatTurn.ts
- InfraSketch 3B단계: 경고·구성 패턴 구현 계획
- domain/explain.ts
- 02. 금융·의료·산업제어(OT)·통신/기반시설 분야 망 구분과 망 사이 연결 규칙
- server/flows.ts
- display.ts
- reset.ts
- ZoneTypePicker.tsx
- domain/apply.ts
- domain/apply.ts
- SkipTally
- A) BLE·IoT 기기 통신 — 구성 지식
- MentionInput
- DiagramState
- Claude Code 연동(MCP 서버) — 설계
- Task 9: 망 지식 화면
- 망 지식 · 용어 사전 기본 데이터 리서치 (2026-11-11)
- 03. 기업·클라우드 망 구분과 망·보안 용어 조사
- normalize.ts
- 공공기관 망 구분과 망 사이 연결 규칙 — 조사 결과
- useRemoteChanges.ts
- 4. 용어 사전 후보 (74개)
- 04. 시스템 소프트웨어 · 하드웨어 · 국내 SI 현업 용어 — 용어 사전 후보
- 2-A. 소프트웨어·제품 (why·compare 비움)
- 2-C. 현업 개념 (why·compare 채움)
- 4. 분야별 설명
- 2-B. 하드웨어 · 물리 인프라 (why·compare 채움)
- [sessionId]/route.ts
- domain/explain.ts
- 현장 기기 · 영상 관제 · 실시간 통신 · AI 결합 구성 지식 리서치 (2026-11-12)
- 2단계 계획: AI 대화
- textWidth
- diff.ts
- qwen.ts
- overlap.ts
- createClefClient
- (app)/actions.ts
- Review Focus
- env.ts
- Review Focus
- QwenClient
- ShellValue
- 흐름 보기와 망 경계 표시 Implementation Plan

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 64 edges
2. `ValidationError` - 57 edges
3. `getOwnedDiagram()` - 53 edges
4. `DiagramWorkspace()` - 49 edges
5. `lockedTurn()` - 45 edges
6. `Button()` - 44 edges
7. `NotFoundError` - 36 edges
8. `Flow()` - 36 edges
9. `InfraSketch 설계 문서` - 34 edges
10. `auth` - 34 edges

## Surprising Connections (you probably didn't know these)
- `만드는 사람에게 맡기는 것` --references--> `Group`  [INFERRED]
  docs/superpowers/specs/2026-11-06-network-character-and-link-guess-design.md → src/domain/types.ts
- `제약` --references--> `neutralizeClone()`  [INFERRED]
  docs/superpowers/specs/2026-11-04-layout-harmony-stage1-design.md → src/canvas/exportImage.ts
- `5. 기록과 동시 작업` --references--> `withDiagramLock()`  [INFERRED]
  docs/superpowers/specs/2026-11-06-mcp-server-design.md → src/server/chat/lock.ts
- `1. 누가 그리나` --references--> `patternPromptBlock()`  [INFERRED]
  docs/superpowers/specs/2026-11-06-mcp-server-design.md → src/domain/patterns.ts
- `Task 2: 구성도 상태 — 망 종류 칸, `set_zone_type`, 망연계 추정 표시 명령` --references--> `isStructural()`  [INFERRED]
  docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md → src/domain/commands.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (116 total, 5 thin omitted)

### Community 0 - "Sidebar.tsx"
Cohesion: 0.14
Nodes (29): createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction(), refreshAll(), renameDiagramAction(), renameProjectAction() (+21 more)

### Community 1 - "useFlows"
Cohesion: 0.14
Nodes (10): Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인, confirmFlowAction(), deleteFlowAction(), removeFlowStepAction(), renameFlowAction(), createdAt(), BusyError, message() (+2 more)

### Community 2 - "segments.ts"
Cohesion: 0.19
Nodes (19): Task 2: 평소 화면 평행선 16px, 연결선 모양과 움직임, assignStarts(), buildSegmentBundles(), buildSegs(), InEdge, normalize(), Piece (+11 more)

### Community 3 - "NetworkKnowledgePage.tsx"
Cohesion: 0.12
Nodes (25): countNetworkTypeUsageAction(), userId(), NetworkKnowledge(), auth, listNetworkTypes(), EMPTY_TYPE, gradeLabel(), GRADES (+17 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.11
Nodes (22): Block, BUILD_STEPS, CardView(), ChatPanel(), Check(), CHIP_KINDS, Dots(), EDIT_EXAMPLES (+14 more)

### Community 5 - "chat/warnings.ts"
Cohesion: 0.12
Nodes (30): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 3: 대화 차례에 점검 단계 넣기, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검, FIXED_TEXT_RULES (+22 more)

### Community 6 - "InfraSketch 설계 문서"
Cohesion: 0.11
Nodes (20): 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전, "중단됨" 버전, 이상한 구성 경고, 로그인·회원 (Auth.js Credentials), 자동 배치 (ELK layered), Clef-Flash 판정 모델, InfraSketch 설계 문서 (+12 more)

### Community 7 - "ask/route.ts"
Cohesion: 0.08
Nodes (33): Task 5: DB와 서버 — 망 지식 테이블, 기본 제공 채우기, 읽기·고치기, BodySchema, dynamic, json(), maxDuration, POST(), runtime, BodySchema (+25 more)

### Community 8 - "layout.ts"
Cohesion: 0.10
Nodes (29): Task 6: 영역 이름 크기 보정과 접힌 상자 폭, elbowRoute(), Pt, azChipWidth(), azOf(), BASE_OPTIONS, COLLAPSED_MAX_WIDTH, collapsedGroupWidth() (+21 more)

### Community 9 - "prompt.ts"
Cohesion: 0.07
Nodes (37): GLOSSARY_MATCH_MAX, glossaryBlock(), MatchedTerm, MatchEntry, matchGlossaryTerms(), squash(), labelOf(), ancestorsOf() (+29 more)

### Community 10 - "Review Focus"
Cohesion: 0.12
Nodes (16): Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저), Task 11: 빈 구성도 시작 경험 — 인사말·가이드·예시 질문 (사용자 추가 요청, 2026-10-30), Task 12: 대화에서 캔버스로 날아가는 빛점 (사용자 추가 요청, 2026-10-30), Task 13: 도구 모음 정리와 스크롤 정리 (사용자 추가 요청, 2026-10-30), Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙 (+8 more)

### Community 11 - "auth.ts"
Cohesion: 0.18
Nodes (9): authConfig, handlers, { auth }, config, authDecision, isPublicPath(), PUBLIC, next-auth (+1 more)

### Community 12 - "exportImage.ts"
Cohesion: 0.11
Nodes (22): Task 5: 같은 연결 이름 합치기, buildStage(), CHROME, decodeSvgDataUrl(), diagramBounds(), download(), EdgeLabel, edgeLabels() (+14 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.11
Nodes (29): explanations, ExplanationTargetKind, cachedNodeExplanation(), codePoints(), complete(), dbRepo, DepsInput, Draft (+21 more)

### Community 14 - "getOwnedDiagram"
Cohesion: 0.25
Nodes (22): Task 4: "의도된 구성" 저장, Task 7: 서버 액션 — 망 종류 확인·바꾸기, 망연계 맞아요·아니에요, confirmAssumption(), noLinkKey(), mergeFlowSteps(), crossingPaths(), emptyState(), confirmAssumptionFor() (+14 more)

### Community 15 - "RightPanel.tsx"
Cohesion: 0.13
Nodes (13): Task 2: 키 테이블과 버전 칸, ChatPanelProps, HistoryPanel(), HistoryPanelProps, relativeTime(), SOURCE_LABEL, VersionRow, Tab (+5 more)

### Community 16 - "useCamera.ts"
Cohesion: 0.10
Nodes (25): LaidOutGroup, LaidOutNode, Rect, NavItem, CameraInput, EDGE_GAP_PX, FINAL_FIT_DURATION, FitOptions (+17 more)

### Community 17 - "6. 출처 목록"
Cohesion: 0.08
Nodes (23): 1. 전형적인 구성 4가지, 2. 구성요소 사전, 3.1 어디에 두고 무엇으로 잇나, 3.2 외부 API 구성과 자체 서빙 구성의 차이, 3.3 국내 규정·가이드 (확인 수준을 함께 적음), 3.4 흔한 실수, 3. 망·보안 관점, 4. 구성도를 그리는 AI 에게 줄 지침 후보 (+15 more)

### Community 18 - "networkRules.ts"
Cohesion: 0.20
Nodes (15): Task 3: 판정 — 통신 길, 연결 방식 예상 경고, 빠진 정보, BOUNDARY_NODE_KINDS, crossesBoundary(), isDirectCrossing(), isLocalLink(), networkZoneOf(), crossingBase(), CrossingPath (+7 more)

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.10
Nodes (24): CanvasOptions, DiffMarks, SessionPaging, SessionSummary, DiagramWorkspaceProps, escapeBelongsElsewhere(), hasId(), MOBILE_VIEW_KEY (+16 more)

### Community 21 - "drawing/rules.ts"
Cohesion: 0.10
Nodes (33): Task 1: 그리기 규칙 공용 모듈, GRADE_LABELS, GRADE_RULES, gradeMethod(), METHOD_LABELS, NetworkKnowledge, pairKey(), requiredMethod() (+25 more)

### Community 22 - "read.ts"
Cohesion: 0.09
Nodes (37): File Structure, Task 10: E2E와 문서, Task 3: 키 만들기·확인, Task 6: 읽기 서비스와 안내서, bearerKey(), DELETE(), dynamic, GET() (+29 more)

### Community 23 - "AuthStage.tsx"
Cohesion: 0.12
Nodes (16): Action, at(), Box, BUILD, BUILT, Chat, EMPTY, flag() (+8 more)

### Community 24 - "index.ts"
Cohesion: 0.13
Nodes (32): ACCESS_CONTROL, SERVER, API, AWS_SHOP, assume(), edge(), edgeId(), flow() (+24 more)

### Community 25 - "SessionPicker.tsx"
Cohesion: 0.15
Nodes (15): Action, byRecent(), Chevron(), MAIN_LABEL, menuRootId(), MORE_LABEL, pad(), Plus() (+7 more)

### Community 26 - "NodeMenu"
Cohesion: 0.48
Nodes (3): NodeMenu(), NodeMenuProps, placeMenu()

### Community 27 - "schema.ts"
Cohesion: 0.10
Nodes (24): Task 7: MCP 라우트와 도구, 4. 도구, db, Tx, accounts, diagrams, diagramVersions, flows (+16 more)

### Community 28 - "Canvas.tsx"
Cohesion: 0.07
Nodes (42): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, Task 3: 강조 토큰과 노드·영역 흐림, canvasAriaLabels(), DIRECTION, zoneDescription(), Canvas(), CanvasProps, drawnId() (+34 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.13
Nodes (14): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+6 more)

### Community 30 - "catalog.ts"
Cohesion: 0.11
Nodes (20): GroupBox(), GroupBoxData, groupToggleLabel(), groupToggleWidth(), EDGE_Z, NODE_Z, ZONE_NAME_IN_PORTAL_Z, ZONE_Z_MAX (+12 more)

### Community 31 - "mcpKeys.ts"
Cohesion: 0.18
Nodes (14): McpKeyRow, ClaudeCodeConnection(), listMcpKeys(), DeleteDialog, Dialog, DialogView(), focusables(), GENERIC_ERROR (+6 more)

### Community 32 - "ResetPasswordForm.tsx"
Cohesion: 0.18
Nodes (21): AuthField(), AuthSubmit(), Props, AuthStage(), FieldErrors, Options, useAuthForm(), LoginForm() (+13 more)

### Community 33 - "EdgeLayer.tsx"
Cohesion: 0.14
Nodes (26): Task 7: 캔버스 흐름 강조·단계 글자·경계 표시, boundaryDotAt(), boxOf(), labelBox(), placeAlong(), ringOf(), stepLabels(), stepNumberOnly() (+18 more)

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.10
Nodes (23): Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), isEmpty(), AskNode(), AskNodeProps, CautionProps, Cautions(), DIRECTION_NAME, edgeKindName() (+15 more)

### Community 35 - "FlyLayer.tsx"
Cohesion: 0.09
Nodes (21): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+13 more)

### Community 36 - "glossary.ts"
Cohesion: 0.21
Nodes (12): glossaryTerms, GLOSSARY_SEED_BATCH3, GLOSSARY_SEED_BATCH4, GLOSSARY_SEED_EXTRA, GLOSSARY_SEED, GLOSSARY_SEED_CORE, GlossarySeedEntry, escapeLike() (+4 more)

### Community 37 - "ExportMenu.tsx"
Cohesion: 0.12
Nodes (20): SamplePicker(), ExportBackground, ExportFormat, LIGHT_BACKGROUND, BACKGROUNDS, EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON (+12 more)

### Community 38 - "domain/warnings.ts"
Cohesion: 0.14
Nodes (25): Task 1: 망 영역·망연계 노드·연결 전달물/방향, categoryOf(), isManaged(), yesNo(), Edge, WarningLevel, ancestorKinds(), azOf() (+17 more)

### Community 39 - "목표"
Cohesion: 0.11
Nodes (17): 1-1. 망 종류, 1-2. 연결 규칙, 1-3. 망 지식 화면, 1. 망 지식 (지식베이스), 2. 망 영역에 종류 붙이기, 3. 고려가 시작되는 시점, 4. 연결 방식 예상 (안내), 5. AI가 망연계를 넣어 그리기 (+9 more)

### Community 40 - "edgeLabels.ts"
Cohesion: 0.09
Nodes (31): alongCandidates(), AlongItem, arcOf(), Beside, besideNode(), Box, commonPrefix(), fromSelected() (+23 more)

### Community 41 - "Explanation.tsx"
Cohesion: 0.17
Nodes (20): EdgeExplanation, NodeExplanation, ADR_LABELS, DEFAULT_LINES, DefinitionPart(), EdgeBody(), Explanation(), ExplanationProps (+12 more)

### Community 42 - "3. 망·보안 관점"
Cohesion: 0.10
Nodes (19): 1. 전형적인 구성, 2. 구성요소 사전, 3. 망·보안 관점, 4. 구성도를 그리는 AI 에게 줄 지침 후보, 5. 확인하지 못한 것·출처가 갈리는 것, 6. 출처 목록, C) WebRTC 실시간 영상·음성 통신 — 구성 지식, 구성 1 — 1:1 통화 (P2P, 가장 작은 것) (+11 more)

### Community 43 - "B) CCTV·영상 관제 — 구성 지식"
Cohesion: 0.11
Nodes (18): 1. 전형적인 구성, 2. 구성요소 사전, 3.1 망 배치, 3.2 암호화·인증, 3.3 국내 규정 (직접 열어 확인한 것), 3.4 망분리 완화(N²SF)와의 관계, 3.5 흔한 실수, 3. 망·보안 관점 (+10 more)

### Community 44 - "Shell.tsx"
Cohesion: 0.15
Nodes (17): AppLayout(), Home(), lastActiveDiagram(), listProjects(), COMPACT_QUERY, CreateButton(), CreateRequest, extentOf() (+9 more)

### Community 45 - "GlossaryPage.tsx"
Cohesion: 0.20
Nodes (16): ActionResult, listGlossaryAction(), listTermsAction(), setTermReviewedAction(), updateTermAction(), Glossary(), GlossaryItem, toGlossaryItem() (+8 more)

### Community 46 - "clarify.ts"
Cohesion: 0.16
Nodes (13): choicesSummary(), CLARIFY_AUTO, CLARIFY_AUTO_VALUE, CLARIFY_MAX, CLARIFY_REPLY, ClarifyQuestion, Fork, FORKS (+5 more)

### Community 47 - "server/network.ts"
Cohesion: 0.11
Nodes (28): networkRules, networkTypes, LinkMethod, NetGrade, NetRule, NetType, NETWORK_RULE_SEED, NETWORK_TYPE_SEED (+20 more)

### Community 48 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 6: E2E — 3E 흐름, 실행 순서

### Community 49 - "motion.ts"
Cohesion: 0.21
Nodes (13): Task 4: 강조 겹선 층(선택·호버)과 갈림점·움직임 층, bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make() (+5 more)

### Community 50 - "layoutMetrics.ts"
Cohesion: 0.15
Nodes (20): Task 1: 배치 측정 모듈과 기준선 테스트, defaultDisplayOptions(), initialCollapsed(), defaultViewLayout(), END_TRIM, hi(), isH(), isV() (+12 more)

### Community 51 - "mcp/apply.ts"
Cohesion: 0.11
Nodes (32): Task 5: 대화 차례의 흐름 명령, Global Constraints, isFlowCommand(), isStructural(), parseCommand(), FLOW_LIMITS, planFlowOps(), linkVerdicts() (+24 more)

### Community 52 - "MissingChecklist.tsx"
Cohesion: 0.08
Nodes (30): Task 5: 주의 항목 바로 가기, parseLinkWarningId(), mergeWarnings(), CardMeasure, Chevron(), Count(), GuessedZones(), InfoCard() (+22 more)

### Community 53 - "explain/route.ts"
Cohesion: 0.24
Nodes (9): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+1 more)

### Community 54 - "projects.ts"
Cohesion: 0.18
Nodes (23): assertOwnedProject(), assertUniqueDiagramName(), assertUniqueProjectName(), assertUuid(), cleanName(), clip(), coord, copyName() (+15 more)

### Community 55 - "pipeline.ts"
Cohesion: 0.10
Nodes (41): Task 2: 질문 차례(서버), isAssumptionChangeMessage(), choicesNote(), choicesOf(), choiceValue(), detectForks(), validChoices(), createFlowRetarget() (+33 more)

### Community 56 - "app/layout.tsx"
Cohesion: 0.33
Nodes (3): metadata, suit, viewport

### Community 57 - "EdgePanels.tsx"
Cohesion: 0.13
Nodes (20): ALB, EdgePanels(), n(), Panel, PanelNode, PANELS, PanelView(), Pt (+12 more)

### Community 58 - "missing.ts"
Cohesion: 0.27
Nodes (8): NODE_KINDS, NO, SERVER_ONLY_ATTRS, YES, FIELD_LABELS, requiredKeysFor(), requiredKeysForEdge(), requiredKeysForNode()

### Community 59 - "[sessionId]/route.ts"
Cohesion: 0.12
Nodes (24): Task 8: 구성도 화면 — 지식 전달, 안내 카드, 빠진 정보 줄, 망연계 노드 표시, dynamic, GET(), json(), runtime, DiagramPage(), ChatSessionKind, chatSessions (+16 more)

### Community 60 - "flowSuggest.ts"
Cohesion: 0.09
Nodes (32): BodySchema, Ctx, dynamic, maxDuration, POST(), runtime, toFlowOp(), checkFlow() (+24 more)

### Community 61 - "Legend.tsx"
Cohesion: 0.20
Nodes (11): MediumMark(), Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), legendPlacement() (+3 more)

### Community 62 - "PageSkeleton.tsx"
Cohesion: 0.20
Nodes (12): Loading(), Loading(), Loading(), CELL_WIDTHS, PageSkeleton(), PageSkeletonProps, ChatSkeleton(), Loading() (+4 more)

### Community 63 - "commands.ts"
Cohesion: 0.09
Nodes (21): Task 6: AI 흐름 제안(처음 그린 뒤 자동 + 버튼), attrs, COMMAND_OPS, commandSchema, direction, edgeKind, FLOW_OPS, FlowCommand (+13 more)

### Community 64 - "auth/actions.ts"
Cohesion: 0.13
Nodes (29): validate(), validate(), validate(), signIn, users, FormState, loginAction(), requestResetAction() (+21 more)

### Community 65 - "types.ts"
Cohesion: 0.14
Nodes (21): PanelEdge, DisplayEdge, DisplayGroup, ExportRequest, GLYPH, MarkedMedium, MEDIUM_LABELS, MEDIUM_R (+13 more)

### Community 66 - "구성도 배치 조화 1단계 — 선택 강조와 선 간격"
Cohesion: 0.12
Nodes (16): 1. 강조 방식: "굵게 + 은은한 빛, 선 종류 색 유지", 2. 함께 지나는 구간: "한 줄기로 묶기", 3. 반복되는 연결 이름: "같은 이름은 한 번만, 개수와 함께", 4. 평행선 간격, 5. 영역 이름 크기: "확대에 맞춰 보정", 6. 접힌 영역 상자: "상자 폭을 이름에 맞춤", 구성도 배치 조화 1단계 — 선택 강조와 선 간격, 내가 정한 것 (사용자 확인 필요) (+8 more)

### Community 67 - "domain/assumptions.ts"
Cohesion: 0.21
Nodes (11): 가정 목록 (구조 결정), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage(), parseNoLinkKey(), STRUCTURAL_KEYS, Assumption, AssumptionChips() (+3 more)

### Community 68 - "samples.ts"
Cohesion: 0.12
Nodes (17): buildSample(), SAMPLE_LIST, AddEdge, AddGroup, AddNode, AUX_NODE_KINDS, convertSpikeScenario(), EDGE_KIND_MAP (+9 more)

### Community 69 - "흐름 보기와 망 경계 표시 — 설계"
Cohesion: 0.14
Nodes (13): A. 흐름, B. 망 경계, 만드는 사람에게 맡기는 것, 목표, 사용자가 정한 것(설계 검토 뒤), 실패로 보는 것, 왜 하는가, 이미 있는 것 (+5 more)

### Community 70 - "FlowPanel.tsx"
Cohesion: 0.12
Nodes (14): Review Focus, Task 2: 망 경계 판정·경고·채워야 할 정보, Task 3: 흐름 도메인(모양·검사·끊김), Task 8: "흐름" 탭·지나는 흐름·연동, Task 9: E2E·화면 확인·문서, crossingNote(), FlowOrigin, RowMenu() (+6 more)

### Community 71 - "clef.ts"
Cohesion: 0.17
Nodes (10): ClefAnswer, ClefAnswers, ClefHttpError, EXPLAIN_SCORE_QUESTION, INTENT_MIN_CONFIDENCE, INTENT_QUESTION, INTENTS, RESTART_DELAYS (+2 more)

### Community 72 - "useChatTurn.ts"
Cohesion: 0.08
Nodes (37): Task 7: 대화창 — 말풍선과 진행 카드, Warning, WarningCounts, MessageMeta, SessionEventPayload, changedOf(), keepsCard(), legacySummaryText() (+29 more)

### Community 73 - "InfraSketch 3B단계: 경고·구성 패턴 구현 계획"
Cohesion: 0.40
Nodes (4): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus

### Community 74 - "domain/explain.ts"
Cohesion: 0.21
Nodes (16): Task 2: 용어 사전 시드와 서버 함수, normalizeTerm(), pickTerm(), termCandidates(), addAiTerm(), findTerm(), ExplanationView, fresh() (+8 more)

### Community 75 - "02. 금융·의료·산업제어(OT)·통신/기반시설 분야 망 구분과 망 사이 연결 규칙"
Cohesion: 0.15
Nodes (13): 02. 금융·의료·산업제어(OT)·통신/기반시설 분야 망 구분과 망 사이 연결 규칙, 1. 요약, 2. 망 종류 제안 표, 3. 망 짝 규칙 제안 표 (등급 기본값과 다른 경우만), 4.1 금융권, 4.2 의료, 4.3 산업 제어 (OT/ICS), 4.4 통신·데이터센터·일반 기반시설 (+5 more)

### Community 76 - "server/flows.ts"
Cohesion: 0.13
Nodes (22): Ctx, dynamic, GET(), runtime, Ctx, dynamic, GET(), runtime (+14 more)

### Community 77 - "display.ts"
Cohesion: 0.11
Nodes (19): Task 2: 마우스 강조·흐리기, Global Constraints, Review Focus, Task 7: 화면 확인, 전후 비교, E2E, 문서 동기화, 구성도 배치 조화 1단계 — 선택 강조와 선 간격 Implementation Plan, FlowProps, buildDisplayGraph(), DisplayGraph (+11 more)

### Community 78 - "reset.ts"
Cohesion: 0.22
Nodes (9): ResetPasswordPage(), passwordResetTokens, env, envSchema, sendMail(), isResetTokenUsable(), requestPasswordReset(), ResetResult (+1 more)

### Community 79 - "ZoneTypePicker.tsx"
Cohesion: 0.24
Nodes (7): ZoneType, AI_BADGE, AI_BADGE_SR, AI_GUESS_BADGE, AI_SUGGEST_BADGE, GRADES, ZoneTypePickerProps

### Community 80 - "domain/apply.ts"
Cohesion: 0.26
Nodes (16): Task 4: 되돌리기 도메인 — 대신한 연결 기록, 되돌리기, 흐름 단계 나누기·합치기, Task 4: 차례 끝 정리 공용화와 코드 경고 점검, FlowStep, has(), incident(), recordReplaced(), revertLinkGuess(), sameSet() (+8 more)

### Community 81 - "domain/apply.ts"
Cohesion: 0.30
Nodes (13): applyCommand(), applyCommands(), ApplyOptions, ApplyResult, endpointOk(), fail(), freeEdgeId(), has() (+5 more)

### Community 83 - "A) BLE·IoT 기기 통신 — 구성 지식"
Cohesion: 0.17
Nodes (11): 1. 전형적인 구성, 2. 구성요소 사전, 3. 망·보안 관점, 4. 구성도를 그리는 AI 에게 줄 지침 후보, 5. 확인하지 못한 것·출처가 갈리는 것, 6. 출처 목록, A) BLE·IoT 기기 통신 — 구성 지식, 구성 1 — 앱 ↔ 기기 BLE 직결 (가장 작은 구성: 웨어러블, 혈압계, 도어락 설정) (+3 more)

### Community 84 - "MentionInput"
Cohesion: 0.19
Nodes (7): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), Mention, MentionInput, MentionInputHandle, MentionInputProps, mentionToken()

### Community 85 - "DiagramState"
Cohesion: 0.19
Nodes (11): Claude Code 연동(MCP 서버) Implementation Plan, Global Constraints, Review Focus, Task 5: MCP 고치기·되돌리기 서비스, Command, AddEdge, createEdgeCoalescer(), EdgeCoalescer (+3 more)

### Community 86 - "Claude Code 연동(MCP 서버) — 설계"
Cohesion: 0.15
Nodes (12): 1. 누가 그리나, 2. 어디서 띄우나, 3. 키 관리 (제 판단), 5. 기록과 동시 작업, 6. 브라우저에서 보기 (사용자: "어렵지 않으면 시각 효과도"), Claude Code 연동(MCP 서버) — 설계, 만드는 사람에게 맡기는 것, 목표 (+4 more)

### Community 87 - "Task 9: 망 지식 화면"
Cohesion: 0.29
Nodes (15): Task 9: 망 지식 화면, addNetworkTypeAction(), bad(), deleteNetworkRuleAction(), deleteNetworkTypeAction(), reqBool(), reqGrade(), reqMethod() (+7 more)

### Community 88 - "망 지식 · 용어 사전 기본 데이터 리서치 (2026-11-11)"
Cohesion: 0.18
Nodes (7): 1. 가장 중요한 사실, 2. 지금 모델이 못 담는 것 (결정이 필요하다), 3. 넣을 수 있는 데이터, 4. 근거가 약한 것, 5. 넣을 때 정해야 하는 것, 6. 반영 현황 (2026-11-11, feat/knowledge-seed), 망 지식 · 용어 사전 기본 데이터 리서치 (2026-11-11)

### Community 89 - "03. 기업·클라우드 망 구분과 망·보안 용어 조사"
Cohesion: 0.18
Nodes (11): 03. 기업·클라우드 망 구분과 망·보안 용어 조사, 1. 요약, 2.1 기업 사내 망, 2.2 클라우드 망, 2.3 데이터센터 망, 2. 망 종류 제안 표, 3. 망 짝 규칙 제안 표, 5. 확인 못 한 것 / 출처가 엇갈리는 것 (+3 more)

### Community 90 - "normalize.ts"
Cohesion: 0.18
Nodes (13): DIRECTIONS, DROP_NULL, flattenAttr(), HAS_ATTRS, HAS_STEPS, ID_FIELDS, isPlainObject(), MEDIA (+5 more)

### Community 91 - "공공기관 망 구분과 망 사이 연결 규칙 — 조사 결과"
Cohesion: 0.22
Nodes (8): 1. 요약, 2-1. 기존 13개 보완, 2-2. 새로 넣을 것, 2. 망 종류 제안 표, 3. 망 짝 규칙 제안 표 (등급 기본값과 다른 것만), 5. 확인 못 한 것 / 출처가 엇갈리는 것, 6. 출처 목록, 공공기관 망 구분과 망 사이 연결 규칙 — 조사 결과

### Community 92 - "useRemoteChanges.ts"
Cohesion: 0.22
Nodes (9): Task 9: 열어 둔 브라우저가 변경을 알아채기, Head, isHead(), POLL_MS, read(), REMOTE_CHANGED, REMOTE_LOAD, useRemoteChanges() (+1 more)

### Community 93 - "4. 용어 사전 후보 (74개)"
Cohesion: 0.22
Nodes (9): 4.1 망 분리·연계, 4.2 제로 트러스트·접근 통제, 4.3 보안 장비, 4.4 네트워크, 4.5 클라우드 네트워크, 4.6 암호·인증, 4.7 운영 보안, 4.8 요청 목록 대비 점검 (+1 more)

### Community 94 - "04. 시스템 소프트웨어 · 하드웨어 · 국내 SI 현업 용어 — 용어 사전 후보"
Cohesion: 0.25
Nodes (8): 04. 시스템 소프트웨어 · 하드웨어 · 국내 SI 현업 용어 — 용어 사전 후보, 1. 요약, 2-D. 프로토콜 · 포트 (why·compare 채움), 2. 용어 사전 후보, 3. 클라우드 관리형 서비스 대응표, 4. 노드 종류와 사전 연결, 5. 확인 못 한 것 / 판단이 필요한 것, 6. 출처 목록

### Community 95 - "2-A. 소프트웨어·제품 (why·compare 비움)"
Cohesion: 0.25
Nodes (8): 2-A. 소프트웨어·제품 (why·compare 비움), 가상화 · 컨테이너, 데이터베이스, 미들웨어 · 연계 · 배치, 운영 도구 (빌드·배포·구성·모니터링), 운영체제, 웹 서버 · WAS · 실행 환경, 클라우드 관리형 서비스 (AWS 이름 — 다른 클라우드의 대응 이름은 3장)

### Community 96 - "2-C. 현업 개념 (why·compare 채움)"
Cohesion: 0.25
Nodes (8): 2-C. 현업 개념 (why·compare 채움), 노드 종류 설명용 (기존 50개에 없는 것), 데이터 · 확장, 미들웨어 · 연계 · 금융 SI, 이중화 · 가용성, 인프라 위치 · 클라우드 형태, 재해복구 · 백업, 환경 · 배포 · 운영

### Community 97 - "4. 분야별 설명"
Cohesion: 0.29
Nodes (7): 4-1. 국정원 지침의 망분리와 망 간 자료전송, 4-2. N²SF, 4-3. 분야별 망 이름, 4-4. 공공 클라우드, 4-5. 망연계 방식과 장비, 4-6. 원격 접속·외부 연계·추가 망, 4. 분야별 설명

### Community 98 - "2-B. 하드웨어 · 물리 인프라 (why·compare 채움)"
Cohesion: 0.29
Nodes (7): 2-B. 하드웨어 · 물리 인프라 (why·compare 채움), 디스크 · RAID, 백업 장비, 서버 · 부품, 스위치 (장비 관점), 스토리지 · 연결, 전산실 설비

### Community 99 - "[sessionId]/route.ts"
Cohesion: 0.19
Nodes (18): Ctx, DELETE(), dynamic, failed(), GET(), guard(), json(), PATCH() (+10 more)

### Community 100 - "domain/explain.ts"
Cohesion: 0.23
Nodes (10): Task 4: 서버 설명 생성, attrText(), endpointOf(), fnv1a(), LIMITS, overLimit(), signatureOf(), TermCandidate (+2 more)

### Community 101 - "현장 기기 · 영상 관제 · 실시간 통신 · AI 결합 구성 지식 리서치 (2026-11-12)"
Cohesion: 0.29
Nodes (6): 넣지 않은 것, 반영 현황, 접속이 막힌 출처, 주의, 핵심 사실, 현장 기기 · 영상 관제 · 실시간 통신 · AI 결합 구성 지식 리서치 (2026-11-12)

### Community 102 - "2단계 계획: AI 대화"
Cohesion: 0.18
Nodes (10): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 변경 명령 (add_node·add_edge·set_assumption 등), 요청 의도 분류 (+2 more)

### Community 103 - "textWidth"
Cohesion: 0.39
Nodes (8): charWidth(), EXTRA_WIDE_LATIN, isUpper(), isWide(), ratio(), textWidth(), truncate(), WIDE

### Community 104 - "diff.ts"
Cohesion: 0.36
Nodes (7): commandsBetween(), depth(), diffStates(), equal(), NOT_COMMAND_PATH, planCommandBackfill(), REPLAY_COMMANDS_MAX

### Community 105 - "qwen.ts"
Cohesion: 0.36
Nodes (6): abortError(), ChatMessage, createQwenClient(), attempt(), isRetryable(), RETRY_DELAYS

### Community 106 - "overlap.ts"
Cohesion: 0.39
Nodes (7): GROUP_PAD, circleHitsRect(), findOverlaps(), grow(), intersects(), PAIR_BADGE_OFFSET, strictlyInside()

### Community 107 - "createClefClient"
Cohesion: 0.50
Nodes (8): abortError(), createClefClient(), acquire(), classifyIntent(), decide(), post(), release(), run()

### Community 108 - "(app)/actions.ts"
Cohesion: 0.12
Nodes (38): Task 8: 키 화면, clearPinnedAction(), confirmAssumptionAction(), confirmLinkGuessAction(), createMcpKeyAction(), deleteMcpKeyAction(), getVersionAction(), importSampleAction() (+30 more)

### Community 109 - "Review Focus"
Cohesion: 0.29
Nodes (6): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 5: E2E — 노드 질문 흐름, 실행 순서

### Community 110 - "env.ts"
Cohesion: 0.21
Nodes (11): Task 5: 설명 API, Qwen URL 정규화, GET(), parseEnv(), defaultChatDeps(), setChatDepsForTest(), llmConfig, normalizeQwenBaseUrl() (+3 more)

### Community 111 - "Review Focus"
Cohesion: 0.33
Nodes (5): Review Focus, Task 10: E2E 와 문서, Task 1: 망 지식 도메인 — 타입, 기본 제공 목록, 필요한 방식 계산, Task 2: 구성도 상태 — 망 종류 칸, `set_zone_type`, 망연계 추정 표시 명령, 망 종류 지식과 망연계 예상 Implementation Plan

### Community 112 - "QwenClient"
Cohesion: 0.40
Nodes (5): ChatDeps, ExplainDeps, FlowSuggestDeps, ClefClient, QwenClient

## Knowledge Gaps
- **653 isolated node(s):** `MenuAction`, `MenuItem`, `MenuTarget`, `SidebarProject`, `UseFlowsInput` (+648 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 741 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `flowSuggest.ts` to `chat/warnings.ts`, `prompt.ts`, `설명 생성과 품질 검사`, `getOwnedDiagram`, `RightPanel.tsx`, `networkRules.ts`, `DiagramWorkspace.tsx`, `read.ts`, `index.ts`, `schema.ts`, `Canvas.tsx`, `NodeInfo.tsx`, `domain/warnings.ts`, `clarify.ts`, `server/network.ts`, `layoutMetrics.ts`, `mcp/apply.ts`, `MissingChecklist.tsx`, `projects.ts`, `pipeline.ts`, `missing.ts`, `types.ts`, `domain/assumptions.ts`, `samples.ts`, `FlowPanel.tsx`, `domain/explain.ts`, `server/flows.ts`, `display.ts`, `domain/apply.ts`, `domain/apply.ts`, `DiagramState`, `domain/explain.ts`, `diff.ts`, `(app)/actions.ts`, `흐름 보기와 망 경계 표시 Implementation Plan`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `Button()` connect `ResetPasswordForm.tsx` to `Sidebar.tsx`, `NodeInfo.tsx`, `NetworkKnowledgePage.tsx`, `ChatPanel.tsx`, `FlowPanel.tsx`, `Explanation.tsx`, `(app)/actions.ts`, `GlossaryPage.tsx`, `clarify.ts`, `RightPanel.tsx`, `ZoneTypePicker.tsx`, `Shell.tsx`, `DiagramWorkspace.tsx`, `MissingChecklist.tsx`, `SessionPicker.tsx`, `mcpKeys.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `InfraSketch 설계 문서` connect `InfraSketch 설계 문서` to `segments.ts`, `domain/assumptions.ts`, `2단계 계획: AI 대화`, `env.ts`, `MentionInput`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `ValidationError` (e.g. with `Task 2: 용어 사전 시드와 서버 함수` and `Task 5: 설명 API`) actually correct?**
  _`ValidationError` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MenuAction`, `MenuItem`, `MenuTarget` to the rest of the system?**
  _653 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14408602150537633 - nodes in this community are weakly interconnected._