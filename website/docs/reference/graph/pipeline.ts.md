---
title: "pipeline.ts"
sidebar_position: 24
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 30 nodes · cohesion 0.09

## Key Concepts

- **pipeline.ts** (115 connections) — `src/server/chat/pipeline.ts`
- **clef.ts** (23 connections) — `src/server/llm/clef.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **ClefClient** (8 connections) — `src/server/llm/clef.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **clefOpenItems()** (3 connections) — `src/server/chat/intent.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- **EXPLAIN_SCORE_QUESTION** (2 connections) — `src/server/llm/clef.ts`
- **INTENT_MIN_CONFIDENCE** (2 connections) — `src/server/llm/clef.ts`
- **HISTORY_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **KNOWN_OPS** (1 connections) — `src/server/chat/pipeline.ts`
- **LAYOUT_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **MAX_CONTINUATIONS** (1 connections) — `src/server/chat/pipeline.ts`
- **TIMEOUT_MESSAGE** (1 connections) — `src/server/chat/pipeline.ts`
- **SkipKind** (1 connections) — `src/server/chat/skips.ts`
- **ClefAnswer** (1 connections) — `src/server/llm/clef.ts`
- **ClefAnswers** (1 connections) — `src/server/llm/clef.ts`
- **.classifyIntent()** (1 connections) — `src/server/llm/clef.ts`
- *... and 5 more nodes in this community*

## Relationships

- [mcp/apply.ts](mcp-apply.ts.md) (21 shared connections)
- [ask.ts](ask.ts.md) (15 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (11 shared connections)
- [ask/route.ts](ask-route.ts.md) (10 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (9 shared connections)
- [\[diagramId\]/page.tsx]([diagramId]-page.tsx.md) (8 shared connections)
- [types.ts](types.ts.md) (7 shared connections)
- [samples.ts](samples.ts.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (5 shared connections)
- [createJsonlParser](createJsonlParser.md) (4 shared connections)
- [deps.ts](deps.ts.md) (4 shared connections)
- [Task 5: MCP 고치기·되돌리기 서비스](Task_5-_MCP_고치기·되돌리기_서비스.md) (4 shared connections)

## Source Files

- `src/domain/assumptions.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/skips.ts`
- `src/server/llm/clef.ts`

## Audit Trail

- EXTRACTED: 174 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*