---
title: "flowSuggest.ts"
sidebar_position: 82
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 13 nodes · cohesion 0.18

## Key Concepts

- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **.streamCompletion()** (6 connections) — `src/server/llm/qwen.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **complete()** (3 connections) — `src/server/explain.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
- **FlowSuggestDeps** (2 connections) — `src/server/flowSuggest.ts`
- **AddFlowOp** (1 connections) — `src/server/flowSuggest.ts`
- **dbRepo** (1 connections) — `src/server/flowSuggest.ts`
- **DepsInput** (1 connections) — `src/server/flowSuggest.ts`
- **FLOW_SUGGEST_FAIL_MESSAGE** (1 connections) — `src/server/flowSuggest.ts`
- **FLOW_SUGGEST_LIMIT_MESSAGE** (1 connections) — `src/server/flowSuggest.ts`
- **SuggestResult** (1 connections) — `src/server/flowSuggest.ts`

## Relationships

- [qwen.ts](qwen.ts.md) (7 shared connections)
- [suggestFlows](suggestFlows.md) (6 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (5 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (5 shared connections)
- [schema.ts](schema.ts.md) (5 shared connections)
- [pipeline.ts](pipeline.ts.md) (4 shared connections)
- [normalize.ts](normalize.ts.md) (3 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (3 shared connections)
- [suggest/route.ts](suggest-route.ts.md) (3 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (3 shared connections)
- [server/flows.ts](server-flows.ts.md) (2 shared connections)
- [prompt.ts](prompt.ts.md) (2 shared connections)

## Source Files

- `src/server/chat/pipeline.ts`
- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 64 (88%)
- INFERRED: 9 (12%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*