---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1167 nodes · 3046 edges · 52 communities (50 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 101 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7d2219f7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- (app)/actions.ts
- domain/warnings.ts
- segments.ts
- auth/actions.ts
- ChatPanel.tsx
- prompt.ts
- 설계 문서와 계획
- MissingChecklist.tsx
- layout.ts
- projects.ts
- 명령 적용과 샘플
- pipeline.ts
- deps.ts
- 설명 생성과 품질 검사
- display.ts
- types.ts
- useCamera.ts
- SessionPicker.tsx
- Task 2: 서버 점검 — Clef 판정과 Qwen 문구
- 라우트 재수출
- DiagramWorkspace.tsx
- Review Focus
- Canvas.tsx
- 연결선 그리기
- Shell.tsx
- 연결선 개발용 화면
- Review Focus
- ask/route.ts
- Flow
- 3C-1 계획 작업 목록
- useSessions.ts
- glossary.ts
- useExplanations.ts
- normalize.ts
- NodeInfo.tsx
- FlyLayer.tsx
- explain/route.ts
- Explanation.tsx
- DiagramState
- InfoCard.tsx
- MentionInput
- NodeCard.tsx
- chat/warnings.ts
- useSessions.ts
- domain/assumptions.ts
- domain/explain.ts
- [sessionId]/route.ts
- Review Focus
- qwen.ts
- missing.ts
- SkipTally
- createThinkStripper

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 37 edges
2. `DiagramWorkspace()` - 37 edges
3. `getOwnedDiagram()` - 34 edges
4. `InfraSketch 설계 문서` - 34 edges
5. `Sidebar()` - 26 edges
6. `lockedTurn()` - 26 edges
7. `ValidationError` - 24 edges
8. `explainTarget()` - 24 edges
9. `Flow()` - 23 edges
10. `auth` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙` --references--> `applyCommand()`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3d-ux.md → src/domain/apply.ts
- `Task 1: 세션 저장` --references--> `listMessages()`  [INFERRED]
  docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md → src/server/chat/messages.ts
- `Task 3: 대화 차례에 점검 단계 넣기` --references--> `ChatEvent`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/server/chat/events.ts
- `Task 2: 서버 점검 — Clef 판정과 Qwen 문구` --references--> `Warning`  [INFERRED]
  docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md → src/domain/types.ts
- `Task 2: 질문 차례(서버)` --references--> `MessageMeta`  [INFERRED]
  docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md → src/server/chat/events.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (52 total, 2 thin omitted)

### Community 0 - "(app)/actions.ts"
Cohesion: 0.05
Nodes (84): ActionResult, clearPinnedAction(), confirmAssumptionAction(), createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction() (+76 more)

### Community 1 - "domain/warnings.ts"
Cohesion: 0.21
Nodes (13): categoryOf(), Edge, WarningLevel, ancestorKinds(), DATA_KINDS, evaluateRules(), make(), PUBLIC_GROUPS (+5 more)

### Community 2 - "segments.ts"
Cohesion: 0.08
Nodes (39): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+31 more)

### Community 3 - "auth/actions.ts"
Cohesion: 0.06
Nodes (62): AuthField(), AuthSubmit(), Props, FieldErrors, Options, useAuthForm(), LoginForm(), validate() (+54 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.13
Nodes (18): Block, BUILD_STEPS, CardView(), ChatPanel(), ChatPanelProps, Check(), CHIP_KINDS, Dots() (+10 more)

### Community 5 - "prompt.ts"
Cohesion: 0.10
Nodes (23): Pattern, patternPromptBlock(), PATTERNS, ancestorsOf(), ANSWER_PROMPT, ASK_PROMPT, buildExplainMessages(), buildMessages() (+15 more)

### Community 6 - "설계 문서와 계획"
Cohesion: 0.05
Nodes (47): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전 (+39 more)

### Community 7 - "MissingChecklist.tsx"
Cohesion: 0.16
Nodes (14): MissingItem, Block, blocksOf(), ChecklistDraft, ChecklistDrafts, ChecklistExpanded, Chevron(), Draft (+6 more)

### Community 8 - "layout.ts"
Cohesion: 0.08
Nodes (42): azChipWidth(), azOf(), BASE_OPTIONS, CONTENT_WIDTH, crossings(), elk, ElkRun, EMPTY_GROUP (+34 more)

### Community 9 - "projects.ts"
Cohesion: 0.19
Nodes (22): Task 3: 대화 차례에 점검 단계 넣기, Task 4: "의도된 구성" 저장, emptyState(), confirmAssumptionFor(), BUSY_MESSAGE, withDiagramLock(), saveFieldsFor(), setWarningIgnoredFor() (+14 more)

### Community 10 - "명령 적용과 샘플"
Cohesion: 0.06
Nodes (40): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus, applyCommand(), applyCommands(), ApplyResult, endpointOk() (+32 more)

### Community 11 - "pipeline.ts"
Cohesion: 0.11
Nodes (35): Task 2: 질문 차례(서버), isAssumptionChangeMessage(), parseCommand(), AskArgs, askInSession(), HANDOFF_REPLY, hasNode(), lockedAsk() (+27 more)

### Community 12 - "deps.ts"
Cohesion: 0.19
Nodes (10): Qwen URL 정규화, GET(), env, envSchema, parseEnv(), llmConfig, normalizeQwenBaseUrl(), checkLlmHealth() (+2 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.11
Nodes (28): ExplanationTargetKind, cachedNodeExplanation(), codePoints(), complete(), dbRepo, DepsInput, Draft, draftOf() (+20 more)

### Community 14 - "display.ts"
Cohesion: 0.12
Nodes (24): drawnId(), FlowProps, buildDisplayGraph(), defaultDisplayOptions(), DisplayGraph, DisplayGroup, DisplayOptions, initialCollapsed() (+16 more)

### Community 15 - "types.ts"
Cohesion: 0.15
Nodes (17): accounts, diagrams, diagramVersions, explanations, GlossarySource, messages, passwordResetTokens, projects (+9 more)

### Community 16 - "useCamera.ts"
Cohesion: 0.16
Nodes (15): CameraInput, FINAL_FIT_DURATION, fitViewport(), FOCUS_DURATION, FOCUS_MIN_ZOOM, FOCUS_SIDE_MIN, focusViewport(), idsKey() (+7 more)

### Community 17 - "SessionPicker.tsx"
Cohesion: 0.33
Nodes (8): Chevron(), pad(), sessionName(), SessionPicker(), SessionPickerProps, when(), NEW_SESSION, SessionKey

### Community 18 - "Task 2: 서버 점검 — Clef 판정과 Qwen 문구"
Cohesion: 0.20
Nodes (8): Task 1: 경고 규칙과 구성 패턴(도메인), Task 2: 서버 점검 — Clef 판정과 Qwen 문구, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름, 파일 구조, ExplainDeps, ClefClient, QwenClient

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.16
Nodes (15): ELSEWHERE_BUSY, LlmHealth, ChatLine, SessionSummary, DiagramWorkspaceProps, hasId(), Mode, NO_SESSIONS (+7 more)

### Community 21 - "Review Focus"
Cohesion: 0.12
Nodes (16): Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저), Task 11: 빈 구성도 시작 경험 — 인사말·가이드·예시 질문 (사용자 추가 요청, 2026-10-30), Task 12: 대화에서 캔버스로 날아가는 빛점 (사용자 추가 요청, 2026-10-30), Task 13: 도구 모음 정리와 스크롤 정리 (사용자 추가 요청, 2026-10-30), Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙 (+8 more)

### Community 22 - "Canvas.tsx"
Cohesion: 0.14
Nodes (21): Canvas(), CanvasOptions, DiffMarks, FAR_ZOOM, Icon(), IconArrange(), IconChevron(), IconEye() (+13 more)

### Community 23 - "연결선 그리기"
Cohesion: 0.19
Nodes (13): Task 2: 마우스 강조·흐리기, ARROW, arrowD(), EdgeLayer(), EdgeLayerPortal(), EdgeLayerProps, motionOf(), prefersReducedMotion() (+5 more)

### Community 24 - "Shell.tsx"
Cohesion: 0.18
Nodes (14): AppLayout(), Home(), lastActiveDiagram(), listProjects(), CreateButton(), CreateRequest, extentOf(), NARROW_QUERY (+6 more)

### Community 25 - "연결선 개발용 화면"
Cohesion: 0.19
Nodes (13): ALB, EdgePanels(), n(), Panel, PanelEdge, PanelNode, PANELS, PanelView() (+5 more)

### Community 26 - "Review Focus"
Cohesion: 0.18
Nodes (9): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), Task 5: E2E — 노드 질문 흐름, 실행 순서, NodeMenu() (+1 more)

### Community 27 - "ask/route.ts"
Cohesion: 0.11
Nodes (23): Task 5: 설명 API, BodySchema, dynamic, json(), POST(), runtime, BodySchema, dynamic (+15 more)

### Community 28 - "Flow"
Cohesion: 0.19
Nodes (4): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, CanvasProps, Flow(), warningsByNode()

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.13
Nodes (14): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+6 more)

### Community 30 - "useSessions.ts"
Cohesion: 0.12
Nodes (19): Task 7: 대화창 — 말풍선과 진행 카드, MessageRole, keepsCard(), messagesToLines(), Row, summaryText(), timeOf(), TurnResult (+11 more)

### Community 31 - "glossary.ts"
Cohesion: 0.18
Nodes (13): Task 2: 용어 사전 시드와 서버 함수, glossaryTerms, normalizeTerm(), pickTerm(), termCandidates(), GLOSSARY_SEED, GlossarySeedEntry, addAiTerm() (+5 more)

### Community 32 - "useExplanations.ts"
Cohesion: 0.24
Nodes (13): EdgeExplanation, NodeExplanation, Entry, ExplanationView, fresh(), Job, keyOf(), omit() (+5 more)

### Community 33 - "normalize.ts"
Cohesion: 0.31
Nodes (8): DROP_NULL, flattenAttr(), HAS_ATTRS, ID_FIELDS, isPlainObject(), NEEDS_PARENT, normalizeAiCommand(), normalizeId()

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.14
Nodes (15): FIELD_LABELS, isEmpty(), AskNode(), AskNodeProps, CautionProps, Cautions(), edgeKindName(), Fields() (+7 more)

### Community 35 - "FlyLayer.tsx"
Cohesion: 0.15
Nodes (13): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+5 more)

### Community 36 - "explain/route.ts"
Cohesion: 0.27
Nodes (9): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime (+1 more)

### Community 37 - "Explanation.tsx"
Cohesion: 0.32
Nodes (11): ADR_LABELS, DefinitionPart(), EdgeBody(), Explanation(), NodeBody(), Retry(), Rewrite(), Section() (+3 more)

### Community 38 - "DiagramState"
Cohesion: 0.16
Nodes (11): DiagramState, ExplanationProps, HistoryPanel(), HistoryPanelProps, SOURCE_LABEL, VersionRow, NodeInfoProps, RightPanel() (+3 more)

### Community 39 - "InfoCard.tsx"
Cohesion: 0.19
Nodes (8): Task 5: 주의 항목 바로 가기, mergeWarnings(), CardMeasure, Chevron(), Count(), InfoCard(), InfoCardProps, LEVEL_LABEL

### Community 40 - "MentionInput"
Cohesion: 0.21
Nodes (6): Task 3: 세션 고르기와 질문 세션 화면, Mention, MentionInput, MentionInputHandle, MentionInputProps, mentionToken()

### Community 41 - "NodeCard.tsx"
Cohesion: 0.14
Nodes (17): GroupBox(), GroupBoxData, CategoryIcon(), PATHS, isKeyboardFocus(), NameTooltip(), useNameTooltip(), NodeCard() (+9 more)

### Community 42 - "chat/warnings.ts"
Cohesion: 0.47
Nodes (8): buildWarningMessages(), carryExposed(), checkWarnings(), describeTarget(), judgeExposed(), levelOf(), writeTexts(), noulProbability()

### Community 43 - "useSessions.ts"
Cohesion: 0.36
Nodes (7): Lines, Row, titleOf(), turnOnly(), Update, useSessions(), without()

### Community 44 - "domain/assumptions.ts"
Cohesion: 0.21
Nodes (11): 가정 목록 (구조 결정), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage(), confirmAssumption(), STRUCTURAL_KEYS, Assumption, AssumptionChips() (+3 more)

### Community 45 - "domain/explain.ts"
Cohesion: 0.23
Nodes (10): Task 4: 서버 설명 생성, attrText(), endpointOf(), fnv1a(), LIMITS, overLimit(), signatureOf(), TermCandidate (+2 more)

### Community 47 - "[sessionId]/route.ts"
Cohesion: 0.18
Nodes (13): dynamic, GET(), runtime, SessionIdSchema, DiagramPage(), auth, chatSessions, listMessages() (+5 more)

### Community 49 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 6: E2E — 3E 흐름, 실행 순서

### Community 51 - "qwen.ts"
Cohesion: 0.36
Nodes (6): abortError(), ChatMessage, createQwenClient(), attempt(), isRetryable(), RETRY_DELAYS

### Community 53 - "missing.ts"
Cohesion: 0.33
Nodes (9): 빠진 정보 채우기, 노드 종류 목록 (kind·group_kind·edge_kind), NODE_KINDS, computeMissing(), labelOf(), missingReminder(), requiredKeysFor(), requiredKeysForEdge() (+1 more)

### Community 56 - "createThinkStripper"
Cohesion: 0.83
Nodes (3): createJsonlParser(), isCompleteJson(), scanLine()

## Knowledge Gaps
- **254 isolated node(s):** `TextPatch`, `Draft`, `FieldKey`, `DeleteDialog`, `Dialog` (+249 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 299 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `DiagramState` to `(app)/actions.ts`, `domain/warnings.ts`, `prompt.ts`, `MissingChecklist.tsx`, `projects.ts`, `명령 적용과 샘플`, `pipeline.ts`, `설명 생성과 품질 검사`, `display.ts`, `types.ts`, `DiagramWorkspace.tsx`, `Canvas.tsx`, `Flow`, `useExplanations.ts`, `NodeInfo.tsx`, `InfoCard.tsx`, `chat/warnings.ts`, `domain/assumptions.ts`, `domain/explain.ts`, `missing.ts`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `InfraSketch 설계 문서` connect `설계 문서와 계획` to `deps.ts`, `domain/assumptions.ts`, `missing.ts`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `DiagramWorkspace()` connect `(app)/actions.ts` to `useExplanations.ts`, `segments.ts`, `FlyLayer.tsx`, `DiagramState`, `InfoCard.tsx`, `명령 적용과 샘플`, `useSessions.ts`, `domain/assumptions.ts`, `display.ts`, `[sessionId]/route.ts`, `DiagramWorkspace.tsx`, `Review Focus`, `Canvas.tsx`, `Review Focus`, `Flow`, `useSessions.ts`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `TextPatch`, `Draft`, `FieldKey` to the rest of the system?**
  _254 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `(app)/actions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053989488772097464 - nodes in this community are weakly interconnected._
- **Should `segments.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07878787878787878 - nodes in this community are weakly interconnected._