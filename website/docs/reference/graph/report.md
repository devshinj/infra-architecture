---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1425 nodes · 3642 edges · 74 communities (72 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 124 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2d34e926`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Sidebar.tsx
- chat/warnings.ts
- segments.ts
- auth.ts
- ChatPanel.tsx
- prompt.ts
- 설계 문서와 계획
- MissingChecklist.tsx
- layout.ts
- types.ts
- Review Focus
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
- SessionPickerProps
- ResetPasswordForm.tsx
- rules.ts
- schema.ts
- pipeline.ts
- Layout
- ZoneNameLayer.tsx
- domain/warnings.ts
- ref_zod
- auth
- lines.ts
- deps.ts
- createClefClient
- useChatTurn.ts
- 2단계 계획: AI 대화
- 구성도 배치 조화 1단계 — 선택 강조와 선 간격
- auth/actions.ts
- useChatTurn
- 사용자가 정한 것
- getSession
- health.ts
- stacking.ts
- InfraSketch 3B단계: 경고·구성 패턴 구현 계획

## God Nodes (most connected - your core abstractions)
1. `DiagramWorkspace()` - 39 edges
2. `DiagramState` - 38 edges
3. `getOwnedDiagram()` - 36 edges
4. `InfraSketch 설계 문서` - 34 edges
5. `Flow()` - 33 edges
6. `ValidationError` - 29 edges
7. `lockedTurn()` - 28 edges
8. `Sidebar()` - 27 edges
9. `explainTarget()` - 24 edges
10. `auth` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Global Constraints` --references--> `applyCommand()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/domain/apply.ts
- `Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙` --references--> `applyCommand()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/domain/apply.ts
- `Task 1: 세션 저장` --references--> `listMessages()`  [INFERRED]
  docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md → src/server/chat/messages.ts
- `Task 7: 대화창 — 말풍선과 진행 카드` --references--> `messagesToLines()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/ui/chat/lines.ts
- `Task 3: 대화 차례에 점검 단계 넣기` --references--> `ChatEvent`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/server/chat/events.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (74 total, 2 thin omitted)

### Community 0 - "Sidebar.tsx"
Cohesion: 0.12
Nodes (28): DeleteDialog, Dialog, DialogView(), focusables(), GENERIC_ERROR, NameDialog, RowMenu(), RowMenuItem (+20 more)

### Community 1 - "chat/warnings.ts"
Cohesion: 0.16
Nodes (22): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 3: 대화 차례에 점검 단계 넣기, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, Warning, buildWarningMessages() (+14 more)

### Community 2 - "segments.ts"
Cohesion: 0.23
Nodes (17): assignStarts(), buildSegmentBundles(), buildSegs(), InEdge, normalize(), Piece, piecesOf(), pk() (+9 more)

### Community 3 - "auth.ts"
Cohesion: 0.11
Nodes (13): metadata, suit, viewport, authConfig, handlers, { auth }, config, authDecision (+5 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.09
Nodes (26): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), Block, BUILD_STEPS, CardView(), ChatPanel(), Check(), CHIP_KINDS (+18 more)

### Community 5 - "prompt.ts"
Cohesion: 0.10
Nodes (24): Pattern, patternPromptBlock(), PATTERNS, ancestorsOf(), ANSWER_PROMPT, ASK_PROMPT, buildExplainMessages(), buildMessages() (+16 more)

### Community 6 - "설계 문서와 계획"
Cohesion: 0.11
Nodes (21): 대화 차례 파이프라인, "중단됨" 버전, 이상한 구성 경고, 로그인·회원 (Auth.js Credentials), 자동 배치 (ELK layered), 변경 명령 (add_node·add_edge·set_assumption 등), Clef-Flash 판정 모델, InfraSketch 설계 문서 (+13 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.16
Nodes (14): CategoryIcon(), PATHS, Category, Block, blocksOf(), ChecklistDraft, Chevron(), Draft (+6 more)

### Community 8 - "layout.ts"
Cohesion: 0.11
Nodes (27): Task 6: 영역 이름 크기 보정과 접힌 상자 폭, azChipWidth(), azOf(), BASE_OPTIONS, COLLAPSED_MAX_WIDTH, collapsedGroupWidth(), CONTENT_WIDTH, crossings() (+19 more)

### Community 9 - "types.ts"
Cohesion: 0.22
Nodes (10): 가정 목록 (구조 결정), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage(), STRUCTURAL_KEYS, Assumption, AssumptionChips(), AssumptionChipsProps (+2 more)

### Community 10 - "Review Focus"
Cohesion: 0.11
Nodes (17): Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저), Task 11: 빈 구성도 시작 경험 — 인사말·가이드·예시 질문 (사용자 추가 요청, 2026-10-30), Task 12: 대화에서 캔버스로 날아가는 빛점 (사용자 추가 요청, 2026-10-30), Task 13: 도구 모음 정리와 스크롤 정리 (사용자 추가 요청, 2026-10-30), Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙 (+9 more)

### Community 11 - "ask.ts"
Cohesion: 0.20
Nodes (16): Task 2: 질문 차례(서버), AskArgs, askInSession(), HANDOFF_REPLY, hasNode(), lockedAsk(), runAskTurn(), createMessage() (+8 more)

### Community 12 - "exportImage.ts"
Cohesion: 0.11
Nodes (22): 제약, buildStage(), CHROME, decodeSvgDataUrl(), diagramBounds(), download(), EdgeLabel, edgeLabels() (+14 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.11
Nodes (27): explanations, ExplanationTargetKind, cachedNodeExplanation(), codePoints(), dbRepo, DepsInput, Draft, draftOf() (+19 more)

### Community 14 - "display.ts"
Cohesion: 0.16
Nodes (16): buildDisplayGraph(), defaultDisplayOptions(), DisplayGroup, DisplayOptions, initialCollapsed(), isBus(), elbowRoute(), Pt (+8 more)

### Community 15 - "InfoCard.tsx"
Cohesion: 0.21
Nodes (7): Task 5: 주의 항목 바로 가기, mergeWarnings(), Chevron(), Count(), InfoCard(), InfoCardProps, LEVEL_LABEL

### Community 16 - "useCamera.ts"
Cohesion: 0.12
Nodes (20): CameraInput, EDGE_GAP_PX, FINAL_FIT_DURATION, fitViewport(), FOCUS_DURATION, FOCUS_MIN_ZOOM, FOCUS_SIDE_MIN, focusViewport() (+12 more)

### Community 17 - "SessionPicker.tsx"
Cohesion: 0.19
Nodes (12): usePopover(), Action, byRecent(), Chevron(), MAIN_LABEL, menuRootId(), MORE_LABEL, pad() (+4 more)

### Community 18 - "domain/explain.ts"
Cohesion: 0.23
Nodes (10): Task 4: 서버 설명 생성, attrText(), endpointOf(), fnv1a(), LIMITS, overLimit(), signatureOf(), TermCandidate (+2 more)

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.11
Nodes (22): CardMeasure, ChecklistDrafts, ChecklistExpanded, hasId(), MOBILE_VIEW_KEY, Mode, NO_SESSIONS, Pinned (+14 more)

### Community 21 - "missing.ts"
Cohesion: 0.26
Nodes (11): 빠진 정보 채우기, 노드 종류 목록 (kind·group_kind·edge_kind), NODE_KINDS, computeMissing(), FIELD_LABELS, labelOf(), MissingItem, missingReminder() (+3 more)

### Community 22 - "Canvas.tsx"
Cohesion: 0.11
Nodes (24): Task 3: 강조 토큰과 노드·영역 흐림, Canvas(), CanvasOptions, DiffMarks, drawnId(), FAR_ZOOM, Icon(), IconArrange() (+16 more)

### Community 23 - "연결선 그리기"
Cohesion: 0.16
Nodes (17): Task 2: 마우스 강조·흐리기, PanelEdge, DisplayEdge, ARROW, arrowD(), EdgeLayer(), EdgeLayerPortal(), EdgeLayerProps (+9 more)

### Community 24 - "auth"
Cohesion: 0.16
Nodes (16): AppLayout(), Home(), lastActiveDiagram(), listProjects(), COMPACT_QUERY, CreateButton(), CreateRequest, extentOf() (+8 more)

### Community 25 - "연결선 개발용 화면"
Cohesion: 0.21
Nodes (12): ALB, EdgePanels(), n(), Panel, PanelNode, PANELS, PanelView(), Pt (+4 more)

### Community 26 - "NodeMenu"
Cohesion: 0.48
Nodes (3): NodeMenu(), NodeMenuProps, placeMenu()

### Community 27 - "ask/route.ts"
Cohesion: 0.11
Nodes (22): BodySchema, dynamic, json(), maxDuration, POST(), runtime, BodySchema, dynamic (+14 more)

### Community 28 - "Flow"
Cohesion: 0.16
Nodes (8): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, canvasAriaLabels(), DIRECTION, zoneDescription(), CanvasProps, Flow(), ZoomVar(), warningsByNode()

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.11
Nodes (17): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+9 more)

### Community 30 - "useSessions.ts"
Cohesion: 0.18
Nodes (16): MessageMeta, ChatLine, errorOf(), Lines, mergeSessions(), NEW_CHAT_TITLE, NO_PAGING, Row (+8 more)

### Community 31 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 6: E2E — 3E 흐름, 실행 순서

### Community 32 - "useExplanations.ts"
Cohesion: 0.15
Nodes (20): Task 2: 용어 사전 시드와 서버 함수, EdgeExplanation, NodeExplanation, normalizeTerm(), pickTerm(), termCandidates(), addAiTerm(), findTerm() (+12 more)

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
Cohesion: 0.18
Nodes (18): ActionResult, ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), NodeBody(), Retry(), Rewrite() (+10 more)

### Community 37 - "ExportMenu.tsx"
Cohesion: 0.13
Nodes (18): ExportBackground, ExportFormat, LIGHT_BACKGROUND, BACKGROUNDS, EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON, EXPORT_FAILED_MESSAGE (+10 more)

### Community 38 - "DiagramState"
Cohesion: 0.14
Nodes (10): ChatPanelProps, HistoryPanel(), HistoryPanelProps, SOURCE_LABEL, VersionRow, RIGHT_PANEL_BODY_ID, RightPanel(), RightPanelProps (+2 more)

### Community 39 - "[sessionId]/route.ts"
Cohesion: 0.12
Nodes (27): Ctx, DELETE(), dynamic, failed(), GET(), guard(), json(), PATCH() (+19 more)

### Community 40 - "edgeLabels.ts"
Cohesion: 0.09
Nodes (31): arcOf(), Beside, besideNode(), Box, commonPrefix(), fromSelected(), IncidentEdge, LABEL_LINE (+23 more)

### Community 41 - "NodeCard.tsx"
Cohesion: 0.38
Nodes (5): isKeyboardFocus(), NameTooltip(), useNameTooltip(), NodeCard(), nodeTypes

### Community 42 - "text.ts"
Cohesion: 0.39
Nodes (8): charWidth(), EXTRA_WIDE_LATIN, isUpper(), isWide(), ratio(), textWidth(), truncate(), WIDE

### Community 43 - "Legend.tsx"
Cohesion: 0.21
Nodes (10): Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), legendPlacement(), LegendPlacementInput (+2 more)

### Community 44 - "clef.ts"
Cohesion: 0.18
Nodes (12): isAssumptionChangeMessage(), resolveIntent(), ClefAnswer, ClefAnswers, EXPLAIN_SCORE_QUESTION, Intent, INTENT_MIN_CONFIDENCE, INTENT_QUESTION (+4 more)

### Community 45 - "samples.ts"
Cohesion: 0.07
Nodes (35): applyCommand(), applyCommands(), ApplyResult, endpointOk(), fail(), has(), idTaken(), isEmptyGroup() (+27 more)

### Community 46 - "Review Focus"
Cohesion: 0.25
Nodes (7): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), Task 5: E2E — 노드 질문 흐름, 실행 순서

### Community 47 - "(app)/actions.ts"
Cohesion: 0.06
Nodes (92): Task 4: "의도된 구성" 저장, clearPinnedAction(), confirmAssumptionAction(), createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction() (+84 more)

### Community 48 - "Layout"
Cohesion: 0.21
Nodes (12): GROUP_PAD, LaidOutGroup, LaidOutNode, Rect, circleHitsRect(), findOverlaps(), grow(), intersects() (+4 more)

### Community 49 - "motion.ts"
Cohesion: 0.23
Nodes (12): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+4 more)

### Community 50 - "layoutMetrics.ts"
Cohesion: 0.13
Nodes (22): Review Focus, Task 1: 배치 측정 모듈과 기준선 테스트, Task 2: 평소 화면 평행선 16px, Task 4: 강조 겹선 층(선택·호버)과 갈림점·움직임 층, Task 5: 같은 연결 이름 합치기, Task 7: 화면 확인, 전후 비교, E2E, 문서 동기화, defaultViewLayout(), END_TRIM (+14 more)

### Community 51 - "SessionPickerProps"
Cohesion: 0.24
Nodes (4): SessionPickerProps, MoreState, SessionKey, SessionKind

### Community 52 - "ResetPasswordForm.tsx"
Cohesion: 0.19
Nodes (16): AuthField(), AuthSubmit(), Props, FieldErrors, Options, useAuthForm(), LoginForm(), validate() (+8 more)

### Community 53 - "rules.ts"
Cohesion: 0.19
Nodes (18): ResetRequestPage(), validate(), SignupPage(), validate(), requestResetAction(), checkEmail(), checkNewPassword(), checkUsername() (+10 more)

### Community 54 - "schema.ts"
Cohesion: 0.13
Nodes (17): db, accounts, diagrams, GlossarySource, MessageRole, messages, passwordResetTokens, projects (+9 more)

### Community 55 - "pipeline.ts"
Cohesion: 0.11
Nodes (20): isStructural(), parseCommand(), abortError(), ChatDeps, HISTORY_REPLY, KNOWN_OPS, LAYOUT_REPLY, lockedTurn() (+12 more)

### Community 56 - "Layout"
Cohesion: 0.13
Nodes (16): Global Constraints, 구성도 배치 조화 1단계 — 선택 강조와 선 간격 Implementation Plan, FlowProps, DisplayGraph, Layout, MeasuredView, CONE_SLACK, gap() (+8 more)

### Community 57 - "ZoneNameLayer.tsx"
Cohesion: 0.24
Nodes (12): GroupBox(), GroupBoxData, groupToggleLabel(), groupToggleWidth(), ZoneName, ZoneNameLayer(), ZoneNameLayerPortal(), ZoneNameLayerProps (+4 more)

### Community 58 - "domain/warnings.ts"
Cohesion: 0.13
Nodes (21): categoryOf(), DATA, GUARD, NodeKind, NodeKindDef, SERVER, Attrs, DiagramState (+13 more)

### Community 59 - "ref_zod"
Cohesion: 0.24
Nodes (7): Qwen URL 정규화, env, envSchema, parseEnv(), sendMail(), llmConfig, normalizeQwenBaseUrl()

### Community 60 - "auth"
Cohesion: 0.15
Nodes (20): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+12 more)

### Community 61 - "lines.ts"
Cohesion: 0.29
Nodes (10): changedOf(), keepsCard(), legacySummaryText(), messagesToLines(), NOT_APPLIED_MESSAGE, Row, summaryText(), timeOf() (+2 more)

### Community 62 - "deps.ts"
Cohesion: 0.26
Nodes (9): Task 5: 설명 API, defaultChatDeps(), setChatDepsForTest(), abortError(), ChatMessage, createQwenClient(), attempt(), isRetryable() (+1 more)

### Community 63 - "createClefClient"
Cohesion: 0.36
Nodes (9): abortError(), ClefHttpError, createClefClient(), acquire(), classifyIntent(), decide(), post(), release() (+1 more)

### Community 64 - "useChatTurn.ts"
Cohesion: 0.20
Nodes (9): ANSWER_INTENTS, CardStep, DoneEvent, isAbort(), MAIN, nextId(), ProgressCard, TurnTarget (+1 more)

### Community 65 - "2단계 계획: AI 대화"
Cohesion: 0.22
Nodes (7): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전

### Community 66 - "구성도 배치 조화 1단계 — 선택 강조와 선 간격"
Cohesion: 0.22
Nodes (8): 구성도 배치 조화 1단계 — 선택 강조와 선 간격, 내가 정한 것 (사용자 확인 필요), 만드는 사람에게 맡기는 것, 목표, 실패로 보는 것, 왜 하는가, 측정과 회귀 테스트, 하지 않는 것 (2~4단계 몫)

### Community 67 - "auth/actions.ts"
Cohesion: 0.42
Nodes (8): signIn, loginAction(), resetPasswordAction(), signupAction(), text(), requestPasswordReset(), resetPassword(), sha256()

### Community 69 - "사용자가 정한 것"
Cohesion: 0.29
Nodes (7): 1. 강조 방식: "굵게 + 은은한 빛, 선 종류 색 유지", 2. 함께 지나는 구간: "한 줄기로 묶기", 3. 반복되는 연결 이름: "같은 이름은 한 번만, 개수와 함께", 4. 평행선 간격, 5. 영역 이름 크기: "확대에 맞춰 보정", 6. 접힌 영역 상자: "상자 폭을 이름에 맞춤", 사용자가 정한 것

### Community 70 - "getSession"
Cohesion: 0.48
Nodes (6): POST(), guardEmit(), runChatTurn(), sessionTurn(), TurnArgs, getSession()

### Community 71 - "health.ts"
Cohesion: 0.43
Nodes (4): GET(), checkLlmHealth(), LlmHealth, probe()

### Community 72 - "stacking.ts"
Cohesion: 0.33
Nodes (5): EDGE_Z, NODE_Z, ZONE_NAME_IN_PORTAL_Z, ZONE_Z_MAX, zoneZ()

### Community 73 - "InfraSketch 3B단계: 경고·구성 패턴 구현 계획"
Cohesion: 0.40
Nodes (4): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus

## Knowledge Gaps
- **343 isolated node(s):** `DeleteDialog`, `MenuAction`, `MenuItem`, `MenuTarget`, `SidebarProject` (+338 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 399 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `domain/warnings.ts` to `chat/warnings.ts`, `prompt.ts`, `MissingChecklist.tsx`, `types.ts`, `ask.ts`, `설명 생성과 품질 검사`, `display.ts`, `InfoCard.tsx`, `domain/explain.ts`, `DiagramWorkspace.tsx`, `missing.ts`, `Canvas.tsx`, `Flow`, `useSessions.ts`, `useExplanations.ts`, `NodeInfo.tsx`, `DiagramState`, `samples.ts`, `(app)/actions.ts`, `layoutMetrics.ts`, `schema.ts`, `pipeline.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `neutralizeClone()` connect `exportImage.ts` to `layoutMetrics.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `제약` connect `exportImage.ts` to `구성도 배치 조화 1단계 — 선택 강조와 선 간격`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DeleteDialog`, `MenuAction`, `MenuItem` to the rest of the system?**
  _343 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12096774193548387 - nodes in this community are weakly interconnected._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10869565217391304 - nodes in this community are weakly interconnected._