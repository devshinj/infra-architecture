---
title: "flowSuggest.ts"
sidebar_position: 13
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 32 nodes · cohesion 0.10

## Key Concepts

- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **suggest/route.ts** (17 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **FlowOp** (6 connections) — `src/domain/flows.ts`
- **.streamCompletion()** (6 connections) — `src/server/llm/qwen.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **POST()** (3 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **FLOW_LIMITS** (3 connections) — `src/domain/flows.ts`
- **complete()** (3 connections) — `src/server/explain.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
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
- *... and 7 more nodes in this community*

## Relationships

- [deps.ts](deps.ts.md) (7 shared connections)
- [pipeline.ts](pipeline.ts.md) (6 shared connections)
- [ref_react](ref_react.md) (5 shared connections)
- [useFlows](useFlows.md) (5 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (4 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (4 shared connections)
- [schema.ts](schema.ts.md) (4 shared connections)
- [types.ts](types.ts.md) (4 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (3 shared connections)
- [prompt.ts](prompt.ts.md) (3 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (3 shared connections)
- [auth](auth.md) (2 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- `src/domain/flows.ts`
- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 106 (92%)
- INFERRED: 9 (8%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*