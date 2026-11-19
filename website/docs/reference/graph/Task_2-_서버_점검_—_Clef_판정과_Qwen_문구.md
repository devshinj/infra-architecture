---
title: "Task 2: 서버 점검 — Clef 판정과 Qwen 문구"
sidebar_position: 97
---
# Task 2: 서버 점검 — Clef 판정과 Qwen 문구

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 9 nodes · cohesion 0.25

## Key Concepts

- **Task 2: 서버 점검 — Clef 판정과 Qwen 문구** (10 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **ClefClient** (8 connections) — `src/server/llm/clef.ts`
- **.streamCompletion()** (6 connections) — `src/server/llm/qwen.ts`
- **.decide()** (4 connections) — `src/server/llm/clef.ts`
- **ExplainDeps** (3 connections) — `src/server/explain.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
- **FlowSuggestDeps** (2 connections) — `src/server/flowSuggest.ts`
- **.classifyIntent()** (1 connections) — `src/server/llm/clef.ts`

## Relationships

- [chat/warnings.ts](chat-warnings.ts.md) (6 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (5 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (4 shared connections)
- [pipeline.ts](pipeline.ts.md) (4 shared connections)
- [파일 구조](파일_구조.md) (1 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (1 shared connections)
- [createJsonlParser](createJsonlParser.md) (1 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (1 shared connections)
- [domain/explain.ts](domain-explain.ts.md) (1 shared connections)
- [drawing/rules.ts](drawing-rules.ts.md) (1 shared connections)
- [clef.ts](clef.ts.md) (1 shared connections)
- [qwen.ts](qwen.ts.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 22 (59%)
- INFERRED: 15 (41%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*