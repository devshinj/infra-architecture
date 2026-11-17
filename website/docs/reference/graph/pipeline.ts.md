---
title: "pipeline.ts"
sidebar_position: 8
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 44 nodes · cohesion 0.08

## Key Concepts

- **pipeline.ts** (127 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (46 connections) — `src/server/chat/pipeline.ts`
- **parseCommand()** (13 connections) — `src/domain/commands.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **isFlowCommand()** (11 connections) — `src/domain/commands.ts`
- **checkCommands()** (9 connections) — `src/server/mcp/apply.ts`
- **isStructural()** (8 connections) — `src/domain/commands.ts`
- **toFlowOp()** (7 connections) — `src/domain/commands.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **Global Constraints** (6 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **splitFlowSteps()** (6 connections) — `src/domain/linkGuess.ts`
- **MissingItem** (6 connections) — `src/domain/missing.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **SkipTally** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **Claude Code 연동(MCP 서버) Implementation Plan** (4 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **keepStepText()** (4 connections) — `src/domain/flows.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **asksStepText()** (3 connections) — `src/domain/flows.ts`
- **clefOpenItems()** (3 connections) — `src/server/chat/intent.ts`
- **USER_TURN_LOCK_WAIT_MS** (3 connections) — `src/server/chat/lock.ts`
- *... and 19 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (21 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (18 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (16 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (12 shared connections)
- [clarify.ts](clarify.ts.md) (12 shared connections)
- [ask/route.ts](ask-route.ts.md) (12 shared connections)
- [commands.ts](commands.ts.md) (9 shared connections)
- [prompt.ts](prompt.ts.md) (8 shared connections)
- [auth](auth.md) (8 shared connections)
- [Command](Command.md) (7 shared connections)
- [missing.ts](missing.ts.md) (7 shared connections)
- [createJsonlParser](createJsonlParser.md) (7 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `docs/superpowers/plans/2026-11-09-mcp-server.md`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/domain/missing.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/lock.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/llm/clef.ts`
- `src/server/mcp/apply.ts`

## Audit Trail

- EXTRACTED: 254 (94%)
- INFERRED: 16 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*