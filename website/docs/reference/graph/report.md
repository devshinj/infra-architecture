---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1268 nodes · 3266 edges · 66 communities (62 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `108d1882`
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
- 명령 적용과 샘플
- pipeline.ts
- exportImage.ts
- 설명 생성과 품질 검사
- display.ts
- InfoCard.tsx
- useCamera.ts
- SessionPicker.tsx
- deps.ts
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
- domain/explain.ts
- normalize.ts
- NodeInfo.tsx
- FlyLayer.tsx
- Explanation.tsx
- ExportMenu.tsx
- DiagramState
- [sessionId]/route.ts
- MentionInput
- catalog.ts
- useSessions.ts
- Legend.tsx
- clef.ts
- getOwnedDiagram
- Review Focus
- (app)/actions.ts
- Layout
- motion.ts
- GlossaryPage.tsx
- Review Focus
- ChatPanelProps
- auth.ts
- schema.ts
- SkipTally
- DiagramWorkspace
- glossary.ts
- domain/warnings.ts
- MobileTabBar.tsx
- explain/route.ts
- useChatTurn
- qwen.ts
- createClefClient
- health.ts
- ClefClient

## God Nodes (most connected - your core abstractions)
1. `DiagramWorkspace()` - 39 edges
2. `DiagramState` - 37 edges
3. `getOwnedDiagram()` - 34 edges
4. `InfraSketch 설계 문서` - 34 edges
5. `Flow()` - 31 edges
6. `Sidebar()` - 27 edges
7. `ValidationError` - 26 edges
8. `lockedTurn()` - 26 edges
9. `explainTarget()` - 24 edges
10. `auth` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙` --references--> `applyCommand()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/domain/apply.ts
- `Task 7: 대화창 — 말풍선과 진행 카드` --references--> `messagesToLines()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/ui/chat/lines.ts
- `Task 1: 세션 저장` --references--> `listMessages()`  [INFERRED]
  docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md → src/server/chat/messages.ts
- `Task 3: 대화 차례에 점검 단계 넣기` --references--> `ChatEvent`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/server/chat/events.ts
- `Task 2: 용어 사전 시드와 서버 함수` --references--> `NotFoundError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (66 total, 4 thin omitted)

### Community 0 - "Sidebar.tsx"
Cohesion: 0.12
Nodes (34): createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction(), refreshAll(), renameDiagramAction(), renameProjectAction() (+26 more)

### Community 1 - "chat/warnings.ts"
Cohesion: 0.20
Nodes (17): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, Warning, buildWarningMessages(), carryExposed() (+9 more)

### Community 2 - "segments.ts"
Cohesion: 0.22
Nodes (15): BASE_SPEED, buildSegs(), InEdge, normalize(), Piece, piecesOf(), pk(), Pt (+7 more)

### Community 3 - "schema.ts"
Cohesion: 0.07
Nodes (55): AuthField(), AuthSubmit(), Props, FieldErrors, Options, useAuthForm(), LoginForm(), validate() (+47 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.15
Nodes (19): Block, BUILD_STEPS, CardView(), ChatPanel(), Check(), CHIP_KINDS, Dots(), ELSEWHERE_BUSY (+11 more)

### Community 5 - "prompt.ts"
Cohesion: 0.10
Nodes (23): Pattern, patternPromptBlock(), PATTERNS, ancestorsOf(), ANSWER_PROMPT, ASK_PROMPT, buildExplainMessages(), buildMessages() (+15 more)

### Community 6 - "설계 문서와 계획"
Cohesion: 0.08
Nodes (31): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전 (+23 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.16
Nodes (14): MissingItem, Block, blocksOf(), ChecklistDraft, ChecklistDrafts, ChecklistExpanded, Chevron(), Draft (+6 more)

### Community 8 - "layout.ts"
Cohesion: 0.07
Nodes (46): elbowRoute(), Pt, azChipWidth(), azOf(), BASE_OPTIONS, CONTENT_WIDTH, crossings(), elk (+38 more)

### Community 9 - "types.ts"
Cohesion: 0.22
Nodes (10): 가정 목록 (구조 결정), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage(), STRUCTURAL_KEYS, Assumption, AssumptionChips(), AssumptionChipsProps (+2 more)

### Community 10 - "명령 적용과 샘플"
Cohesion: 0.06
Nodes (39): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus, applyCommand(), applyCommands(), ApplyResult, endpointOk() (+31 more)

### Community 11 - "pipeline.ts"
Cohesion: 0.11
Nodes (37): Task 2: 질문 차례(서버), isAssumptionChangeMessage(), parseCommand(), AskArgs, askInSession(), HANDOFF_REPLY, hasNode(), lockedAsk() (+29 more)

### Community 12 - "exportImage.ts"
Cohesion: 0.12
Nodes (21): buildStage(), CHROME, decodeSvgDataUrl(), diagramBounds(), download(), EdgeLabel, edgeLabels(), EXPORT_PADDING (+13 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.10
Nodes (29): Task 4: 서버 설명 생성, ExplanationTargetKind, overLimit(), termCandidates(), cachedNodeExplanation(), codePoints(), complete(), dbRepo (+21 more)

### Community 14 - "display.ts"
Cohesion: 0.18
Nodes (17): buildDisplayGraph(), DisplayGroup, DisplayOptions, isBus(), APPEARING_MS, Pinned, UPDATED_MS, useDiagramView() (+9 more)

### Community 15 - "InfoCard.tsx"
Cohesion: 0.21
Nodes (7): Task 5: 주의 항목 바로 가기, mergeWarnings(), Chevron(), Count(), InfoCard(), InfoCardProps, LEVEL_LABEL

### Community 16 - "useCamera.ts"
Cohesion: 0.12
Nodes (20): CameraInput, EDGE_GAP_PX, FINAL_FIT_DURATION, fitViewport(), FOCUS_DURATION, FOCUS_MIN_ZOOM, FOCUS_SIDE_MIN, focusViewport() (+12 more)

### Community 17 - "SessionPicker.tsx"
Cohesion: 0.28
Nodes (10): usePopover(), Chevron(), pad(), sessionName(), SessionPicker(), SessionPickerProps, when(), SessionKey (+2 more)

### Community 18 - "deps.ts"
Cohesion: 0.36
Nodes (7): Task 5: 설명 API, Qwen URL 정규화, parseEnv(), defaultChatDeps(), setChatDepsForTest(), llmConfig, normalizeQwenBaseUrl()

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.15
Nodes (16): defaultDisplayOptions(), initialCollapsed(), CardMeasure, hasId(), MOBILE_VIEW_KEY, Mode, NO_SESSIONS, optionsFor() (+8 more)

### Community 21 - "missing.ts"
Cohesion: 0.52
Nodes (6): computeMissing(), FIELD_LABELS, labelOf(), requiredKeysFor(), requiredKeysForEdge(), requiredKeysForNode()

### Community 22 - "Canvas.tsx"
Cohesion: 0.11
Nodes (25): canvasAriaLabels(), DIRECTION, zoneDescription(), Canvas(), CanvasOptions, DiffMarks, drawnId(), FAR_ZOOM (+17 more)

### Community 23 - "연결선 그리기"
Cohesion: 0.13
Nodes (19): Task 2: 마우스 강조·흐리기, 연결선 모양과 움직임, ARROW, arrowD(), EdgeLayer(), EdgeLayerPortal(), EdgeLayerProps, motionOf() (+11 more)

### Community 24 - "auth"
Cohesion: 0.12
Nodes (21): Task 1: DB 테이블과 마이그레이션, userId(), AppLayout(), Home(), auth, lastActiveDiagram(), listProjects(), COMPACT_QUERY (+13 more)

### Community 25 - "연결선 개발용 화면"
Cohesion: 0.17
Nodes (15): ALB, EdgePanels(), n(), Panel, PanelEdge, PanelNode, PANELS, PanelView() (+7 more)

### Community 26 - "NodeMenu"
Cohesion: 0.48
Nodes (3): NodeMenu(), NodeMenuProps, placeMenu()

### Community 27 - "ask/route.ts"
Cohesion: 0.13
Nodes (17): BodySchema, dynamic, json(), POST(), runtime, BodySchema, dynamic, POST() (+9 more)

### Community 28 - "Flow"
Cohesion: 0.13
Nodes (12): CanvasProps, Flow(), ZoomVar(), CONE_SLACK, gap(), NAV_KEYS, navItems(), readingOrder() (+4 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.12
Nodes (15): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 2: 용어 사전 시드와 서버 함수, Task 3: 설명 도메인 — 모양·길이·서명 (+7 more)

### Community 30 - "useChatTurn.ts"
Cohesion: 0.14
Nodes (19): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, MessageRole, warningsByNode(), keepsCard(), messagesToLines(), Row, summaryText(), timeOf() (+11 more)

### Community 31 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 6: E2E — 3E 흐름, 실행 순서

### Community 32 - "domain/explain.ts"
Cohesion: 0.12
Nodes (24): Task 7: 설명 큐와 연결, listTermsAction(), attrText(), EdgeExplanation, endpointOf(), fnv1a(), LIMITS, NodeExplanation (+16 more)

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
Cohesion: 0.26
Nodes (14): ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), NodeBody(), Retry(), Rewrite(), Section() (+6 more)

### Community 37 - "ExportMenu.tsx"
Cohesion: 0.12
Nodes (18): ExportBackground, ExportFormat, LIGHT_BACKGROUND, BACKGROUNDS, EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON, EXPORT_FAILED_MESSAGE (+10 more)

### Community 38 - "DiagramState"
Cohesion: 0.16
Nodes (9): HistoryPanel(), HistoryPanelProps, SOURCE_LABEL, VersionRow, RIGHT_PANEL_BODY_ID, RightPanel(), RightPanelProps, tabIdOf() (+1 more)

### Community 39 - "[sessionId]/route.ts"
Cohesion: 0.15
Nodes (14): dynamic, GET(), runtime, SessionIdSchema, listMessagesAction(), DiagramPage(), chatSessions, listMessages() (+6 more)

### Community 40 - "MentionInput"
Cohesion: 0.19
Nodes (7): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), Mention, MentionInput, MentionInputHandle, MentionInputProps, mentionToken()

### Community 41 - "catalog.ts"
Cohesion: 0.14
Nodes (16): GroupBox(), GroupBoxData, CategoryIcon(), PATHS, isKeyboardFocus(), NameTooltip(), useNameTooltip(), NodeCard() (+8 more)

### Community 42 - "useSessions.ts"
Cohesion: 0.31
Nodes (8): Lines, NEW_SESSION, Row, titleOf(), turnOnly(), Update, useSessions(), without()

### Community 43 - "Legend.tsx"
Cohesion: 0.19
Nodes (11): EDGE_KINDS, Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), legendPlacement() (+3 more)

### Community 44 - "clef.ts"
Cohesion: 0.17
Nodes (10): ClefAnswer, ClefAnswers, ClefHttpError, EXPLAIN_SCORE_QUESTION, INTENT_MIN_CONFIDENCE, INTENT_QUESTION, INTENTS, RESTART_DELAYS (+2 more)

### Community 45 - "getOwnedDiagram"
Cohesion: 0.26
Nodes (15): Task 3: 대화 차례에 점검 단계 넣기, Task 4: "의도된 구성" 저장, confirmAssumption(), emptyState(), confirmAssumptionFor(), BUSY_MESSAGE, withDiagramLock(), saveFieldsFor() (+7 more)

### Community 46 - "Review Focus"
Cohesion: 0.25
Nodes (7): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), Task 5: E2E — 노드 질문 흐름, 실행 순서

### Community 47 - "(app)/actions.ts"
Cohesion: 0.14
Nodes (31): listVersionsAction(), TextPatch, SaveFieldsInput, assertOwnedProject(), assertUniqueDiagramName(), assertUniqueProjectName(), assertUuid(), cleanName() (+23 more)

### Community 48 - "Layout"
Cohesion: 0.25
Nodes (8): FlowProps, DisplayGraph, Layout, EDGE_Z, NODE_Z, ZONE_Z_MAX, zoneZ(), DiagramView

### Community 49 - "motion.ts"
Cohesion: 0.39
Nodes (8): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), startBundleMotion()

### Community 50 - "GlossaryPage.tsx"
Cohesion: 0.19
Nodes (16): ActionResult, listGlossaryAction(), setTermReviewedAction(), updateTermAction(), Glossary(), GlossaryItem, toGlossaryItem(), ensureSeeded() (+8 more)

### Community 51 - "Review Focus"
Cohesion: 0.11
Nodes (17): Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저), Task 11: 빈 구성도 시작 경험 — 인사말·가이드·예시 질문 (사용자 추가 요청, 2026-10-30), Task 12: 대화에서 캔버스로 날아가는 빛점 (사용자 추가 요청, 2026-10-30), Task 13: 도구 모음 정리와 스크롤 정리 (사용자 추가 요청, 2026-10-30), Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙 (+9 more)

### Community 53 - "auth.ts"
Cohesion: 0.16
Nodes (11): logoutAction(), authConfig, handlers, signOut, { auth }, config, authDecision, isPublicPath() (+3 more)

### Community 54 - "schema.ts"
Cohesion: 0.17
Nodes (14): accounts, diagrams, diagramVersions, explanations, GlossarySource, messages, passwordResetTokens, projects (+6 more)

### Community 56 - "DiagramWorkspace"
Cohesion: 0.35
Nodes (13): clearPinnedAction(), confirmAssumptionAction(), getVersionAction(), importSampleAction(), refreshDiagram(), restoreVersionAction(), run(), runResult() (+5 more)

### Community 57 - "glossary.ts"
Cohesion: 0.23
Nodes (10): glossaryTerms, normalizeTerm(), pickTerm(), GLOSSARY_SEED, GlossarySeedEntry, addAiTerm(), findTerm(), TermPatch (+2 more)

### Community 58 - "domain/warnings.ts"
Cohesion: 0.24
Nodes (11): categoryOf(), Edge, ancestorKinds(), DATA_KINDS, evaluateRules(), make(), PUBLIC_GROUPS, ruleOf() (+3 more)

### Community 59 - "MobileTabBar.tsx"
Cohesion: 0.24
Nodes (7): ICONS, MOBILE_VIEWS, MobileTabBar(), MobileTabBarProps, mobileTabId(), MobileView, Tab

### Community 60 - "explain/route.ts"
Cohesion: 0.27
Nodes (9): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+1 more)

### Community 62 - "qwen.ts"
Cohesion: 0.36
Nodes (6): abortError(), ChatMessage, createQwenClient(), attempt(), isRetryable(), RETRY_DELAYS

### Community 63 - "createClefClient"
Cohesion: 0.50
Nodes (8): abortError(), createClefClient(), acquire(), classifyIntent(), decide(), post(), release(), run()

### Community 64 - "health.ts"
Cohesion: 0.43
Nodes (4): GET(), checkLlmHealth(), LlmHealth, probe()

### Community 65 - "ClefClient"
Cohesion: 0.50
Nodes (4): ChatDeps, ExplainDeps, ClefClient, QwenClient

## Knowledge Gaps
- **288 isolated node(s):** `DeleteDialog`, `Dialog`, `MenuAction`, `MenuItem`, `MenuTarget` (+283 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 336 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `display.ts` to `chat/warnings.ts`, `prompt.ts`, `MissingChecklist.tsx`, `types.ts`, `명령 적용과 샘플`, `pipeline.ts`, `설명 생성과 품질 검사`, `InfoCard.tsx`, `SessionPicker.tsx`, `DiagramWorkspace.tsx`, `missing.ts`, `Canvas.tsx`, `Flow`, `domain/explain.ts`, `NodeInfo.tsx`, `DiagramState`, `getOwnedDiagram`, `(app)/actions.ts`, `schema.ts`, `domain/warnings.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `applyCommand()` connect `명령 적용과 샘플` to `pipeline.ts`, `DiagramWorkspace`, `Review Focus`, `DiagramWorkspace.tsx`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `Canvas()` connect `Canvas.tsx` to `ExportMenu.tsx`, `설계 문서와 계획`, `exportImage.ts`, `display.ts`, `DiagramWorkspace.tsx`, `DiagramWorkspace`, `Flow`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DeleteDialog`, `Dialog`, `MenuAction` to the rest of the system?**
  _288 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `schema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06750700280112044 - nodes in this community are weakly interconnected._