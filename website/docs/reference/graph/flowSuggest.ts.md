---
title: "flowSuggest.ts"
sidebar_position: 37
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 27 nodes · cohesion 0.12

## Key Concepts

- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **suggest/route.ts** (17 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **POST()** (3 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **.getOwnedDiagram()** (3 connections) — `src/server/flowSuggest.ts`
- **.listFlows()** (3 connections) — `src/server/flowSuggest.ts`
- **FLOW_SUGGEST_BUSY_MESSAGE** (2 connections) — `src/server/flowSuggest.ts`
- **FlowSuggestDeps** (2 connections) — `src/server/flowSuggest.ts`
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
- **DepsInput** (1 connections) — `src/server/flowSuggest.ts`
- **FLOW_SUGGEST_FAIL_MESSAGE** (1 connections) — `src/server/flowSuggest.ts`
- *... and 2 more nodes in this community*

## Relationships

- [schema.ts](schema.ts.md) (11 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (9 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (7 shared connections)
- [env.ts](env.ts.md) (5 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (3 shared connections)
- [qwen.ts](qwen.ts.md) (3 shared connections)
- [DiagramState](DiagramState.md) (3 shared connections)
- [auth](auth.md) (2 shared connections)
- [projects.ts](projects.ts.md) (2 shared connections)
- [normalize.ts](normalize.ts.md) (2 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (2 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 98 (96%)
- INFERRED: 4 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*