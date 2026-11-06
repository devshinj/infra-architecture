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
- **Flow** (9 connections) — `src/domain/flows.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **FlowOp** (6 connections) — `src/domain/flows.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **diagrams** (3 connections) — `src/db/schema.ts`
- **flows** (3 connections) — `src/db/schema.ts`
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

- [server/flows.ts](server-flows.ts.md) (12 shared connections)
- [schema.ts](schema.ts.md) (10 shared connections)
- [projects.ts](projects.ts.md) (9 shared connections)
- [pipeline.ts](pipeline.ts.md) (8 shared connections)
- [prompt.ts](prompt.ts.md) (5 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (5 shared connections)
- [suggest/route.ts](suggest-route.ts.md) (5 shared connections)
- [NodeInfo.tsx](NodeInfo.tsx.md) (4 shared connections)
- [types.ts](types.ts.md) (4 shared connections)
- [QwenClient](QwenClient.md) (4 shared connections)
- [useExplanations.ts](useExplanations.ts.md) (3 shared connections)
- [display.ts](display.ts.md) (3 shared connections)

## Source Files

- `src/db/schema.ts`
- `src/domain/flows.ts`
- `src/domain/types.ts`
- `src/server/flowSuggest.ts`

## Audit Trail

- EXTRACTED: 133 (96%)
- INFERRED: 5 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*