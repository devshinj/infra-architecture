---
title: "QwenClient"
sidebar_position: 105
---
# QwenClient

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 8 nodes · cohesion 0.25

## Key Concepts

- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **ClefClient** (8 connections) — `src/server/llm/clef.ts`
- **.streamCompletion()** (6 connections) — `src/server/llm/qwen.ts`
- **complete()** (3 connections) — `src/server/explain.ts`
- **ExplainDeps** (3 connections) — `src/server/explain.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
- **FlowSuggestDeps** (2 connections) — `src/server/flowSuggest.ts`
- **.classifyIntent()** (1 connections) — `src/server/llm/clef.ts`

## Relationships

- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (5 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (5 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (4 shared connections)
- [pipeline.ts](pipeline.ts.md) (4 shared connections)
- [clef.ts](clef.ts.md) (1 shared connections)
- [deps.ts](deps.ts.md) (1 shared connections)
- [domain/explain.ts](domain-explain.ts.md) (1 shared connections)

## Source Files

- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 23 (82%)
- INFERRED: 5 (18%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*