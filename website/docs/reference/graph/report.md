---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3078 nodes · 8532 edges · 146 communities (142 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 516 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb7267df`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Sidebar.tsx
- domain/flows.ts
- segments.ts
- (app)/actions.ts
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
- authoring.ts
- read.ts
- AuthStage.tsx
- index.ts
- Button.tsx
- PageSkeleton.tsx
- commands.ts
- Canvas.tsx
- 3C-1 계획 작업 목록
- FlyLayer.tsx
- McpKeysPage.tsx
- ResetPasswordForm.tsx
- EdgeLayer.tsx
- NodeInfo.tsx
- Flow
- glossary.ts
- runs.ts
- domain/warnings.ts
- 목표
- edgeLabels.ts
- Explanation.tsx
- 3. 망·보안 관점
- B) CCTV·영상 관제 — 구성 지식
- Shell.tsx
- GlossaryPage.tsx
- clarify.ts
- domain/network.ts
- Review Focus
- guides/types.ts
- layoutMetrics.ts
- mcp/apply.ts
- MissingChecklist.tsx
- explain/route.ts
- ValidationError
- pipeline.ts
- StatusScreen.tsx
- EdgePanels.tsx
- missing.ts
- sessions.ts
- turn.ts
- Legend.tsx
- domain/linkGuess.ts
- relay-onprem.ts
- auth/actions.ts
- domain/types.ts
- 구성도 배치 조화 1단계 — 선택 강조와 선 간격
- domain/assumptions.ts
- projects.ts
- 흐름 보기와 망 경계 표시 — 설계
- FlowPanel.tsx
- clef.ts
- useSessions.ts
- 파일 구조
- restingLabels.ts
- 02. 금융·의료·산업제어(OT)·통신/기반시설 분야 망 구분과 망 사이 연결 규칙
- Button
- 배치 가독성 3·4단계 — 처음 접기, 묶음 접기 단추, 엇갈림 줄이기
- password.ts
- 요청 범위 넘침 점검
- guides/judge.ts
- Review Focus
- 대화창 모양 정리 Implementation Plan
- A) BLE·IoT 기기 통신 — 구성 지식
- 학습 모드
- useChatTurn.ts
- delivery-cloud.ts
- MCP 그리기를 앱 대화와 맞추기 — 설계
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
- 연결선 경로와 가독성 — 줄기 펼치기·겹치지 않는 이름·선 간격
- domain/explain.ts
- 현장 기기 · 영상 관제 · 실시간 통신 · AI 결합 구성 지식 리서치 (2026-11-12)
- mcp/route.ts
- events.ts
- diff.ts
- qwen.ts
- reset.ts
- createJsonlParser
- ref_react
- patternPromptBlock
- InfoCard.tsx
- overlap.ts
- 정한 것
- messenger-cloud.ts
- flowSuggest.ts
- groupInfo.ts
- deps.ts
- NodeMenu
- glossaryMatch.ts
- samples.ts
- 대화창 모양 정리 (짧은 설계)
- head/route.ts
- [sessionId]/route.ts
- 운영 안전망 (묶음 B) 설계
- guides/apply.ts
- missing.ts
- userTurns.ts
- useDiagramView.ts
- applyCommand
- ZoneNameLayer.tsx
- 운영 배포
- Command
- Claude Code 연동(MCP 서버) — 설계
- EdgeLayerProps
- Review Focus
- parseCommand
- roving.ts
- Review Focus
- server/health.ts
- GuideEnv
- GuideDone.tsx
- patternPromptBlock
- GuideCard
- restoreVersionWithMessage
- 흐름 보기와 망 경계 표시 Implementation Plan

## God Nodes (most connected - your core abstractions)
1. `DiagramState` - 70 edges
2. `ValidationError` - 67 edges
3. `DiagramWorkspace()` - 62 edges
4. `getOwnedDiagram()` - 55 edges
5. `Button()` - 53 edges
6. `lockedTurn()` - 49 edges
7. `withDiagramLock()` - 47 edges
8. `Flow()` - 41 edges
9. `emptyState()` - 39 edges
10. `runResult()` - 37 edges

## Surprising Connections (you probably didn't know these)
- `Task 4: 진행 상태 저장(`guide_runs`)` --references--> `GuideEnv`  [INFERRED]
  docs/superpowers/plans/2026-11-19-learning-mode.md → src/domain/guides/types.ts
- `Task 2: 가이드 카드 연두 머리띠와 진행 점, 해설 칩 정리` --references--> `guideView`  [INFERRED]
  docs/superpowers/plans/2026-11-20-chat-look.md → src/domain/guides/view.ts
- `만드는 사람에게 맡기는 것` --references--> `Group`  [INFERRED]
  docs/superpowers/specs/2026-11-06-network-character-and-link-guess-design.md → src/domain/types.ts
- `제약` --references--> `neutralizeClone()`  [INFERRED]
  docs/superpowers/specs/2026-11-04-layout-harmony-stage1-design.md → src/canvas/exportImage.ts
- `대본이 넣은 것은 확정으로 저장한다 (설계자)` --references--> `buildSample()`  [INFERRED]
  docs/superpowers/specs/2026-11-19-learning-mode-design.md → src/domain/samples/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (146 total, 4 thin omitted)

### Community 0 - "Sidebar.tsx"
Cohesion: 0.12
Nodes (31): createDiagramAction(), createProjectAction(), deleteProjectAction(), duplicateDiagramAction(), refreshAll(), renameDiagramAction(), renameProjectAction(), ShellValue (+23 more)

### Community 1 - "domain/flows.ts"
Cohesion: 0.15
Nodes (25): Review Focus, Task 2: 망 경계 판정·경고·채워야 할 정보, Task 3: 흐름 도메인(모양·검사·끊김), Task 7: 캔버스 흐름 강조·단계 글자·경계 표시, Task 8: "흐름" 탭·지나는 흐름·연동, Task 9: E2E·화면 확인·문서, tooClose(), BOUNDARY_NODE_KINDS (+17 more)

### Community 2 - "segments.ts"
Cohesion: 0.14
Nodes (25): bundleSpeed(), CAPSULE, COMET_LAYERS, dashAlong(), def(), hostOf(), make(), MotionKind (+17 more)

### Community 3 - "(app)/actions.ts"
Cohesion: 0.06
Nodes (73): Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인, Task 9: 망 지식 화면, Task 8: 키 화면, ActionResult, addNetworkTypeAction(), bad(), clearPinnedAction(), confirmAssumptionAction() (+65 more)

### Community 4 - "ChatPanel.tsx"
Cohesion: 0.07
Nodes (32): Task 3: 세션 고르기와 질문 세션 화면, 노드 참조 (@WAS#1 칩), 정한 것, Block, BUILD_STEPS, CardView(), ChatPanel(), Check() (+24 more)

### Community 5 - "chat/warnings.ts"
Cohesion: 0.14
Nodes (24): Task 2: 서버 점검 — Clef 판정과 Qwen 문구, buildWarningMessages(), carryExposed(), checkCodeWarnings(), checkWarnings(), describeTarget(), FIXED_RULE_SET, flaggedPublic() (+16 more)

### Community 6 - "InfraSketch 설계 문서"
Cohesion: 0.07
Nodes (37): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전 (+29 more)

### Community 7 - "ask/route.ts"
Cohesion: 0.10
Nodes (24): Task 5: 설명 API, BodySchema, dynamic, json(), maxDuration, POST(), runtime, BodySchema (+16 more)

### Community 8 - "layout.ts"
Cohesion: 0.08
Nodes (37): Task 6: 영역 이름 크기 보정과 접힌 상자 폭, Task 5: 모든 선 16px 간격과 교차, 왜 하는가, azChipWidth(), azOf(), BASE_OPTIONS, cloneRun(), COLLAPSED_MAX_WIDTH (+29 more)

### Community 9 - "prompt.ts"
Cohesion: 0.09
Nodes (31): ancestorsOf(), ANSWER_PROMPT, ASK_PROMPT, buildExplainMessages(), buildFlowSuggestMessages(), byStr(), commandLine(), CONTINUE_NOTE (+23 more)

### Community 10 - "Review Focus"
Cohesion: 0.12
Nodes (16): Global Constraints, InfraSketch 3D단계: 화면·사용성 개선 구현 계획, Review Focus, Task 10: 재정렬(버튼+대화)과 영역이 노드 감싸기 (사용자 추가 요청, 2026-10-30 — Task 9 보다 먼저), Task 11: 빈 구성도 시작 경험 — 인사말·가이드·예시 질문 (사용자 추가 요청, 2026-10-30), Task 12: 대화에서 캔버스로 날아가는 빛점 (사용자 추가 요청, 2026-10-30), Task 13: 도구 모음 정리와 스크롤 정리 (사용자 추가 요청, 2026-10-30), Task 1: 영역 삭제 명령·빈 영역 정리·구조 가정 규칙 (+8 more)

### Community 11 - "auth.ts"
Cohesion: 0.12
Nodes (15): authConfig, handlers, LoginRateLimited, { auth }, config, authDecision, isPublicPath(), PUBLIC (+7 more)

### Community 12 - "exportImage.ts"
Cohesion: 0.11
Nodes (25): Task 5: 같은 연결 이름 합치기, Task 4: 화면과 내보내기가 같은 이름 자리를 쓴다, 제약, buildStage(), CHROME, decodeSvgDataUrl(), diagramBounds(), download() (+17 more)

### Community 13 - "설명 생성과 품질 검사"
Cohesion: 0.08
Nodes (36): Task 9: 가짜 AI·smoke·E2E, ExplanationTargetKind, LIMITS, TermCandidate, AuthoredExplains, codePoints(), dbRepo, DepsInput (+28 more)

### Community 14 - "getOwnedDiagram"
Cohesion: 0.17
Nodes (34): Task 4: "의도된 구성" 저장, Task 7: 서버 액션 — 망 종류 확인·바꾸기, 망연계 맞아요·아니에요, Task 8: 학습 중 가이드 밖 변경 막기, confirmAssumption(), noLinkKey(), mergeFlowSteps(), emptyState(), confirmAssumptionFor() (+26 more)

### Community 15 - "RightPanel.tsx"
Cohesion: 0.13
Nodes (13): ChatPanelProps, HistoryPanel(), HistoryPanelProps, relativeTime(), SOURCE_LABEL, undoneVersions(), VersionRow, Tab (+5 more)

### Community 16 - "useCamera.ts"
Cohesion: 0.09
Nodes (30): LaidOutGroup, LaidOutNode, Rect, OffscreenHint, offscreenHints(), OffscreenTarget, PEEK_PX, unite() (+22 more)

### Community 17 - "6. 출처 목록"
Cohesion: 0.08
Nodes (23): 1. 전형적인 구성 4가지, 2. 구성요소 사전, 3.1 어디에 두고 무엇으로 잇나, 3.2 외부 API 구성과 자체 서빙 구성의 차이, 3.3 국내 규정·가이드 (확인 수준을 함께 적음), 3.4 흔한 실수, 3. 망·보안 관점, 4. 구성도를 그리는 AI 에게 줄 지침 후보 (+15 more)

### Community 18 - "networkRules.ts"
Cohesion: 0.14
Nodes (21): Task 3: 판정 — 통신 길, 연결 방식 예상 경고, 빠진 정보, canvasAriaLabels(), DIRECTION, zoneDescription(), DIGIT, eulReul(), eunNeun(), euro() (+13 more)

### Community 20 - "DiagramWorkspace.tsx"
Cohesion: 0.08
Nodes (30): CanvasOptions, DiffMarks, TurnMarks, name, DiagramWorkspace(), DIFF_KINDS, diffItems(), DiffKind (+22 more)

### Community 21 - "authoring.ts"
Cohesion: 0.09
Nodes (31): Adr, countConflicts(), Def, edgeText(), FEWER, G(), groupText(), HEADS (+23 more)

### Community 22 - "read.ts"
Cohesion: 0.12
Nodes (28): NetworkKnowledge, DRAW_RULES, NOT_ARRAY_MESSAGE, buildGuide(), createDiagramForMcp(), createProjectForMcp(), listDiagramsForMcp(), listProjectsForMcp() (+20 more)

### Community 23 - "AuthStage.tsx"
Cohesion: 0.12
Nodes (15): Action, Box, BUILD, BUILT, Chat, EMPTY, flag(), FlowKey (+7 more)

### Community 24 - "index.ts"
Cohesion: 0.10
Nodes (39): Task 3: 대형 쇼핑몰 대본 두 벌 (초안 → 사용자 검토), 구조, 대본 (`src/domain/guides/`), 대본이 넣은 것은 확정으로 저장한다 (설계자), 망 지식 (설계자), 진행 상태 (새 표 `guide_runs`), 화면 (`src/ui/guide/`), redis() (+31 more)

### Community 25 - "Button.tsx"
Cohesion: 0.11
Nodes (24): ButtonSize, ButtonVariant, Look, Props, Action, byRecent(), Chevron(), MAIN_LABEL (+16 more)

### Community 26 - "PageSkeleton.tsx"
Cohesion: 0.20
Nodes (13): Loading(), Loading(), Loading(), Loading(), CELL_WIDTHS, PageSkeleton(), PageSkeletonProps, ChatSkeleton() (+5 more)

### Community 27 - "commands.ts"
Cohesion: 0.08
Nodes (23): attrs, COMMAND_OPS, commandSchema, direction, edgeKind, edgeLabel, FLOW_OPS, flowName (+15 more)

### Community 28 - "Canvas.tsx"
Cohesion: 0.12
Nodes (24): Canvas(), drawnId(), FAR_ZOOM, Icon(), IconArrange(), IconArrow(), IconChevron(), IconEye() (+16 more)

### Community 29 - "3C-1 계획 작업 목록"
Cohesion: 0.15
Nodes (12): 3C-2 로 넘기는 것, Global Constraints, InfraSketch 3C-1단계: 설명·용어 사전 구현 계획, Review Focus, Task 10: 영역 구분 — 명도 3단 층 (사용자 추가 요청, 2026-10-30 — Task 1 보다 먼저 실행), Task 11: 대화 패널 너비 조절 (사용자 추가 요청, 2026-10-30 — Task 10 다음, Task 1 보다 먼저), Task 1: DB 테이블과 마이그레이션, Task 3: 설명 도메인 — 모양·길이·서명 (+4 more)

### Community 30 - "FlyLayer.tsx"
Cohesion: 0.09
Nodes (21): prefersReducedMotion(), FADE_MS, FLY_MS, FLY_ORIGIN_ATTR, FlyLayer, FlyLayerHandle, FlyOptions, flyOrigin() (+13 more)

### Community 31 - "McpKeysPage.tsx"
Cohesion: 0.30
Nodes (9): McpKeyRow, McpConnection(), listMcpKeys(), claudeCommand(), day(), endpointOf(), Fresh, jsonConfig() (+1 more)

### Community 32 - "ResetPasswordForm.tsx"
Cohesion: 0.20
Nodes (19): AuthField(), AuthSubmit(), FormAlert(), Props, AuthStage(), FieldErrors, Options, useAuthForm() (+11 more)

### Community 33 - "EdgeLayer.tsx"
Cohesion: 0.08
Nodes (39): Review Focus, Task 1: 사용자포털 기준 구성도와 지금 값 기록, Task 6: 줄기 펼치기 상태 모듈, Task 7: EdgeLayer — 공유 조각 누르기, 펼침 겹선·꼬리표, 토큰, 내보내기, Task 9: e2e와 전후 보고, at(), LABEL_OFFSET, PlacedLabel (+31 more)

### Community 34 - "NodeInfo.tsx"
Cohesion: 0.09
Nodes (31): Flow, isEmpty(), Arrow(), ARROW_CHAR, ARROW_D, ArrowDir, ArrowMark(), ArrowPair() (+23 more)

### Community 35 - "Flow"
Cohesion: 0.13
Nodes (15): Task 5: 화면 — 경고 배지, 설명 패널 "주의할 점", 대화 줄, Task 3: 강조 토큰과 노드·영역 흐림, Task 8: 펼침 상태 연결 — 선택과 배타, 풀기, 설명 탭 목록, CanvasProps, Flow(), ZoomVar(), displayEdgeFor(), EdgeLayerPortal() (+7 more)

### Community 36 - "glossary.ts"
Cohesion: 0.15
Nodes (18): GLOSSARY_SEED_BATCH3, GLOSSARY_SEED_BATCH4, GLOSSARY_SEED_EXTRA, GLOSSARY_SEED_CORE, GlossarySeedEntry, TERMS, TERMS, GLOSSARY_SEED_GUIDE2 (+10 more)

### Community 37 - "runs.ts"
Cohesion: 0.17
Nodes (21): Task 9: 화면, quitGuideAction(), startGuideAction(), Learn(), getGuide(), guideEnvs(), learnBadge(), Progress (+13 more)

### Community 38 - "domain/warnings.ts"
Cohesion: 0.15
Nodes (22): categoryOf(), isManaged(), WarningLevel, ancestorKinds(), azOf(), baseLabel(), CLOUD_GROUPS, DATA_KINDS (+14 more)

### Community 39 - "목표"
Cohesion: 0.11
Nodes (17): 1-1. 망 종류, 1-2. 연결 규칙, 1-3. 망 지식 화면, 1. 망 지식 (지식베이스), 2. 망 영역에 종류 붙이기, 3. 고려가 시작되는 시점, 4. 연결 방식 예상 (안내), 5. AI가 망연계를 넣어 그리기 (+9 more)

### Community 40 - "edgeLabels.ts"
Cohesion: 0.08
Nodes (41): Global Constraints, 연결선 경로와 가독성 Implementation Plan, 겹치지 않는 이름, 동작 상세, 선 간격과 엇갈림, 줄기 펼치기, alongCandidates(), AlongItem (+33 more)

### Community 41 - "Explanation.tsx"
Cohesion: 0.12
Nodes (31): 설명 탭 글 (설계자), EdgeExplanation, GroupExplanation, NodeExplanation, ADR_LABELS, DEFAULT_LINES, DefinitionPart(), detailParts() (+23 more)

### Community 42 - "3. 망·보안 관점"
Cohesion: 0.10
Nodes (19): 1. 전형적인 구성, 2. 구성요소 사전, 3. 망·보안 관점, 4. 구성도를 그리는 AI 에게 줄 지침 후보, 5. 확인하지 못한 것·출처가 갈리는 것, 6. 출처 목록, C) WebRTC 실시간 영상·음성 통신 — 구성 지식, 구성 1 — 1:1 통화 (P2P, 가장 작은 것) (+11 more)

### Community 43 - "B) CCTV·영상 관제 — 구성 지식"
Cohesion: 0.11
Nodes (18): 1. 전형적인 구성, 2. 구성요소 사전, 3.1 망 배치, 3.2 암호화·인증, 3.3 국내 규정 (직접 열어 확인한 것), 3.4 망분리 완화(N²SF)와의 관계, 3.5 흔한 실수, 3. 망·보안 관점 (+10 more)

### Community 44 - "Shell.tsx"
Cohesion: 0.12
Nodes (22): AppLayout(), Home(), learnBadges(), lastActiveDiagram(), listProjects(), LinkPending(), COMPACT_QUERY, CreateButton() (+14 more)

### Community 45 - "GlossaryPage.tsx"
Cohesion: 0.19
Nodes (17): listGlossaryAction(), listTermsAction(), setTermReviewedAction(), updateTermAction(), Glossary(), GlossaryItem, toGlossaryItem(), ensureSeeded() (+9 more)

### Community 46 - "clarify.ts"
Cohesion: 0.08
Nodes (36): Task 5: 그리기 전에 물을 것·첫 그리기 흐름·가정 key 안내, choicesNote(), choicesOf(), choicesSummary(), choiceValue(), CLARIFY_AUTO, CLARIFY_AUTO_VALUE, CLARIFY_KEYS (+28 more)

### Community 47 - "domain/network.ts"
Cohesion: 0.11
Nodes (30): GRADE_LABELS, GRADE_RULES, gradeMethod(), LinkMethod, METHOD_LABELS, NetGrade, NetRule, NetType (+22 more)

### Community 48 - "Review Focus"
Cohesion: 0.20
Nodes (9): Global Constraints, InfraSketch 3E단계 — 연결선·글자·주의 바로 가기 Implementation Plan, Review Focus, Task 1: 글자 크기와 대비, Task 3: 잘린 이름 말풍선, Task 4: 연결 범례, Task 5: 주의 항목 바로 가기, Task 6: E2E — 3E 흐름 (+1 more)

### Community 49 - "guides/types.ts"
Cohesion: 0.15
Nodes (14): CCTV, CCTV_ONPREM, DELIVERY_CLOUD, DELIVERY, GUIDE_LIST, MESSENGER_CLOUD, MESSENGER, RELAY_ONPREM (+6 more)

### Community 50 - "layoutMetrics.ts"
Cohesion: 0.11
Nodes (39): Task 2: 평소 화면 이름 배치 함수와 측정값, countCrossings(), END_TRIM, inside(), isHorizontal(), isVertical(), NAME_PX, PathSeg (+31 more)

### Community 51 - "mcp/apply.ts"
Cohesion: 0.07
Nodes (44): Review Focus, Task 10: E2E 와 문서, Task 1: 망 지식 도메인 — 타입, 기본 제공 목록, 필요한 방식 계산, Task 2: 구성도 상태 — 망 종류 칸, `set_zone_type`, 망연계 추정 표시 명령, Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검, Task 8: 구성도 화면 — 지식 전달, 안내 카드, 빠진 정보 줄, 망연계 노드 표시, File Structure, Task 10: E2E와 문서 (+36 more)

### Community 52 - "MissingChecklist.tsx"
Cohesion: 0.12
Nodes (19): CategoryIcon(), PATHS, Category, MissingItem, Block, blocksOf(), ChecklistDraft, ChecklistDrafts (+11 more)

### Community 53 - "explain/route.ts"
Cohesion: 0.28
Nodes (8): BodySchema, Ctx, dynamic, failure(), GET(), maxDuration, POST(), runtime

### Community 54 - "ValidationError"
Cohesion: 0.10
Nodes (35): Task 5: DB와 서버 — 망 지식 테이블, 기본 제공 채우기, 읽기·고치기, Ctx, dynamic, GET(), runtime, countNetworkTypeUsageAction(), NetworkKnowledge(), mcpKeys (+27 more)

### Community 55 - "pipeline.ts"
Cohesion: 0.15
Nodes (26): Task 2: 질문 차례(서버), 한 차례의 흐름 (`src/server/guide/`), POST(), glossaryBlock(), AskArgs, askInSession(), HANDOFF_REPLY, hasNode() (+18 more)

### Community 56 - "StatusScreen.tsx"
Cohesion: 0.14
Nodes (15): AppError(), DiagramNotFound(), RootError(), GlobalError(), metadata, suit, viewport, NotFound() (+7 more)

### Community 57 - "EdgePanels.tsx"
Cohesion: 0.12
Nodes (21): ALB, EdgePanels(), n(), Panel, PanelNode, PANELS, PanelView(), Pt (+13 more)

### Community 58 - "missing.ts"
Cohesion: 0.20
Nodes (10): MANAGED_NAMES, MANAGED_RE, managedBasis(), MULTI_AZ_KINDS, namedManaged(), NO, SERVER_ONLY_ATTRS, YES (+2 more)

### Community 59 - "sessions.ts"
Cohesion: 0.13
Nodes (21): dynamic, GET(), json(), runtime, ChatSessionKind, chatSessions, sessionPayload(), asRow() (+13 more)

### Community 60 - "turn.ts"
Cohesion: 0.24
Nodes (23): Task 6: 가이드 차례와 대화 경로 연결, findConflict(), warningDelta(), doneEvent, createMessage(), saveAuthoredExplanations(), saveGuideFlows(), askClef() (+15 more)

### Community 61 - "Legend.tsx"
Cohesion: 0.19
Nodes (12): MediumMark(), Chevron(), EdgeSample(), Legend(), LEGEND_LINE_HEIGHT, LegendFit, LegendIcon(), LegendList() (+4 more)

### Community 62 - "domain/linkGuess.ts"
Cohesion: 0.23
Nodes (18): Task 4: 되돌리기 도메인 — 대신한 연결 기록, 되돌리기, 흐름 단계 나누기·합치기, Task 4: 차례 끝 정리 공용화와 코드 경고 점검, isEmptyGroup(), pruneEmptyGroups(), FlowStep, has(), incident(), recordReplaced() (+10 more)

### Community 63 - "relay-onprem.ts"
Cohesion: 0.15
Nodes (12): CENTER_RELAY_DEF, EV(), HUB_DEF, LINK_DEF, LOCAL_RELAY_DEF, TWO_WAY, VIDEO, videoEdge() (+4 more)

### Community 64 - "auth/actions.ts"
Cohesion: 0.16
Nodes (23): validate(), signIn, FormState, loginAction(), requestResetAction(), resetPasswordAction(), signupAction(), text() (+15 more)

### Community 65 - "domain/types.ts"
Cohesion: 0.10
Nodes (33): Task 1: 망 영역·망연계 노드·연결 전달물/방향, PanelEdge, DisplayEdge, DisplayGroup, ExportRequest, GLYPH, MarkedMedium, MEDIUM_LABELS (+25 more)

### Community 66 - "구성도 배치 조화 1단계 — 선택 강조와 선 간격"
Cohesion: 0.12
Nodes (16): 1. 강조 방식: "굵게 + 은은한 빛, 선 종류 색 유지", 2. 함께 지나는 구간: "한 줄기로 묶기", 3. 반복되는 연결 이름: "같은 이름은 한 번만, 개수와 함께", 4. 평행선 간격, 5. 영역 이름 크기: "확대에 맞춰 보정", 6. 접힌 영역 상자: "상자 폭을 이름에 맞춤", 구성도 배치 조화 1단계 — 선택 강조와 선 간격, 내가 정한 것 (사용자 확인 필요) (+8 more)

### Community 67 - "domain/assumptions.ts"
Cohesion: 0.21
Nodes (11): 가정 목록 (구조 결정), ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage(), parseNoLinkKey(), STRUCTURAL_KEYS, Assumption, AssumptionChips() (+3 more)

### Community 68 - "projects.ts"
Cohesion: 0.06
Nodes (69): Task 7: 시작·그만두기·되돌리기 맞추기, db, holder, Tx, accounts, authAttempts, diagrams, diagramVersions (+61 more)

### Community 69 - "흐름 보기와 망 경계 표시 — 설계"
Cohesion: 0.14
Nodes (13): A. 흐름, B. 망 경계, 만드는 사람에게 맡기는 것, 목표, 사용자가 정한 것(설계 검토 뒤), 실패로 보는 것, 왜 하는가, 이미 있는 것 (+5 more)

### Community 70 - "FlowPanel.tsx"
Cohesion: 0.16
Nodes (9): FlowOrigin, RowMenuItem, Action, FlowPanel(), FlowPanelProps, GROUPS, menuRootId(), stepMark() (+1 more)

### Community 71 - "clef.ts"
Cohesion: 0.18
Nodes (12): isAssumptionChangeMessage(), resolveIntent(), ClefAnswer, ClefAnswers, EXPLAIN_SCORE_QUESTION, Intent, INTENT_MIN_CONFIDENCE, INTENT_QUESTION (+4 more)

### Community 72 - "useSessions.ts"
Cohesion: 0.09
Nodes (22): SessionEventPayload, SessionPickerProps, ChatLine, errorOf(), Lines, mergeSessions(), MoreState, NEW_CHAT_TITLE (+14 more)

### Community 73 - "파일 구조"
Cohesion: 0.20
Nodes (9): 3C 로 넘기는 것, Global Constraints, InfraSketch 3B단계: 경고·구성 패턴 구현 계획, Review Focus, Task 1: 경고 규칙과 구성 패턴(도메인), Task 3: 대화 차례에 점검 단계 넣기, Task 6: smoke 와 가짜 AI 서버, Task 7: E2E — 경고 흐름 (+1 more)

### Community 74 - "restingLabels.ts"
Cohesion: 0.13
Nodes (26): Task 3: 배치에서 이름 자리 확보, Box, clusterByEnd(), NODE_RING, Layout, MeasuredView, asRect(), centerOf() (+18 more)

### Community 75 - "02. 금융·의료·산업제어(OT)·통신/기반시설 분야 망 구분과 망 사이 연결 규칙"
Cohesion: 0.15
Nodes (13): 02. 금융·의료·산업제어(OT)·통신/기반시설 분야 망 구분과 망 사이 연결 규칙, 1. 요약, 2. 망 종류 제안 표, 3. 망 짝 규칙 제안 표 (등급 기본값과 다른 경우만), 4.1 금융권, 4.2 의료, 4.3 산업 제어 (OT/ICS), 4.4 통신·데이터센터·일반 기반시설 (+5 more)

### Community 76 - "Button"
Cohesion: 0.14
Nodes (21): NetworkRuleRow, Button(), EMPTY_TYPE, gradeLabel(), GRADES, Message, METHODS, NetworkKnowledgePage() (+13 more)

### Community 77 - "배치 가독성 3·4단계 — 처음 접기, 묶음 접기 단추, 엇갈림 줄이기"
Cohesion: 0.11
Nodes (20): 1. 처음 접기: 깊은 영역부터, 보이는 상자 40개 이하, 2. 이중화 묶음 접기 단추, 3. 배치 엔진 탐색 강화, 남은 과제 (이번에 하지 않음), 목표, 받아들이는 변화 (승인 필요), 배치 가독성 3·4단계 — 처음 접기, 묶음 접기 단추, 엇갈림 줄이기, 배치 엔진 설정 (+12 more)

### Community 78 - "password.ts"
Cohesion: 0.17
Nodes (17): 항목, users, attemptLogin(), LoginResult, VerifiedUser, verifyCredentials(), attemptKey, Claim (+9 more)

### Community 79 - "요청 범위 넘침 점검"
Cohesion: 0.25
Nodes (7): 넘침 (사용자), 만드는 법 (사용자), 왜, 요청 범위 넘침 점검, 정한 것, 제 판단, 하지 않는 것

### Community 80 - "guides/judge.ts"
Cohesion: 0.15
Nodes (16): Task 10: 판정 평가 스크립트, decideStep(), ENV_KEYWORDS, keywordMatch(), looksLikeQuestion(), normalizeUtterance(), QUESTION_WORDS, readEnv() (+8 more)

### Community 81 - "Review Focus"
Cohesion: 0.25
Nodes (7): Global Constraints, InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan, Review Focus, Task 1: 세션 저장, Task 4: 질문 시작하기(설명 패널·우클릭 메뉴), Task 5: E2E — 노드 질문 흐름, 실행 순서

### Community 82 - "대화창 모양 정리 Implementation Plan"
Cohesion: 0.33
Nodes (5): Global Constraints, Review Focus, Task 1: 내 말풍선과 AI 답 세로선, Task 2: 가이드 카드 연두 머리띠와 진행 점, 해설 칩 정리, 대화창 모양 정리 Implementation Plan

### Community 83 - "A) BLE·IoT 기기 통신 — 구성 지식"
Cohesion: 0.17
Nodes (11): 1. 전형적인 구성, 2. 구성요소 사전, 3. 망·보안 관점, 4. 구성도를 그리는 AI 에게 줄 지침 후보, 5. 확인하지 못한 것·출처가 갈리는 것, 6. 출처 목록, A) BLE·IoT 기기 통신 — 구성 지식, 구성 1 — 앱 ↔ 기기 BLE 직결 (가장 작은 구성: 웨어러블, 혈압계, 도어락 설정) (+3 more)

### Community 84 - "학습 모드"
Cohesion: 0.12
Nodes (16): 검증, 그만두기·이어서 하기·되돌리기, 끝, 단계, 들어가기, 만드는 사람에게 남기는 것, 목표, 방법 (사용자 선택: 1) (+8 more)

### Community 85 - "useChatTurn.ts"
Cohesion: 0.11
Nodes (23): Task 7: 대화창 — 말풍선과 진행 카드, MessageRole, fixLegacyJosa(), changedOf(), keepsCard(), legacySummaryText(), messagesToLines(), NOT_APPLIED_MESSAGE (+15 more)

### Community 86 - "delivery-cloud.ts"
Cohesion: 0.10
Nodes (23): E(), forward(), ALB_RULES, ASG_DEF, back(), flowOf(), FlowStepCmd, FlowStepRow (+15 more)

### Community 87 - "MCP 그리기를 앱 대화와 맞추기 — 설계"
Cohesion: 0.40
Nodes (4): MCP 그리기를 앱 대화와 맞추기 — 설계, 배경, 범위 밖, 사용자가 정한 것 (바꾸지 않는다)

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

### Community 99 - "연결선 경로와 가독성 — 줄기 펼치기·겹치지 않는 이름·선 간격"
Cohesion: 0.17
Nodes (11): 1. 줄기를 누르면: "가지 전체를 펼쳐 보인다"(C), 2. 이름은 늘, 겹치지 않게, 3. 엇갈림과 간격도 이번에, 내가 정한 것 (사용자 확인 필요), 만드는 사람에게 맡기는 것, 목표, 사용자가 정한 것, 실패로 보는 것 (+3 more)

### Community 100 - "domain/explain.ts"
Cohesion: 0.11
Nodes (37): Task 2: 용어 사전 시드와 서버 함수, Task 4: 서버 설명 생성, Task 5: 대본 설명 저장과 설명 다시 쓰기 막기, AnyExplanation, attrText(), authoredExplanation(), endpointOf(), ExplainTargetKind (+29 more)

### Community 101 - "현장 기기 · 영상 관제 · 실시간 통신 · AI 결합 구성 지식 리서치 (2026-11-12)"
Cohesion: 0.29
Nodes (6): 넣지 않은 것, 반영 현황, 접속이 막힌 출처, 주의, 핵심 사실, 현장 기기 · 영상 관제 · 실시간 통신 · AI 결합 구성 지식 리서치 (2026-11-12)

### Community 102 - "mcp/route.ts"
Cohesion: 0.10
Nodes (21): Task 7: MCP 라우트와 도구, 목표와 범위 밖, 배포할 때 볼 것, 보안 작은 고침 (개선 묶음 A), 왜, 접근, 확인, bearerKey() (+13 more)

### Community 103 - "events.ts"
Cohesion: 0.48
Nodes (6): ClarifyQuestion, GuideNote, Warning, WarningCounts, MessageMeta, NODE_GONE_MESSAGE

### Community 104 - "diff.ts"
Cohesion: 0.24
Nodes (11): commandsBetween(), depth(), diffStates(), equal(), changeDelta(), plusMinus(), REQUEST_MAX, turnVersionSummary() (+3 more)

### Community 105 - "qwen.ts"
Cohesion: 0.36
Nodes (6): abortError(), ChatMessage, createQwenClient(), attempt(), isRetryable(), RETRY_DELAYS

### Community 106 - "reset.ts"
Cohesion: 0.15
Nodes (15): ResetPasswordPage(), AUTH_SECRET_MIN, env, envSchema, productionChecks(), checkProductionEnv(), register(), sendMail() (+7 more)

### Community 107 - "createJsonlParser"
Cohesion: 0.38
Nodes (8): createJsonlParser(), isCommandLine(), Scan, scanLine(), step(), stripWrap(), createThinkStripper(), partialTagLen()

### Community 108 - "ref_react"
Cohesion: 0.13
Nodes (18): ExportBackground, ExportFormat, BACKGROUNDS, EXPORT_BUSY_MESSAGE, EXPORT_DONE_MESSAGE, EXPORT_EMPTY_REASON, EXPORT_FAILED_MESSAGE, EXPORT_LABEL (+10 more)

### Community 109 - "patternPromptBlock"
Cohesion: 0.29
Nodes (6): Global Constraints, MCP 그리기를 앱 대화와 맞추기 — 구현 계획, Task 1: 영상·미디어 연결 규칙과 가이드 길이 상한, Task 2: 영상관제(VMS) 구성 패턴, Task 3: 이름 검사와 create_project 의 첫 구성도 이름, Task 4: lookup_terms 도구

### Community 110 - "InfoCard.tsx"
Cohesion: 0.10
Nodes (18): parseLinkWarningId(), ZoneType, CardMeasure, Chevron(), Count(), GuessedZones(), InfoCard(), InfoCardProps (+10 more)

### Community 111 - "overlap.ts"
Cohesion: 0.39
Nodes (7): GROUP_PAD, circleHitsRect(), findOverlaps(), grow(), intersects(), PAIR_BADGE_OFFSET, strictlyInside()

### Community 112 - "정한 것"
Cohesion: 0.20
Nodes (9): AI 설명 (사용자), 고르기 (사용자), 물어보기 (제 판단), 사전 용어 (제 판단), 설명 탭 (사용자), 안 하는 것, 영역 선택과 영역 설명, 왜 (+1 more)

### Community 113 - "messenger-cloud.ts"
Cohesion: 0.36
Nodes (7): api(), ASG_DEF, chat(), ec2(), FlowStepRow, push(), REDIS

### Community 114 - "flowSuggest.ts"
Cohesion: 0.11
Nodes (21): BodySchema, Ctx, dynamic, maxDuration, POST(), runtime, FlowOp, DiagramState (+13 more)

### Community 116 - "groupInfo.ts"
Cohesion: 0.36
Nodes (7): byLabel(), CrossingEdge, crossingEdges(), GroupMember, groupMembers(), isInside(), parentOf()

### Community 117 - "deps.ts"
Cohesion: 0.27
Nodes (8): Qwen URL 정규화, GET(), parseEnv(), llmConfig, normalizeQwenBaseUrl(), checkLlmHealth(), LlmHealth, probe()

### Community 118 - "NodeMenu"
Cohesion: 0.48
Nodes (3): NodeMenu(), NodeMenuProps, placeMenu()

### Community 119 - "glossaryMatch.ts"
Cohesion: 0.40
Nodes (5): GLOSSARY_MATCH_MAX, MatchedTerm, MatchEntry, matchGlossaryTerms(), squash()

### Community 120 - "samples.ts"
Cohesion: 0.12
Nodes (19): DiagramPage(), buildSample(), liveGuideView(), getDiagram(), AddEdge, AddGroup, AddNode, AUX_NODE_KINDS (+11 more)

### Community 121 - "대화창 모양 정리 (짧은 설계)"
Cohesion: 0.33
Nodes (5): 대화창 모양 정리 (짧은 설계), 만드는 사람에게 남기는 것, 목표 / 하지 않는 것, 방식 (고려한 것과 고른 것), 왜

### Community 122 - "head/route.ts"
Cohesion: 0.40
Nodes (5): Ctx, dynamic, GET(), runtime, getDiagramHead()

### Community 123 - "[sessionId]/route.ts"
Cohesion: 0.20
Nodes (15): Ctx, DELETE(), dynamic, failed(), GET(), guard(), json(), PATCH() (+7 more)

### Community 124 - "운영 안전망 (묶음 B) 설계"
Cohesion: 0.11
Nodes (17): CI (`.github/workflows/ci.yml`), Docker·compose (`deploy/`), 목표, 배포 절차 (`deploy/deploy.sh`), 배포할 때 볼 것, 백업, 빌더에게 남긴 것, 사용자가 정한 것 (2026-11-27, "추천대로") (+9 more)

### Community 125 - "guides/apply.ts"
Cohesion: 0.18
Nodes (12): Task 5: 대화 차례의 흐름 명령, Task 2: 단계 적용(순수 함수)과 대본 검사 틀, ApplyOptions, isFlowCommand(), isStructural(), toFlowOp(), applyGuideStep(), ApplyGuideStepResult (+4 more)

### Community 126 - "missing.ts"
Cohesion: 0.20
Nodes (14): 빠진 정보 채우기, 노드 종류 목록 (kind·group_kind·edge_kind), NODE_KINDS, infoCounts, LABELS, computeMissing(), FIELD_LABELS, labelOf() (+6 more)

### Community 127 - "userTurns.ts"
Cohesion: 0.13
Nodes (14): 목표와 범위 밖, 배포할 때 볼 것, 왜, 자원 한도 (개선 묶음 C), 접근, 항목, 확인, BACKGROUND_WAIT_MS (+6 more)

### Community 128 - "useDiagramView.ts"
Cohesion: 0.17
Nodes (13): FlowProps, buildDisplayGraph(), DisplayGraph, DisplayOptions, isBus(), isEgressNode(), elbowRoute(), Pt (+5 more)

### Community 129 - "applyCommand"
Cohesion: 0.31
Nodes (12): applyCommand(), applyCommands(), ApplyResult, endpointOk(), fail(), freeEdgeId(), full(), has() (+4 more)

### Community 130 - "ZoneNameLayer.tsx"
Cohesion: 0.20
Nodes (12): groupToggleWidth(), EDGE_Z, NODE_Z, ZONE_NAME_IN_PORTAL_Z, ZONE_Z_MAX, zoneZ(), ZoneName, ZoneNameLayer() (+4 more)

### Community 131 - "운영 배포"
Cohesion: 0.15
Nodes (12): DB 까지 되돌리기, 되돌리기, 문제 해결, 백업, 복구 연습, 새 버전 배포, 설정 메모, 옛 서버에서 옮기기 (+4 more)

### Community 132 - "Command"
Cohesion: 0.22
Nodes (9): Task 6: AI 흐름 제안(처음 그린 뒤 자동 + 버튼), Command, FlowCommand, AddEdge, createEdgeCoalescer(), EdgeCoalescer, has(), idTaken() (+1 more)

### Community 133 - "Claude Code 연동(MCP 서버) — 설계"
Cohesion: 0.17
Nodes (11): 1. 누가 그리나, 2. 어디서 띄우나, 3. 키 관리 (제 판단), 5. 기록과 동시 작업, 6. 브라우저에서 보기 (사용자: "어렵지 않으면 시각 효과도"), Claude Code 연동(MCP 서버) — 설계, 만드는 사람에게 맡기는 것, 목표 (+3 more)

### Community 134 - "EdgeLayerProps"
Cohesion: 0.22
Nodes (5): Task 2: 마우스 강조·흐리기, EdgeLayerProps, Emphasis, NodeVisualState, useHoverEmphasis()

### Community 135 - "Review Focus"
Cohesion: 0.22
Nodes (9): Global Constraints, Review Focus, Task 1: 배치 측정 모듈과 기준선 테스트, Task 2: 평소 화면 평행선 16px, Task 4: 강조 겹선 층(선택·호버)과 갈림점·움직임 층, Task 7: 화면 확인, 전후 비교, E2E, 문서 동기화, 구성도 배치 조화 1단계 — 선택 강조와 선 간격 Implementation Plan, defaultViewLayout() (+1 more)

### Community 136 - "parseCommand"
Cohesion: 0.20
Nodes (8): Global Constraints, 망 종류 지식과 망연계 예상 Implementation Plan, Claude Code 연동(MCP 서버) Implementation Plan, Global Constraints, Review Focus, 제약, parseCommand(), pickFlows()

### Community 137 - "roving.ts"
Cohesion: 0.22
Nodes (9): CONE_SLACK, gap(), NAV_KEYS, navItems(), readingOrder(), ROW_TOLERANCE, step(), tabStop() (+1 more)

### Community 138 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, Review Focus, Task 0: 작업 공간, Task 11: E2E, Task 12: 마무리, Task 1: 대본 타입과 판정 함수, Task 4: 진행 상태 저장(`guide_runs`), 학습 모드 1차 Implementation Plan

### Community 139 - "server/health.ts"
Cohesion: 0.39
Nodes (6): dynamic, GET(), checkHealth(), Health, HEALTH_TIMEOUT_MS, pingDb()

### Community 140 - "GuideEnv"
Cohesion: 0.29
Nodes (6): GuideMark, GuideEnv, GuideVariant, GuideRun, SyncedRun, ChatGuide

### Community 141 - "GuideDone.tsx"
Cohesion: 0.39
Nodes (6): iGa(), GUIDE_FREE_LINE, GuideDone(), GuideDoneProps, ramyeon(), rebuildLabel()

### Community 142 - "patternPromptBlock"
Cohesion: 0.40
Nodes (5): Task 1: 그리기 규칙 공용 모듈, Pattern, patternPromptBlock(), PATTERNS, patternBlock()

### Community 144 - "restoreVersionWithMessage"
Cohesion: 0.60
Nodes (5): 4. 도구, infoChangeText(), getVersion(), restoreVersion(), restoreVersionWithMessage()

## Knowledge Gaps
- **861 isolated node(s):** `MenuAction`, `MenuItem`, `MenuTarget`, `SidebarProject`, `FlowOpOutcome` (+856 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 981 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `flowSuggest.ts` to `useDiagramView.ts`, `applyCommand`, `domain/flows.ts`, `(app)/actions.ts`, `Command`, `chat/warnings.ts`, `prompt.ts`, `설명 생성과 품질 검사`, `getOwnedDiagram`, `RightPanel.tsx`, `흐름 보기와 망 경계 표시 Implementation Plan`, `networkRules.ts`, `DiagramWorkspace.tsx`, `read.ts`, `index.ts`, `Canvas.tsx`, `NodeInfo.tsx`, `Flow`, `domain/warnings.ts`, `clarify.ts`, `layoutMetrics.ts`, `mcp/apply.ts`, `MissingChecklist.tsx`, `ValidationError`, `pipeline.ts`, `turn.ts`, `domain/linkGuess.ts`, `domain/types.ts`, `domain/assumptions.ts`, `projects.ts`, `FlowPanel.tsx`, `clef.ts`, `useSessions.ts`, `domain/explain.ts`, `diff.ts`, `InfoCard.tsx`, `groupInfo.ts`, `samples.ts`, `guides/apply.ts`, `missing.ts`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `DiagramWorkspace()` connect `DiagramWorkspace.tsx` to `useDiagramView.ts`, `applyCommand`, `domain/flows.ts`, `(app)/actions.ts`, `Review Focus`, `getOwnedDiagram`, `RightPanel.tsx`, `networkRules.ts`, `Canvas.tsx`, `FlyLayer.tsx`, `EdgeLayer.tsx`, `Flow`, `runs.ts`, `edgeLabels.ts`, `Shell.tsx`, `Legend.tsx`, `domain/assumptions.ts`, `projects.ts`, `useSessions.ts`, `Button`, `배치 가독성 3·4단계 — 처음 접기, 묶음 접기 단추, 엇갈림 줄이기`, `Review Focus`, `useChatTurn.ts`, `useRemoteChanges.ts`, `domain/explain.ts`, `diff.ts`, `InfoCard.tsx`, `samples.ts`, `guides/apply.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Button()` connect `Button` to `Sidebar.tsx`, `(app)/actions.ts`, `ChatPanel.tsx`, `Review Focus`, `GuideDone.tsx`, `GuideCard`, `RightPanel.tsx`, `DiagramWorkspace.tsx`, `Button.tsx`, `McpKeysPage.tsx`, `ResetPasswordForm.tsx`, `NodeInfo.tsx`, `runs.ts`, `Explanation.tsx`, `Shell.tsx`, `GlossaryPage.tsx`, `clarify.ts`, `MissingChecklist.tsx`, `StatusScreen.tsx`, `FlowPanel.tsx`, `InfoCard.tsx`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `ValidationError` (e.g. with `Task 2: 용어 사전 시드와 서버 함수` and `Task 5: 설명 API`) actually correct?**
  _`ValidationError` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `DiagramWorkspace()` (e.g. with `InfraSketch 3D단계: 화면·사용성 개선 구현 계획` and `Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)`) actually correct?**
  _`DiagramWorkspace()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `MenuAction`, `MenuItem`, `MenuTarget` to the rest of the system?**
  _861 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1226890756302521 - nodes in this community are weakly interconnected._