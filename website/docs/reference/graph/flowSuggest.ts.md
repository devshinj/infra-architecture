---
title: "flowSuggest.ts"
sidebar_position: 6
---
# flowSuggest.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 51 nodes · cohesion 0.06

## Key Concepts

- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **suggest/route.ts** (17 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **normalize.ts** (17 connections) — `src/server/chat/normalize.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **normalizeAiCommand()** (9 connections) — `src/server/chat/normalize.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **.streamCompletion()** (6 connections) — `src/server/llm/qwen.ts`
- **Global Constraints** (5 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **망 종류 지식과 망연계 예상 Implementation Plan** (5 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **diagrams** (4 connections) — `src/db/schema.ts`
- **flows** (4 connections) — `src/db/schema.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **ChatMessage** (4 connections) — `src/server/llm/qwen.ts`
- **POST()** (3 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **complete()** (3 connections) — `src/server/explain.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
- **.getOwnedDiagram()** (3 connections) — `src/server/flowSuggest.ts`
- **.listFlows()** (3 connections) — `src/server/flowSuggest.ts`
- **resolveDeps()** (3 connections) — `src/server/flowSuggest.ts`
- **flattenAttr()** (2 connections) — `src/server/chat/normalize.ts`
- **isPlainObject()** (2 connections) — `src/server/chat/normalize.ts`
- **normalizeId()** (2 connections) — `src/server/chat/normalize.ts`
- *... and 26 more nodes in this community*

## Relationships

- [mcp/apply.ts](mcp-apply.ts.md) (9 shared connections)
- [clef.ts](clef.ts.md) (8 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (7 shared connections)
- [schema.ts](schema.ts.md) (6 shared connections)
- [pipeline.ts](pipeline.ts.md) (5 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (3 shared connections)
- [projects.ts](projects.ts.md) (3 shared connections)
- [useFlows](useFlows.md) (3 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (3 shared connections)
- [createJsonlParser](createJsonlParser.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- `src/db/schema.ts`
- `src/server/chat/normalize.ts`
- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 133 (90%)
- INFERRED: 15 (10%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*