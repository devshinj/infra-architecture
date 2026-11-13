---
title: "flowSuggest.ts"
sidebar_position: 30
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 29 nodes · cohesion 0.11

## Key Concepts

- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **suggest/route.ts** (17 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **diagrams** (4 connections) — `src/db/schema.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **POST()** (3 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **.getOwnedDiagram()** (3 connections) — `src/server/flowSuggest.ts`
- **.listFlows()** (3 connections) — `src/server/flowSuggest.ts`
- **resolveDeps()** (3 connections) — `src/server/flowSuggest.ts`
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
- *... and 4 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (7 shared connections)
- [projects.ts](projects.ts.md) (6 shared connections)
- [normalize.ts](normalize.ts.md) (4 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (4 shared connections)
- [server/network.ts](server-network.ts.md) (3 shared connections)
- [prompt.ts](prompt.ts.md) (3 shared connections)
- [qwen.ts](qwen.ts.md) (3 shared connections)
- [env.ts](env.ts.md) (3 shared connections)
- [domain/explain.ts](domain-explain.ts.md) (3 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (2 shared connections)
- [schema.ts](schema.ts.md) (2 shared connections)
- [server/flows.ts](server-flows.ts.md) (2 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- `src/db/schema.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 102 (96%)
- INFERRED: 4 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*