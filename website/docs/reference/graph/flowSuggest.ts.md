---
title: "flowSuggest.ts"
sidebar_position: 31
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 31 nodes · cohesion 0.11

## Key Concepts

- **DiagramState** (70 connections) — `src/domain/types.ts`
- **flowSuggest.ts** (60 connections) — `src/server/flowSuggest.ts`
- **suggest/route.ts** (17 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **suggestFlows()** (17 connections) — `src/server/flowSuggest.ts`
- **FlowOp** (10 connections) — `src/domain/flows.ts`
- **FlowSuggestRepo** (9 connections) — `src/server/flowSuggest.ts`
- **LEARNING_LOCKED_MESSAGE** (6 connections) — `src/server/guide/runs.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **POST()** (3 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **.getOwnedDiagram()** (3 connections) — `src/server/flowSuggest.ts`
- **.isLearning()** (3 connections) — `src/server/flowSuggest.ts`
- **.listFlows()** (3 connections) — `src/server/flowSuggest.ts`
- **resolveDeps()** (3 connections) — `src/server/flowSuggest.ts`
- **Checked** (3 connections) — `src/server/mcp/apply.ts`
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

- [projects.ts](projects.ts.md) (18 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (9 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (7 shared connections)
- [ask/route.ts](ask-route.ts.md) (6 shared connections)
- [clarify.ts](clarify.ts.md) (5 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (5 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (5 shared connections)
- [guides/apply.ts](guides-apply.ts.md) (4 shared connections)
- [NodeInfo.tsx](NodeInfo.tsx.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [userTurns.ts](userTurns.ts.md) (4 shared connections)
- [ValidationError](ValidationError.md) (3 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- `src/domain/flows.ts`
- `src/domain/types.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/guide/runs.ts`
- `src/server/mcp/apply.ts`

## Audit Trail

- EXTRACTED: 179 (96%)
- INFERRED: 8 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*