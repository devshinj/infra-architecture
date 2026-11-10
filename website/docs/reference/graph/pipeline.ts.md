---
title: "pipeline.ts"
sidebar_position: 20
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 31 nodes · cohesion 0.13

## Key Concepts

- **pipeline.ts** (108 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (38 connections) — `src/server/chat/pipeline.ts`
- **parseCommand()** (13 connections) — `src/domain/commands.ts`
- **isFlowCommand()** (9 connections) — `src/domain/commands.ts`
- **checkCommands()** (9 connections) — `src/server/mcp/apply.ts`
- **isStructural()** (8 connections) — `src/domain/commands.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **toFlowOp()** (7 connections) — `src/domain/commands.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **splitFlowSteps()** (6 connections) — `src/domain/linkGuess.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **keepStepText()** (4 connections) — `src/domain/flows.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **asksStepText()** (3 connections) — `src/domain/flows.ts`
- **clefOpenItems()** (3 connections) — `src/server/chat/intent.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`
- *... and 6 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (22 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (15 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (13 shared connections)
- [ask/route.ts](ask-route.ts.md) (12 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (8 shared connections)
- [commands.ts](commands.ts.md) (7 shared connections)
- [createJsonlParser](createJsonlParser.md) (7 shared connections)
- [normalize.ts](normalize.ts.md) (6 shared connections)
- [edgeCoalesce.ts](edgeCoalesce.ts.md) (6 shared connections)
- [auth](auth.md) (6 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (5 shared connections)
- [Review Focus](Review_Focus.md) (5 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/mcp/apply.ts`

## Audit Trail

- EXTRACTED: 205 (94%)
- INFERRED: 13 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*