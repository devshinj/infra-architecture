---
title: "flowSuggest.ts"
sidebar_position: 31
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 22 nodes · cohesion 0.16

## Key Concepts

- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **DiagramState** (48 connections) — `src/domain/types.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **parseCommand()** (6 connections) — `src/domain/commands.ts`
- **toFlowOp()** (5 connections) — `src/domain/commands.ts`
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

- [projects.ts](projects.ts.md) (15 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (11 shared connections)
- [server/flows.ts](server-flows.ts.md) (7 shared connections)
- [pipeline.ts](pipeline.ts.md) (6 shared connections)
- [commands.ts](commands.ts.md) (5 shared connections)
- [MissingChecklist.tsx](MissingChecklist.tsx.md) (5 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (5 shared connections)
- [suggest/route.ts](suggest-route.ts.md) (5 shared connections)
- [NodeInfo.tsx](NodeInfo.tsx.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [useExplanations.ts](useExplanations.ts.md) (3 shared connections)
- [types.ts](types.ts.md) (3 shared connections)

## Source Files

- `src/domain/commands.ts`
- `src/domain/types.ts`
- `src/server/flowSuggest.ts`

## Audit Trail

- EXTRACTED: 129 (95%)
- INFERRED: 7 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*