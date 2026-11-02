---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1215 nodes · 3146 edges · 55 communities (52 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 102 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `59ca6844`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Sidebar.tsx
- chat/warnings.ts
- segments.ts
- signup/page.tsx
- ChatPanel.tsx
- prompt.ts
- 설계 문서와 계획
- MissingChecklist.tsx
- layout.ts
- projects.ts
- 명령 적용과 샘플
- pipeline.ts
- exportImage.ts
- 설명 생성과 품질 검사
- display.ts
- schema.ts
- useCamera.ts
- projects.ts
- ClefClient
- 라우트 재수출
- DiagramWorkspace.tsx
- reset.ts
- Canvas.tsx
- 연결선 그리기
- Shell.tsx
- 연결선 개발용 화면
- NodeMenu
- ask/route.ts
- Flow
- 3C-1 계획 작업 목록
- types.ts
- glossary.ts
- useExplanations.ts
- normalize.ts
- NodeInfo.tsx
- FlyLayer.tsx
- GlossaryPage.tsx
- ExportMenu.tsx
- DiagramState
- ask.ts
- MentionInput
- catalog.ts
- auth/actions.ts
- Legend.tsx
- clef.ts
- domain/explain.ts
- ref_next
- (app)/actions.ts
- Layout
- motion.ts
- ref_react
- text.ts
- versions.ts
- SkipTally
- createThinkStripper

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 37 edges
2. `DiagramWorkspace()` - 37 edges
3. `getOwnedDiagram()` - 34 edges
4. `InfraSketch 설계 문서` - 34 edges
5. `ValidationError` - 26 edges
6. `Sidebar()` - 26 edges
7. `lockedTurn()` - 26 edges
8. `explainTarget()` - 24 edges
9. `Flow()` - 23 edges
10. `auth` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Task 7: 대화창 — 말풍선과 진행 카드` --references--> `messagesToLines()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/ui/chat/lines.ts
- `Task 1: 세션 저장` --references--> `listMessages()`  [INFERRED]
  docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md → src/server/chat/messages.ts
- `Task 2: 용어 사전 시드와 서버 함수` --references--> `NotFoundError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 4: 서버 설명 생성` --references--> `NotFoundError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts
- `Task 2: 서버 점검 — Clef 판정과 Qwen 문구` --references--> `Warning`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/domain/types.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (55 total, 3 thin omitted)

### Community 0 - "Sidebar.tsx"
Cohesion: 0.11
Nodes (35): createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction(), refreshAll(), renameDiagramAction(), renameProjectAction() (+27 more)

### Community 1 - "chat/warnings.ts"
Cohesion: 0.11
Nodes (33): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 3: 대화 차례에 점검 단계 넣기, Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, categoryOf() (+25 more)

### Community 2 - "segments.ts"
Cohesion: 0.23
Nodes (17): assignStarts(), buildSegmentBundles(), buildSegs(), InEdge, normalize(), Piece, piecesOf(), pk() (+9 more)

### Community 3 - "signup/page.tsx"
Cohesion: 0.20
Nodes (18): AuthField(), AuthSubmit(), Props, FieldErrors, Options, useAuthForm(), LoginForm(), LoginPage() (+10 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.14
Nodes (20): Block, BUILD_STEPS, CardView(), ChatPanel(), Check(), CHIP_KINDS, Dots(), ELSEWHERE_BUSY (+12 more)

### Community 5 - "prompt.ts"
Cohesion: 0.10
Nodes (23): Pattern, patternPromptBlock(), PATTERNS, ancestorsOf(), ANSWER_PROMPT, ASK_PROMPT, buildExplainMessages(), buildMessages() (+15 more)

### Community 6 - "설계 문서와 계획"
Cohesion: 0.06
Nodes (41): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전 (+33 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.05
Nodes (45): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 5: 주의 항목 바로 가기, Task 6: E2E — 3E 흐름 (+37 more)

### Community 8 - "layout.ts"
Cohesion: 0.10
Nodes (29): elbowRoute(), Pt, azChipWidth(), azOf(), BASE_OPTIONS, CONTENT_WIDTH, crossings(), elk (+21 more)

### Community 9 - "projects.ts"
Cohesion: 0.22
Nodes (17): Task 4: "의도된 구성" 저장, confirmAssumption(), emptyState(), confirmAssumptionFor(), BUSY_MESSAGE, withDiagramLock(), saveFieldsFor(), SaveFieldsInput (+9 more)

### Community 10 - "명령 적용과 샘플"
Cohesion: 0.05
Nodes (47): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus, Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저) (+39 more)

### Community 11 - "pipeline.ts"
Cohesion: 0.17
Nodes (17): parseCommand(), AI_UNAVAILABLE_MESSAGE, guardEmit(), HISTORY_FETCH, HISTORY_REPLY, KNOWN_OPS, LAYOUT_REPLY, lockedTurn() (+9 more)

### Community 12 - "exportImage.ts"
Cohesion: 0.12
Nodes (21): buildStage(), CHROME, decodeSvgDataUrl(), diagramBounds(), download(), EdgeLabel, edgeLabels(), EXPORT_PADDING (+13 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.12
Nodes (25): explanations, ExplanationTargetKind, codePoints(), dbRepo, DepsInput, Draft, draftOf(), EdgeDraft (+17 more)

### Community 14 - "display.ts"
Cohesion: 0.16
Nodes (16): drawnId(), buildDisplayGraph(), defaultDisplayOptions(), DisplayGroup, DisplayOptions, initialCollapsed(), isBus(), outermostCollapsedAncestor() (+8 more)

### Community 15 - "schema.ts"
Cohesion: 0.12
Nodes (18): validate(), db, accounts, chatSessions, diagrams, GlossarySource, MessageRole, messages (+10 more)

### Community 16 - "useCamera.ts"
Cohesion: 0.17
Nodes (14): CameraInput, FINAL_FIT_DURATION, fitViewport(), FOCUS_DURATION, FOCUS_MIN_ZOOM, FOCUS_SIDE_MIN, focusViewport(), idsKey() (+6 more)

### Community 17 - "projects.ts"
Cohesion: 0.18
Nodes (22): assertOwnedProject(), assertUniqueDiagramName(), assertUniqueProjectName(), assertUuid(), cleanName(), clip(), coord, copyName() (+14 more)

### Community 18 - "ClefClient"
Cohesion: 0.50
Nodes (4): ChatDeps, ExplainDeps, ClefClient, QwenClient

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.20
Nodes (11): CanvasOptions, hasId(), Mode, NO_SESSIONS, Pinned, unionState(), PANEL_DEFAULT, PANEL_MAX (+3 more)

### Community 21 - "reset.ts"
Cohesion: 0.16
Nodes (18): ResetPasswordPage(), ResetPasswordForm(), validate(), sendMail(), hashPassword(), isResetTokenUsable(), requestPasswordReset(), resetPassword() (+10 more)

### Community 22 - "Canvas.tsx"
Cohesion: 0.15
Nodes (21): Canvas(), DiffMarks, FAR_ZOOM, Icon(), IconArrange(), IconChevron(), IconEye(), IconFit() (+13 more)

### Community 23 - "연결선 그리기"
Cohesion: 0.16
Nodes (16): Task 2: 마우스 강조·흐리기, PanelEdge, DisplayEdge, ARROW, arrowD(), EdgeLayer(), EdgeLayerPortal(), EdgeLayerProps (+8 more)

### Community 24 - "Shell.tsx"
Cohesion: 0.18
Nodes (14): AppLayout(), Home(), lastActiveDiagram(), listProjects(), CreateButton(), CreateRequest, extentOf(), NARROW_QUERY (+6 more)

### Community 25 - "연결선 개발용 화면"
Cohesion: 0.19
Nodes (13): ALB, EdgePanels(), n(), Panel, PanelNode, PANELS, PanelView(), Pt (+5 more)

### Community 27 - "ask/route.ts"
Cohesion: 0.05
Nodes (51): Task 5: 설명 API, Qwen URL 정규화, BodySchema, dynamic, json(), POST(), runtime, BodySchema (+43 more)

### Community 28 - "Flow"
Cohesion: 0.20
Nodes (3): CanvasProps, Flow(), Insets

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.12
Nodes (15): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+7 more)

### Community 30 - "types.ts"
Cohesion: 0.06
Nodes (46): attrs, Command, COMMAND_OPS, commandSchema, edgeKind, groupKind, id, nodeKind (+38 more)

### Community 31 - "glossary.ts"
Cohesion: 0.18
Nodes (13): Task 2: 용어 사전 시드와 서버 함수, glossaryTerms, normalizeTerm(), pickTerm(), termCandidates(), GLOSSARY_SEED, GlossarySeedEntry, addAiTerm() (+5 more)

### Community 32 - "useExplanations.ts"
Cohesion: 0.21
Nodes (14): EdgeExplanation, NodeExplanation, DiagramState, Entry, ExplanationView, fresh(), Job, keyOf() (+6 more)

### Community 33 - "normalize.ts"
Cohesion: 0.31
Nodes (8): DROP_NULL, flattenAttr(), HAS_ATTRS, ID_FIELDS, isPlainObject(), NEEDS_PARENT, normalizeAiCommand(), normalizeId()

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.07
Nodes (36): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), Task 5: E2E — 노드 질문 흐름, 실행 순서, CategoryIcon() (+28 more)

### Community 35 - "FlyLayer.tsx"
Cohesion: 0.15
Nodes (13): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+5 more)

### Community 36 - "GlossaryPage.tsx"
Cohesion: 0.20
Nodes (16): ActionResult, listGlossaryAction(), listTermsAction(), setTermReviewedAction(), updateTermAction(), Glossary(), GlossaryItem, toGlossaryItem() (+8 more)

### Community 37 - "ExportMenu.tsx"
Cohesion: 0.13
Nodes (17): ExportBackground, ExportFormat, LIGHT_BACKGROUND, BACKGROUNDS, EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON, EXPORT_FAILED_MESSAGE (+9 more)

### Community 38 - "DiagramState"
Cohesion: 0.14
Nodes (9): ChatPanelProps, HistoryPanel(), HistoryPanelProps, SOURCE_LABEL, VersionRow, RightPanel(), RightPanelProps, Tab (+1 more)

### Community 39 - "ask.ts"
Cohesion: 0.25
Nodes (15): Task 2: 질문 차례(서버), AskArgs, askInSession(), HANDOFF_REPLY, hasNode(), lockedAsk(), runAskTurn(), ChatEvent (+7 more)

### Community 40 - "MentionInput"
Cohesion: 0.19
Nodes (7): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), Mention, MentionInput, MentionInputHandle, MentionInputProps, mentionToken()

### Community 41 - "catalog.ts"
Cohesion: 0.19
Nodes (10): GroupBox(), GroupBoxData, nodeTypes, DATA, EDGE_KINDS, GROUP_KINDS, GroupKind, GUARD (+2 more)

### Community 42 - "auth/actions.ts"
Cohesion: 0.20
Nodes (11): authConfig, handlers, signIn, FormState, loginAction(), resetPasswordAction(), signupAction(), text() (+3 more)

### Community 43 - "Legend.tsx"
Cohesion: 0.21
Nodes (10): Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), legendPlacement(), LegendPlacementInput (+2 more)

### Community 44 - "clef.ts"
Cohesion: 0.18
Nodes (12): isAssumptionChangeMessage(), resolveIntent(), ClefAnswer, ClefAnswers, EXPLAIN_SCORE_QUESTION, Intent, INTENT_MIN_CONFIDENCE, INTENT_QUESTION (+4 more)

### Community 45 - "domain/explain.ts"
Cohesion: 0.21
Nodes (11): Task 4: 서버 설명 생성, Task 7: 설명 큐와 연결, attrText(), endpointOf(), fnv1a(), LIMITS, overLimit(), signatureOf() (+3 more)

### Community 46 - "ref_next"
Cohesion: 0.18
Nodes (7): metadata, suit, { auth }, config, authDecision, isPublicPath(), PUBLIC

### Community 47 - "(app)/actions.ts"
Cohesion: 0.16
Nodes (28): clearPinnedAction(), confirmAssumptionAction(), getVersionAction(), importSampleAction(), listMessagesAction(), listVersionsAction(), logoutAction(), refreshDiagram() (+20 more)

### Community 48 - "Layout"
Cohesion: 0.24
Nodes (11): FlowProps, DisplayGraph, GROUP_PAD, Layout, circleHitsRect(), findOverlaps(), grow(), intersects() (+3 more)

### Community 49 - "motion.ts"
Cohesion: 0.26
Nodes (11): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+3 more)

### Community 50 - "ref_react"
Cohesion: 0.44
Nodes (4): isKeyboardFocus(), NameTooltip(), useNameTooltip(), NodeCard()

### Community 51 - "text.ts"
Cohesion: 0.39
Nodes (8): charWidth(), EXTRA_WIDE_LATIN, isUpper(), isWide(), ratio(), textWidth(), truncate(), WIDE

### Community 52 - "versions.ts"
Cohesion: 0.60
Nodes (4): diagramVersions, VersionSource, VersionStatus, CreateVersionOpts

### Community 56 - "createThinkStripper"
Cohesion: 0.52
Nodes (5): createJsonlParser(), isCompleteJson(), scanLine(), createThinkStripper(), partialTagLen()

## Knowledge Gaps
- **274 isolated node(s):** `DeleteDialog`, `Dialog`, `MenuAction`, `MenuItem`, `MenuTarget` (+269 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 321 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `useExplanations.ts` to `chat/warnings.ts`, `prompt.ts`, `MissingChecklist.tsx`, `projects.ts`, `명령 적용과 샘플`, `pipeline.ts`, `설명 생성과 품질 검사`, `display.ts`, `schema.ts`, `projects.ts`, `DiagramWorkspace.tsx`, `Canvas.tsx`, `Flow`, `types.ts`, `NodeInfo.tsx`, `DiagramState`, `ask.ts`, `domain/explain.ts`, `(app)/actions.ts`, `versions.ts`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `InfraSketch 설계 문서` connect `설계 문서와 계획` to `MentionInput`, `ask/route.ts`, `MissingChecklist.tsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `파일 구조` connect `3C-1 계획 작업 목록` to `ask/route.ts`, `domain/explain.ts`, `glossary.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `DeleteDialog`, `Dialog`, `MenuAction` to the rest of the system?**
  _274 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._
- **Should `chat/warnings.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10634920634920635 - nodes in this community are weakly interconnected._