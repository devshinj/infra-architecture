---
title: "flowSuggest.ts"
sidebar_position: 8
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 42 nodes · cohesion 0.09

## Key Concepts

- **DiagramState** (64 connections) — `src/domain/types.ts`
- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **domain/flows.ts** (44 connections) — `src/domain/flows.ts`
- **suggest/route.ts** (17 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **checkFlow()** (13 connections) — `src/domain/flows.ts`
- **Flow** (12 connections) — `src/domain/flows.ts`
- **judgeFlowOps()** (9 connections) — `src/domain/flows.ts`
- **FlowOp** (8 connections) — `src/domain/flows.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **toFlowOp()** (7 connections) — `src/domain/commands.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **flowsThrough()** (5 connections) — `src/domain/flows.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **stepEnd()** (4 connections) — `src/domain/flows.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **POST()** (3 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **toSteps()** (3 connections) — `src/domain/flows.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
- **.getOwnedDiagram()** (3 connections) — `src/server/flowSuggest.ts`
- **.listFlows()** (3 connections) — `src/server/flowSuggest.ts`
- **resolveDeps()** (3 connections) — `src/server/flowSuggest.ts`
- **Checked** (3 connections) — `src/server/mcp/apply.ts`
- **problemReason()** (2 connections) — `src/domain/flows.ts`
- *... and 17 more nodes in this community*

## Relationships

- [mcp/apply.ts](mcp-apply.ts.md) (17 shared connections)
- [schema.ts](schema.ts.md) (11 shared connections)
- [server/flows.ts](server-flows.ts.md) (11 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (9 shared connections)
- [pipeline.ts](pipeline.ts.md) (9 shared connections)
- [networkRules.ts](networkRules.ts.md) (9 shared connections)
- [FlowPanel.tsx](FlowPanel.tsx.md) (8 shared connections)
- [NodeInfo.tsx](NodeInfo.tsx.md) (7 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (6 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (5 shared connections)
- [commands.ts](commands.ts.md) (4 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/types.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/mcp/apply.ts`

## Audit Trail

- EXTRACTED: 236 (96%)
- INFERRED: 11 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*