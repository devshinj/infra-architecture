---
title: "pipeline.ts"
sidebar_position: 17
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 32 nodes · cohesion 0.12

## Key Concepts

- **pipeline.ts** (114 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (40 connections) — `src/server/chat/pipeline.ts`
- **parseCommand()** (13 connections) — `src/domain/commands.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **buildMessages()** (11 connections) — `src/server/chat/prompt.ts`
- **isFlowCommand()** (9 connections) — `src/domain/commands.ts`
- **checkCommands()** (9 connections) — `src/server/mcp/apply.ts`
- **isStructural()** (8 connections) — `src/domain/commands.ts`
- **toFlowOp()** (7 connections) — `src/domain/commands.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **Global Constraints** (6 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **keepStepText()** (4 connections) — `src/domain/flows.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **createFlowRetarget()** (3 connections) — `src/domain/commands.ts`
- **asksStepText()** (3 connections) — `src/domain/flows.ts`
- **clefOpenItems()** (3 connections) — `src/server/chat/intent.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- *... and 7 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (18 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (16 shared connections)
- [commands.ts](commands.ts.md) (14 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (13 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (10 shared connections)
- [ask/route.ts](ask-route.ts.md) (10 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (7 shared connections)
- [createJsonlParser](createJsonlParser.md) (7 shared connections)
- [prompt.ts](prompt.ts.md) (7 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (6 shared connections)
- [Review Focus](Review_Focus.md) (5 shared connections)
- [\[diagramId\]/page.tsx]([diagramId]-page.tsx.md) (5 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `docs/superpowers/plans/2026-11-09-mcp-server.md`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/clef.ts`
- `src/server/mcp/apply.ts`

## Audit Trail

- EXTRACTED: 220 (93%)
- INFERRED: 16 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*