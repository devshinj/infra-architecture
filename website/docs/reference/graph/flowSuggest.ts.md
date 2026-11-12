---
title: "flowSuggest.ts"
sidebar_position: 25
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 29 nodes · cohesion 0.11

## Key Concepts

- **DiagramState** (61 connections) — `src/domain/types.ts`
- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **suggest/route.ts** (17 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **flows** (4 connections) — `src/db/schema.ts`
- **.getLatestState()** (4 connections) — `src/server/explain.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **POST()** (3 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **.getOwnedDiagram()** (3 connections) — `src/server/flowSuggest.ts`
- **.listFlows()** (3 connections) — `src/server/flowSuggest.ts`
- **FLOW_SUGGEST_BUSY_MESSAGE** (2 connections) — `src/server/flowSuggest.ts`
- **.claimSuggest()** (2 connections) — `src/server/flowSuggest.ts`
- **.releaseSuggest()** (2 connections) — `src/server/flowSuggest.ts`
- **.withLock()** (2 connections) — `src/server/flowSuggest.ts`
- **UseExplanationsInput** (2 connections) — `src/ui/explain/useExplanations.ts`
- **BodySchema** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **maxDuration** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **AddFlowOp** (1 connections) — `src/server/flowSuggest.ts`
- **dbRepo** (1 connections) — `src/server/flowSuggest.ts`
- *... and 4 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (8 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (7 shared connections)
- [schema.ts](schema.ts.md) (6 shared connections)
- [deps.ts](deps.ts.md) (6 shared connections)
- [projects.ts](projects.ts.md) (5 shared connections)
- [commands.ts](commands.ts.md) (5 shared connections)
- [useFlows](useFlows.md) (4 shared connections)
- [NodeInfo.tsx](NodeInfo.tsx.md) (4 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (4 shared connections)
- [Command](Command.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (4 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- `src/db/schema.ts`
- `src/domain/types.ts`
- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/ui/explain/useExplanations.ts`

## Audit Trail

- EXTRACTED: 153 (96%)
- INFERRED: 6 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*