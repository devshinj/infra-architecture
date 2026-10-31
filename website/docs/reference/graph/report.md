---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1017 nodes · 2548 edges · 48 communities (46 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 79 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c12bfa74`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- (app)/actions.ts
- 표시 그래프와 버전 비교
- 연결선 구간 묶음
- DB 스키마와 인증
- ChatPanel.tsx
- RightPanel.tsx
- 설계 문서와 계획
- MissingChecklist.tsx
- ELK 자동 배치와 꺾은선
- Sidebar.tsx
- 명령 적용과 샘플
- pipeline.ts
- prompt.ts
- 설명 생성과 품질 검사
- useChatTurn.ts
- 캔버스 이벤트
- auth.ts
- glossary.ts
- 경고 규칙과 점검
- 라우트 재수출
- catalog.ts
- useCamera.ts
- Canvas.tsx
- 연결선 그리기
- ref_react
- 연결선 개발용 화면
- 설명 모양·길이·서명
- chat/route.ts
- 흐름 애니메이션
- 3C-1 계획 작업 목록
- getOwnedDiagram
- 겹침 검사
- useExplanations.ts
- normalize.ts
- NodeInfo.tsx
- FlyLayer.tsx
- NodeMenu
- Explanation.tsx
- DiagramWorkspace.tsx
- projects.ts
- MentionInput
- NodeCard.tsx
- Legend.tsx
- middleware.ts
- explain/route.ts
- Review Focus
- text.ts
- [diagramId]/page.tsx

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 36 edges
2. `DiagramWorkspace()` - 35 edges
3. `InfraSketch 설계 문서` - 34 edges
4. `getOwnedDiagram()` - 27 edges
5. `lockedTurn()` - 24 edges
6. `explainTarget()` - 23 edges
7. `Flow()` - 22 edges
8. `Sidebar()` - 21 edges
9. `ValidationError` - 19 edges
10. `auth` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙` --references--> `applyCommand()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/domain/apply.ts
- `Task 2: 서버 점검 — Clef 판정과 Qwen 문구` --references--> `Warning`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/domain/types.ts
- `Task 3: 대화 차례에 점검 단계 넣기` --references--> `ChatEvent`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/server/chat/events.ts
- `Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄` --references--> `ChatLine`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/ui/chat/useChatTurn.ts
- `Task 2: 용어 사전 시드와 서버 함수` --references--> `ValidationError`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md → src/server/projects.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (48 total, 2 thin omitted)

### Community 0 - "(app)/actions.ts"
Cohesion: 0.19
Nodes (24): clearPinnedAction(), confirmAssumptionAction(), getVersionAction(), importSampleAction(), listMessagesAction(), listVersionsAction(), logoutAction(), refreshDiagram() (+16 more)

### Community 1 - "표시 그래프와 버전 비교"
Cohesion: 0.16
Nodes (18): FlowProps, buildDisplayGraph(), DisplayGraph, DisplayGroup, DisplayOptions, isBus(), outermostCollapsedAncestor(), elbowRoute() (+10 more)

### Community 2 - "연결선 구간 묶음"
Cohesion: 0.21
Nodes (18): 연결선 모양과 움직임, assignStarts(), buildSegmentBundles(), buildSegs(), InEdge, normalize(), Piece, piecesOf() (+10 more)

### Community 3 - "DB 스키마와 인증"
Cohesion: 0.13
Nodes (19): db, accounts, diagrams, diagramVersions, GlossarySource, MessageRole, messages, projects (+11 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.16
Nodes (18): Block, BUILD_STEPS, CardView(), ChatPanel(), Check(), CHIP_KINDS, Dots(), EXAMPLES (+10 more)

### Community 5 - "RightPanel.tsx"
Cohesion: 0.13
Nodes (9): ChatPanelProps, HistoryPanel(), HistoryPanelProps, SOURCE_LABEL, VersionRow, RightPanel(), RightPanelProps, Tab (+1 more)

### Community 6 - "설계 문서와 계획"
Cohesion: 0.08
Nodes (31): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전 (+23 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.06
Nodes (37): Task 5: 주의 항목 바로 가기, 가정 목록 (구조 결정), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage(), STRUCTURAL_KEYS, computeMissing(), FIELD_LABELS (+29 more)

### Community 8 - "ELK 자동 배치와 꺾은선"
Cohesion: 0.12
Nodes (22): azChipWidth(), azOf(), BASE_OPTIONS, CONTENT_WIDTH, elk, ElkRun, EMPTY_GROUP, LABEL_PX (+14 more)

### Community 9 - "Sidebar.tsx"
Cohesion: 0.18
Nodes (24): createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction(), refreshAll(), renameDiagramAction(), renameProjectAction() (+16 more)

### Community 10 - "명령 적용과 샘플"
Cohesion: 0.09
Nodes (30): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus, applyCommand(), applyCommands(), ApplyResult, endpointOk() (+22 more)

### Community 11 - "pipeline.ts"
Cohesion: 0.14
Nodes (14): AI_UNAVAILABLE_MESSAGE, HISTORY_REPLY, KNOWN_OPS, LAYOUT_REPLY, lockedTurn(), opName(), prunedOrder(), runChatTurn() (+6 more)

### Community 12 - "prompt.ts"
Cohesion: 0.05
Nodes (47): isAssumptionChangeMessage(), Pattern, patternPromptBlock(), PATTERNS, resolveIntent(), ancestorsOf(), ANSWER_PROMPT, buildExplainMessages() (+39 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.10
Nodes (28): Task 9: 가짜 AI·smoke·E2E, explanations, ExplanationTargetKind, codePoints(), dbRepo, DepsInput, Draft, draftOf() (+20 more)

### Community 14 - "useChatTurn.ts"
Cohesion: 0.07
Nodes (37): Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저), Task 11: 빈 구성도 시작 경험 — 인사말·가이드·예시 질문 (사용자 추가 요청, 2026-10-30), Task 12: 대화에서 캔버스로 날아가는 빛점 (사용자 추가 요청, 2026-10-30), Task 13: 도구 모음 정리와 스크롤 정리 (사용자 추가 요청, 2026-10-30), Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙 (+29 more)

### Community 15 - "캔버스 이벤트"
Cohesion: 0.17
Nodes (6): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, CanvasProps, drawnId(), Flow(), Insets, warningsByNode()

### Community 16 - "auth.ts"
Cohesion: 0.15
Nodes (15): userId(), AppLayout(), Home(), auth, handlers, verifyCredentials(), listProjects(), extentOf() (+7 more)

### Community 17 - "glossary.ts"
Cohesion: 0.13
Nodes (23): ActionResult, listGlossaryAction(), listTermsAction(), setTermReviewedAction(), updateTermAction(), Glossary(), glossaryTerms, GLOSSARY_SEED (+15 more)

### Community 18 - "경고 규칙과 점검"
Cohesion: 0.09
Nodes (38): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 3: 대화 차례에 점검 단계 넣기, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, categoryOf(), NodeKind (+30 more)

### Community 20 - "catalog.ts"
Cohesion: 0.11
Nodes (17): GroupBoxData, DATA, EDGE_KINDS, GROUP_KINDS, GroupKind, GUARD, NodeKindDef, SERVER (+9 more)

### Community 21 - "useCamera.ts"
Cohesion: 0.17
Nodes (14): CameraInput, FINAL_FIT_DURATION, fitViewport(), FOCUS_DURATION, FOCUS_MIN_ZOOM, FOCUS_SIDE_MIN, focusViewport(), idsKey() (+6 more)

### Community 22 - "Canvas.tsx"
Cohesion: 0.17
Nodes (20): Canvas(), CanvasOptions, DiffMarks, FAR_ZOOM, Icon(), IconArrange(), IconChevron(), IconEye() (+12 more)

### Community 23 - "연결선 그리기"
Cohesion: 0.16
Nodes (14): Task 2: 마우스 강조·흐리기, ARROW, arrowD(), EdgeLayer(), EdgeLayerPortal(), EdgeLayerProps, motionOf(), prefersReducedMotion() (+6 more)

### Community 24 - "ref_react"
Cohesion: 0.08
Nodes (31): Qwen URL 정규화, GET(), LoginPage(), ResetRequestPage(), ResetPasswordPage(), SignupPage(), metadata, suit (+23 more)

### Community 25 - "연결선 개발용 화면"
Cohesion: 0.21
Nodes (12): ALB, EdgePanels(), n(), Panel, PanelEdge, PANELS, PanelView(), Pt (+4 more)

### Community 26 - "설명 모양·길이·서명"
Cohesion: 0.23
Nodes (10): Task 4: 서버 설명 생성, attrText(), endpointOf(), fnv1a(), LIMITS, overLimit(), signatureOf(), TermCandidate (+2 more)

### Community 27 - "chat/route.ts"
Cohesion: 0.16
Nodes (12): Task 5: 설명 API, BodySchema, dynamic, encoder, line(), Outcome, POST(), runtime (+4 more)

### Community 28 - "흐름 애니메이션"
Cohesion: 0.26
Nodes (11): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+3 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.15
Nodes (12): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+4 more)

### Community 30 - "getOwnedDiagram"
Cohesion: 0.29
Nodes (13): Task 4: "의도된 구성" 저장, confirmAssumption(), emptyState(), confirmAssumptionFor(), BUSY_MESSAGE, withDiagramLock(), saveFieldsFor(), setWarningIgnoredFor() (+5 more)

### Community 31 - "겹침 검사"
Cohesion: 0.39
Nodes (7): GROUP_PAD, circleHitsRect(), findOverlaps(), grow(), intersects(), PAIR_BADGE_OFFSET, strictlyInside()

### Community 32 - "useExplanations.ts"
Cohesion: 0.18
Nodes (19): Task 2: 용어 사전 시드와 서버 함수, EdgeExplanation, NodeExplanation, normalizeTerm(), pickTerm(), termCandidates(), addAiTerm(), findTerm() (+11 more)

### Community 33 - "normalize.ts"
Cohesion: 0.38
Nodes (6): DROP_NULL, flattenAttr(), HAS_ATTRS, isPlainObject(), NEEDS_PARENT, normalizeAiCommand()

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.17
Nodes (15): CategoryIcon(), PATHS, isEmpty(), CautionProps, Cautions(), edgeKindName(), Fields(), kindName() (+7 more)

### Community 35 - "FlyLayer.tsx"
Cohesion: 0.15
Nodes (13): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+5 more)

### Community 37 - "Explanation.tsx"
Cohesion: 0.28
Nodes (12): ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), ExplanationProps, NodeBody(), Retry(), Rewrite() (+4 more)

### Community 38 - "DiagramWorkspace.tsx"
Cohesion: 0.19
Nodes (12): defaultDisplayOptions(), initialCollapsed(), hasId(), Mode, optionsFor(), Pinned, unionState(), PANEL_DEFAULT (+4 more)

### Community 39 - "projects.ts"
Cohesion: 0.23
Nodes (13): assertOwnedProject(), assertUuid(), cleanName(), coord, createDiagram(), createProject(), deleteDiagram(), deleteProject() (+5 more)

### Community 40 - "MentionInput"
Cohesion: 0.21
Nodes (7): 노드 참조 (@WAS#1 칩), parseMentions(), Mention, MentionInput, MentionInputHandle, MentionInputProps, mentionToken()

### Community 41 - "NodeCard.tsx"
Cohesion: 0.24
Nodes (9): PanelNode, GroupBox(), isKeyboardFocus(), NameTooltip(), useNameTooltip(), NodeCard(), NodeCardData, nodeTypes (+1 more)

### Community 42 - "Legend.tsx"
Cohesion: 0.21
Nodes (10): Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), legendPlacement(), LegendPlacementInput (+2 more)

### Community 43 - "middleware.ts"
Cohesion: 0.21
Nodes (8): authConfig, { auth }, config, authDecision, isPublicPath(), PUBLIC, next-auth, Session

### Community 44 - "explain/route.ts"
Cohesion: 0.24
Nodes (9): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+1 more)

### Community 45 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 6: E2E — 3E 흐름, 실행 순서

### Community 46 - "text.ts"
Cohesion: 0.39
Nodes (8): charWidth(), EXTRA_WIDE_LATIN, isUpper(), isWide(), ratio(), textWidth(), truncate(), WIDE

### Community 47 - "[diagramId]/page.tsx"
Cohesion: 0.60
Nodes (4): DiagramPage(), listMessages(), getDiagram(), SAMPLES

## Knowledge Gaps
- **221 isolated node(s):** `TextPatch`, `Pt`, `Pinned`, `ApplyResult`, `AddEdge` (+216 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 264 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `DB 스키마와 인증` to `(app)/actions.ts`, `표시 그래프와 버전 비교`, `useExplanations.ts`, `NodeInfo.tsx`, `RightPanel.tsx`, `DiagramWorkspace.tsx`, `MissingChecklist.tsx`, `projects.ts`, `명령 적용과 샘플`, `pipeline.ts`, `prompt.ts`, `설명 생성과 품질 검사`, `useChatTurn.ts`, `캔버스 이벤트`, `경고 규칙과 점검`, `Canvas.tsx`, `설명 모양·길이·서명`, `getOwnedDiagram`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `InfraSketch 설계 문서` connect `설계 문서와 계획` to `MentionInput`, `ref_react`, `연결선 구간 묶음`, `MissingChecklist.tsx`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `파일 구조` connect `3C-1 계획 작업 목록` to `useExplanations.ts`, `설명 모양·길이·서명`, `chat/route.ts`, `설명 생성과 품질 검사`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **What connects `TextPatch`, `Pt`, `Pinned` to the rest of the system?**
  _221 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DB 스키마와 인증` be split into smaller, more focused modules?**
  _Cohesion score 0.12903225806451613 - nodes in this community are weakly interconnected._
- **Should `RightPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1341991341991342 - nodes in this community are weakly interconnected._
- **Should `설계 문서와 계획` be split into smaller, more focused modules?**
  _Cohesion score 0.07948717948717948 - nodes in this community are weakly interconnected._