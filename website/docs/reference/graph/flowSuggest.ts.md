---
title: "flowSuggest.ts"
sidebar_position: 13
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 36 nodes · cohesion 0.09

## Key Concepts

- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **suggest/route.ts** (17 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **parseCommand()** (8 connections) — `src/domain/commands.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **Global Constraints** (5 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **toFlowOp()** (5 connections) — `src/domain/commands.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **diagrams** (4 connections) — `src/db/schema.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **POST()** (3 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **flows** (3 connections) — `src/db/schema.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
- **.getOwnedDiagram()** (3 connections) — `src/server/flowSuggest.ts`
- **.listFlows()** (3 connections) — `src/server/flowSuggest.ts`
- **resolveDeps()** (3 connections) — `src/server/flowSuggest.ts`
- **FLOW_SUGGEST_BUSY_MESSAGE** (2 connections) — `src/server/flowSuggest.ts`
- **FlowSuggestDeps** (2 connections) — `src/server/flowSuggest.ts`
- **.claimSuggest()** (2 connections) — `src/server/flowSuggest.ts`
- **.releaseSuggest()** (2 connections) — `src/server/flowSuggest.ts`
- **.withLock()** (2 connections) — `src/server/flowSuggest.ts`
- *... and 11 more nodes in this community*

## Relationships

- [server/flows.ts](server-flows.ts.md) (12 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (8 shared connections)
- [deps.ts](deps.ts.md) (7 shared connections)
- [schema.ts](schema.ts.md) (6 shared connections)
- [pipeline.ts](pipeline.ts.md) (6 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (5 shared connections)
- [normalize.ts](normalize.ts.md) (4 shared connections)
- [auth](auth.md) (4 shared connections)
- [projects.ts](projects.ts.md) (4 shared connections)
- [commands.ts](commands.ts.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (3 shared connections)
- [createJsonlParser](createJsonlParser.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- `src/db/schema.ts`
- `src/domain/commands.ts`
- `src/server/chat/pipeline.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 120 (92%)
- INFERRED: 11 (8%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*