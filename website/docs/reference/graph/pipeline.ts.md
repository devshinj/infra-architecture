---
title: "pipeline.ts"
sidebar_position: 9
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 33 nodes · cohesion 0.10

## Key Concepts

- **pipeline.ts** (91 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (32 connections) — `src/server/chat/pipeline.ts`
- **intent.ts** (8 connections) — `src/server/chat/intent.ts`
- **ClefClient** (8 connections) — `src/server/llm/clef.ts`
- **isFlowCommand()** (7 connections) — `src/domain/commands.ts`
- **buildMessages()** (7 connections) — `src/server/chat/prompt.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **isStructural()** (5 connections) — `src/domain/commands.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **SkipTally** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
- **AI_UNAVAILABLE_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_FETCH** (2 connections) — `src/server/chat/pipeline.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- **prunedOrder()** (2 connections) — `src/server/chat/pipeline.ts`
- **.counts()** (2 connections) — `src/server/chat/skips.ts`
- **HISTORY_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **KNOWN_OPS** (1 connections) — `src/server/chat/pipeline.ts`
- *... and 8 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (22 shared connections)
- [prompt.ts](prompt.ts.md) (13 shared connections)
- [commands.ts](commands.ts.md) (9 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (9 shared connections)
- [ask/route.ts](ask-route.ts.md) (8 shared connections)
- [getSession](getSession.md) (7 shared connections)
- [samples.ts](samples.ts.md) (6 shared connections)
- [types.ts](types.ts.md) (6 shared connections)
- [clef.ts](clef.ts.md) (5 shared connections)
- [server/flows.ts](server-flows.ts.md) (5 shared connections)
- [missing.ts](missing.ts.md) (4 shared connections)
- [auth](auth.md) (4 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/llm/clef.ts`

## Audit Trail

- EXTRACTED: 168 (97%)
- INFERRED: 5 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*