---
title: "분석 보고서"
sidebar_position: 1
---
# 분석 보고서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 631 nodes · 1572 edges · 20 communities (19 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `192f30d8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 서버 액션과 작업 화면
- React Flow 캔버스
- 연결선 렌더링과 패널
- 인증과 외부 라이브러리
- 가정과 대화 패널 UI
- DB와 메시지 저장
- 설계 문서와 계획
- 빠진 정보 계산과 표시
- ELK 배치와 겹침 검사
- AI 서버 설정과 상태 점검
- 명령 적용과 샘플
- 대화 스트리밍 API
- 프롬프트와 노드 참조
- 대화 응답 문구와 스트림 정리
- 명령 스키마
- 건너뜀 집계
- Clef 의도 분류
- 속성 정규화
- 대화 의존성 인터페이스
- 라우트 재수출

## God Nodes (most connected - your core abstractions)
1. `InfraSketch 설계 문서` - 34 edges
2. `DiagramState` - 27 edges
3. `getOwnedDiagram()` - 24 edges
4. `DiagramWorkspace()` - 22 edges
5. `lockedTurn()` - 20 edges
6. `createVersion()` - 14 edges
7. `useChatTurn()` - 14 edges
8. `computeMissing()` - 14 edges
9. `run()` - 13 edges
10. `emptyState()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `구성도당 한 차례 잠금 (409)` --references--> `withDiagramLock()`  [EXTRACTED]
  docs/superpowers/plans/2026-10-29-infrasketch-phase2-ai-chat.md → src/server/chat/lock.ts
- `표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선)` --references--> `Canvas()`  [EXTRACTED]
  docs/superpowers/plans/2026-10-29-infrasketch-phase1-foundation-canvas.md → src/canvas/Canvas.tsx
- `NDJSON 스트리밍 API` --references--> `useChatTurn()`  [EXTRACTED]
  docs/superpowers/plans/2026-10-29-infrasketch-phase2-ai-chat.md → src/ui/chat/useChatTurn.ts
- `가정 목록 (구조 결정)` --references--> `confirmAssumption()`  [EXTRACTED]
  docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md → src/domain/assumptions.ts
- `폼 저장 = "직접 입력" 버전` --references--> `saveFieldsFor()`  [EXTRACTED]
  docs/superpowers/plans/2026-10-29-infrasketch-phase3a-missing-info.md → src/server/fields.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **대화 한 차례 흐름** — src_server_llm_clef_createclefclient_classifyintent, src_server_llm_qwen_createqwenclient, src_server_llm_jsonl_createjsonlparser, src_domain_apply_applycommand, src_server_versions_createversion, src_server_chat_pipeline_runchatturn [EXTRACTED 1.00]
- **구성도 렌더링 흐름** — src_canvas_display_builddisplaygraph, src_canvas_layout_layoutdiagram, src_canvas_segments_buildsegmentbundles, src_canvas_edgelayer_edgelayer, src_canvas_canvas_canvas [EXTRACTED 1.00]

## Communities (20 total, 1 thin omitted)

### Community 0 - "서버 액션과 작업 화면"
Cohesion: 0.07
Nodes (78): ActionResult, clearPinnedAction(), confirmAssumptionAction(), createDiagramAction(), createProjectAction(), deleteDiagramAction(), deleteProjectAction(), duplicateDiagramAction() (+70 more)

### Community 1 - "React Flow 캔버스"
Cohesion: 0.06
Nodes (46): PanelNode, Canvas(), CanvasOptions, CanvasProps, CLEANUP_TOGGLES, DiffMarks, drawnId(), FAR_ZOOM (+38 more)

### Community 2 - "연결선 렌더링과 패널"
Cohesion: 0.06
Nodes (52): 연결선 모양과 움직임, ALB, EdgePanels(), n(), Panel, PanelEdge, PANELS, PanelView() (+44 more)

### Community 3 - "인증과 외부 라이브러리"
Cohesion: 0.07
Nodes (32): LoginPage(), ResetRequestPage(), ResetPasswordPage(), SignupPage(), metadata, plexSansKR, authConfig, handlers (+24 more)

### Community 4 - "가정과 대화 패널 UI"
Cohesion: 0.07
Nodes (27): ASSUMPTION_CHOICES, ASSUMPTION_LABELS, Assumption, Attrs, AssumptionChips(), AssumptionChipsProps, labelOf(), orderedKeys() (+19 more)

### Community 5 - "DB와 메시지 저장"
Cohesion: 0.09
Nodes (24): db, accounts, diagrams, diagramVersions, MessageRole, messages, projects, users (+16 more)

### Community 6 - "설계 문서와 계획"
Cohesion: 0.08
Nodes (31): 1단계 계획: 기반과 캔버스, 표시 파이프라인 (표시 변환 → ELK → React Flow + SVG 연결선), 대화 차례 파이프라인, 2단계 계획: AI 대화, NDJSON 스트리밍 API, 구성도당 한 차례 잠금 (409), 3A단계 계획: 빠진 정보 채우기, 폼 저장 = "직접 입력" 버전 (+23 more)

### Community 7 - "빠진 정보 계산과 표시"
Cohesion: 0.10
Nodes (31): CategoryIcon(), categoryOf(), computeMissing(), FIELD_LABELS, isEmpty(), labelOf(), MissingItem, requiredKeysFor() (+23 more)

### Community 8 - "ELK 배치와 겹침 검사"
Cohesion: 0.10
Nodes (30): elbowRoute(), Pt, BASE_OPTIONS, elk, ElkRun, EMPTY_GROUP, GROUP_PAD, LaidOutEdge (+22 more)

### Community 9 - "AI 서버 설정과 상태 점검"
Cohesion: 0.10
Nodes (24): Qwen URL 정규화, GET(), parseEnv(), defaultChatDeps(), abortError(), ClefHttpError, createClefClient(), acquire() (+16 more)

### Community 10 - "명령 적용과 샘플"
Cohesion: 0.11
Nodes (23): applyCommand(), applyCommands(), ApplyResult, endpointOk(), fail(), has(), idTaken(), parentOk() (+15 more)

### Community 11 - "대화 스트리밍 API"
Cohesion: 0.16
Nodes (12): BodySchema, dynamic, encoder, line(), Outcome, POST(), runtime, ChatEvent (+4 more)

### Community 12 - "프롬프트와 노드 참조"
Cohesion: 0.17
Nodes (12): 노드 참조 (@WAS#1 칩), EDGE_KINDS, ANSWER_PROMPT, buildMessages(), EDGE_KIND_LIST, GROUP_KIND_LIST, HISTORY_LIMIT, KIND_LIST (+4 more)

### Community 13 - "대화 응답 문구와 스트림 정리"
Cohesion: 0.27
Nodes (8): BUSY_MESSAGE, AI_UNAVAILABLE_MESSAGE, HISTORY_REPLY, KNOWN_OPS, TIMEOUT_MESSAGE, createJsonlParser(), createThinkStripper(), partialTagLen()

### Community 14 - "명령 스키마"
Cohesion: 0.18
Nodes (9): attrs, COMMAND_OPS, commandSchema, edgeKind, groupKind, id, nodeKind, parent (+1 more)

### Community 15 - "건너뜀 집계"
Cohesion: 0.22
Nodes (6): lockedTurn(), opName(), createSkipTally(), skipKey(), SkipKind, SkipTally

### Community 16 - "Clef 의도 분류"
Cohesion: 0.22
Nodes (8): ClefAnswer, ClefAnswers, Intent, INTENT_MIN_CONFIDENCE, INTENT_QUESTION, INTENTS, RESTART_DELAYS, RunOpts

### Community 17 - "속성 정규화"
Cohesion: 0.38
Nodes (6): DROP_NULL, flattenAttr(), HAS_ATTRS, isPlainObject(), NEEDS_PARENT, normalizeAiCommand()

### Community 18 - "대화 의존성 인터페이스"
Cohesion: 0.33
Nodes (3): ChatDeps, ClefClient, QwenClient

## Knowledge Gaps
- **118 isolated node(s):** `ActionResult`, `Mode`, `Pinned`, `Dialog`, `MenuAction` (+113 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 151 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramState` connect `빠진 정보 계산과 표시` to `서버 액션과 작업 화면`, `React Flow 캔버스`, `가정과 대화 패널 UI`, `DB와 메시지 저장`, `명령 적용과 샘플`, `프롬프트와 노드 참조`, `대화 응답 문구와 스트림 정리`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `InfraSketch 설계 문서` connect `설계 문서와 계획` to `AI 서버 설정과 상태 점검`, `연결선 렌더링과 패널`, `프롬프트와 노드 참조`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `computeMissing()` connect `빠진 정보 계산과 표시` to `React Flow 캔버스`, `DB와 메시지 저장`, `설계 문서와 계획`, `대화 응답 문구와 스트림 정리`, `건너뜀 집계`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `ActionResult`, `Mode`, `Pinned` to the rest of the system?**
  _118 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `서버 액션과 작업 화면` be split into smaller, more focused modules?**
  _Cohesion score 0.06895745675549322 - nodes in this community are weakly interconnected._
- **Should `React Flow 캔버스` be split into smaller, more focused modules?**
  _Cohesion score 0.05575065847234416 - nodes in this community are weakly interconnected._
- **Should `연결선 렌더링과 패널` be split into smaller, more focused modules?**
  _Cohesion score 0.06487434248977206 - nodes in this community are weakly interconnected._