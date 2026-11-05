---
title: "flowSuggest.ts"
sidebar_position: 36
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 22 nodes · cohesion 0.16

## Key Concepts

- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **DiagramState** (47 connections) — `src/domain/types.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **NodeInfoProps** (10 connections) — `src/ui/NodeInfo.tsx`
- **Flow** (9 connections) — `src/domain/flows.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
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

- [server/flows.ts](server-flows.ts.md) (13 shared connections)
- [schema.ts](schema.ts.md) (10 shared connections)
- [prompt.ts](prompt.ts.md) (10 shared connections)
- [NodeInfo.tsx](NodeInfo.tsx.md) (7 shared connections)
- [suggest/route.ts](suggest-route.ts.md) (5 shared connections)
- [deps.ts](deps.ts.md) (5 shared connections)
- [commands.ts](commands.ts.md) (5 shared connections)
- [DiagramState](DiagramState.md) (4 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (4 shared connections)
- [3C-1 계획 작업 목록](3C-1_계획_작업_목록.md) (4 shared connections)
- [projects.ts](projects.ts.md) (3 shared connections)
- [useExplanations.ts](useExplanations.ts.md) (3 shared connections)

## Source Files

- `src/db/schema.ts`
- `src/domain/flows.ts`
- `src/domain/types.ts`
- `src/server/flowSuggest.ts`
- `src/ui/NodeInfo.tsx`

## Audit Trail

- EXTRACTED: 136 (96%)
- INFERRED: 5 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*