---
title: "flowSuggest.ts"
sidebar_position: 21
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 31 nodes · cohesion 0.10

## Key Concepts

- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **suggest/route.ts** (17 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **buildFlowSuggestMessages()** (5 connections) — `src/server/chat/prompt.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **diagrams** (4 connections) — `src/db/schema.ts`
- **flows** (4 connections) — `src/db/schema.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **POST()** (3 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **summarizeFlows()** (3 connections) — `src/server/chat/prompt.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
- **.getOwnedDiagram()** (3 connections) — `src/server/flowSuggest.ts`
- **.listFlows()** (3 connections) — `src/server/flowSuggest.ts`
- **resolveDeps()** (3 connections) — `src/server/flowSuggest.ts`
- **FLOW_SUGGEST_BUSY_MESSAGE** (2 connections) — `src/server/flowSuggest.ts`
- **.claimSuggest()** (2 connections) — `src/server/flowSuggest.ts`
- **.releaseSuggest()** (2 connections) — `src/server/flowSuggest.ts`
- **.withLock()** (2 connections) — `src/server/flowSuggest.ts`
- **BodySchema** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **maxDuration** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- *... and 6 more nodes in this community*

## Relationships

- [mcp/apply.ts](mcp-apply.ts.md) (9 shared connections)
- [ref_react](ref_react.md) (7 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (5 shared connections)
- [deps.ts](deps.ts.md) (5 shared connections)
- [projects.ts](projects.ts.md) (4 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (4 shared connections)
- [server/flows.ts](server-flows.ts.md) (3 shared connections)
- [prompt.ts](prompt.ts.md) (3 shared connections)
- [edgeCoalesce.ts](edgeCoalesce.ts.md) (3 shared connections)
- [Shell.tsx](Shell.tsx.md) (2 shared connections)
- [server/network.ts](server-network.ts.md) (2 shared connections)
- [pipeline.ts](pipeline.ts.md) (2 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- `src/db/schema.ts`
- `src/server/chat/prompt.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`

## Audit Trail

- EXTRACTED: 102 (95%)
- INFERRED: 5 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*