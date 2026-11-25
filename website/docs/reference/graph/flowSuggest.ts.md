---
title: "flowSuggest.ts"
sidebar_position: 43
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 29 nodes · cohesion 0.12

## Key Concepts

- **flowSuggest.ts** (57 connections) — `src/server/flowSuggest.ts`
- **suggest/route.ts** (17 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **suggestFlows()** (16 connections) — `src/server/flowSuggest.ts`
- **Flow** (12 connections) — `src/domain/flows.ts`
- **FlowSuggestRepo** (9 connections) — `src/server/flowSuggest.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **POST()** (3 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
- **.getOwnedDiagram()** (3 connections) — `src/server/flowSuggest.ts`
- **.isLearning()** (3 connections) — `src/server/flowSuggest.ts`
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
- **AddFlowOp** (1 connections) — `src/server/flowSuggest.ts`
- **dbRepo** (1 connections) — `src/server/flowSuggest.ts`
- *... and 4 more nodes in this community*

## Relationships

- [mcp/apply.ts](mcp-apply.ts.md) (8 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (7 shared connections)
- [ask/route.ts](ask-route.ts.md) (5 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [normalize.ts](normalize.ts.md) (4 shared connections)
- [commands.ts](commands.ts.md) (4 shared connections)
- [start.ts](start.ts.md) (3 shared connections)
- [reset.ts](reset.ts.md) (3 shared connections)
- [diff.ts](diff.ts.md) (3 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (2 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (2 shared connections)
- [projects.ts](projects.ts.md) (2 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- `src/domain/flows.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`

## Audit Trail

- EXTRACTED: 106 (94%)
- INFERRED: 7 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*