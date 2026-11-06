---
title: "pipeline.ts"
sidebar_position: 10
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 35 nodes · cohesion 0.10

## Key Concepts

- **pipeline.ts** (94 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (35 connections) — `src/server/chat/pipeline.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **BUSY_MESSAGE** (8 connections) — `src/server/chat/busy.ts`
- **isFlowCommand()** (7 connections) — `src/domain/commands.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **parseCommand()** (6 connections) — `src/domain/commands.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **isStructural()** (5 connections) — `src/domain/commands.ts`
- **toFlowOp()** (5 connections) — `src/domain/commands.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **SkipTally** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **busy.ts** (4 connections) — `src/server/chat/busy.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **asksStepText()** (3 connections) — `src/domain/flows.ts`
- **keepStepText()** (3 connections) — `src/domain/flows.ts`
- **clefOpenItems()** (3 connections) — `src/server/chat/intent.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- **prunedOrder()** (2 connections) — `src/server/chat/pipeline.ts`
- *... and 10 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (22 shared connections)
- [ask/route.ts](ask-route.ts.md) (15 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (12 shared connections)
- [createJsonlParser](createJsonlParser.md) (7 shared connections)
- [apply.ts](apply.ts.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (6 shared connections)
- [commands.ts](commands.ts.md) (6 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (6 shared connections)
- [types.ts](types.ts.md) (6 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (6 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (5 shared connections)
- [MissingChecklist.tsx](MissingChecklist.tsx.md) (5 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/server/chat/busy.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/clef.ts`

## Audit Trail

- EXTRACTED: 185 (97%)
- INFERRED: 5 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*