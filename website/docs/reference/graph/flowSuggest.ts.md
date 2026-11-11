---
title: "flowSuggest.ts"
sidebar_position: 43
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 22 nodes · cohesion 0.16

## Key Concepts

- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **Flow** (11 connections) — `src/domain/flows.ts`
- **FlowOp** (8 connections) — `src/domain/flows.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **toFlowOp()** (7 connections) — `src/domain/commands.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
- **.getOwnedDiagram()** (3 connections) — `src/server/flowSuggest.ts`
- **.listFlows()** (3 connections) — `src/server/flowSuggest.ts`
- **resolveDeps()** (3 connections) — `src/server/flowSuggest.ts`
- **.claimSuggest()** (2 connections) — `src/server/flowSuggest.ts`
- **.releaseSuggest()** (2 connections) — `src/server/flowSuggest.ts`
- **.withLock()** (2 connections) — `src/server/flowSuggest.ts`
- **AddFlowOp** (1 connections) — `src/server/flowSuggest.ts`
- **dbRepo** (1 connections) — `src/server/flowSuggest.ts`
- **DepsInput** (1 connections) — `src/server/flowSuggest.ts`
- **FLOW_SUGGEST_FAIL_MESSAGE** (1 connections) — `src/server/flowSuggest.ts`
- **FLOW_SUGGEST_LIMIT_MESSAGE** (1 connections) — `src/server/flowSuggest.ts`
- **SuggestResult** (1 connections) — `src/server/flowSuggest.ts`

## Relationships

- [schema.ts](schema.ts.md) (13 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (8 shared connections)
- [DiagramState](DiagramState.md) (5 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (5 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (5 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [suggest/route.ts](suggest-route.ts.md) (4 shared connections)
- [pipeline.ts](pipeline.ts.md) (3 shared connections)
- [commands.ts](commands.ts.md) (3 shared connections)
- [normalize.ts](normalize.ts.md) (3 shared connections)
- [createJsonlParser](createJsonlParser.md) (3 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (3 shared connections)

## Source Files

- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/server/flowSuggest.ts`

## Audit Trail

- EXTRACTED: 99 (95%)
- INFERRED: 5 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*