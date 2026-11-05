---
title: "prompt.ts"
sidebar_position: 3
---
# prompt.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 67 nodes · cohesion 0.05

## Key Concepts

- **prompt.ts** (51 connections) — `src/server/chat/prompt.ts`
- **domain/warnings.ts** (26 connections) — `src/domain/warnings.ts`
- **chat/warnings.ts** (25 connections) — `src/server/chat/warnings.ts`
- **createJsonlParser()** (15 connections) — `src/server/llm/jsonl.ts`
- **DNode** (11 connections) — `src/domain/types.ts`
- **evaluateRules()** (11 connections) — `src/domain/warnings.ts`
- **jsonl.ts** (11 connections) — `src/server/llm/jsonl.ts`
- **Task 2: 서버 점검 — Clef 판정과 Qwen 문구** (10 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **checkWarnings()** (9 connections) — `src/server/chat/warnings.ts`
- **파일 구조** (8 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **Edge** (7 connections) — `src/domain/types.ts`
- **judgeExposed()** (7 connections) — `src/server/chat/warnings.ts`
- **explainContext()** (6 connections) — `src/server/chat/prompt.ts`
- **buildFlowSuggestMessages()** (5 connections) — `src/server/chat/prompt.ts`
- **writeTexts()** (5 connections) — `src/server/chat/warnings.ts`
- **noulProbability()** (5 connections) — `src/server/llm/clef.ts`
- **Task 3: 대화 차례에 점검 단계 넣기** (4 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **Task 1: 망 영역·망연계 노드·연결 전달물/방향** (4 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **NodeKind** (4 connections) — `src/domain/catalog.ts`
- **patterns.ts** (4 connections) — `src/domain/patterns.ts`
- **WarningLevel** (4 connections) — `src/domain/types.ts`
- **buildExplainMessages()** (4 connections) — `src/server/chat/prompt.ts`
- **buildWarningMessages()** (4 connections) — `src/server/chat/prompt.ts`
- **summarizeState()** (4 connections) — `src/server/chat/prompt.ts`
- **Task 4: "의도된 구성" 저장** (3 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- *... and 42 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (13 shared connections)
- [types.ts](types.ts.md) (10 shared connections)
- [ask.ts](ask.ts.md) (10 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (10 shared connections)
- [server/flows.ts](server-flows.ts.md) (6 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (5 shared connections)
- [useExplanations.ts](useExplanations.ts.md) (4 shared connections)
- [ZoneNameLayer.tsx](ZoneNameLayer.tsx.md) (4 shared connections)
- [NodeInfo.tsx](NodeInfo.tsx.md) (4 shared connections)
- [3C-1 계획 작업 목록](3C-1_계획_작업_목록.md) (3 shared connections)
- [display.ts](display.ts.md) (3 shared connections)
- [missing.ts](missing.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/domain/catalog.ts`
- `src/domain/patterns.ts`
- `src/domain/types.ts`
- `src/domain/warnings.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/warnings.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/jsonl.ts`

## Audit Trail

- EXTRACTED: 188 (89%)
- INFERRED: 23 (11%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*