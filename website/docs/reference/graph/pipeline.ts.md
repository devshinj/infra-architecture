---
title: "pipeline.ts"
sidebar_position: 14
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 27 nodes · cohesion 0.15

## Key Concepts

- **pipeline.ts** (70 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (26 connections) — `src/server/chat/pipeline.ts`
- **computeMissing()** (16 connections) — `src/domain/missing.ts`
- **askInSession()** (12 connections) — `src/server/chat/ask.ts`
- **runChatTurn()** (9 connections) — `src/server/chat/pipeline.ts`
- **intent.ts** (8 connections) — `src/server/chat/intent.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **.emit()** (6 connections) — `src/server/chat/pipeline.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **parseCommand()** (3 connections) — `src/domain/commands.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- **prunedOrder()** (2 connections) — `src/server/chat/pipeline.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **KNOWN_OPS** (1 connections) — `src/server/chat/pipeline.ts`
- **LAYOUT_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- *... and 2 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (25 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (16 shared connections)
- [명령 적용과 샘플](명령_적용과_샘플.md) (8 shared connections)
- [ask/route.ts](ask-route.ts.md) (8 shared connections)
- [prompt.ts](prompt.ts.md) (7 shared connections)
- [createThinkStripper](createThinkStripper.md) (7 shared connections)
- [clef.ts](clef.ts.md) (5 shared connections)
- [types.ts](types.ts.md) (4 shared connections)
- [missing.ts](missing.ts.md) (4 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (4 shared connections)
- [deps.ts](deps.ts.md) (4 shared connections)
- [normalize.ts](normalize.ts.md) (3 shared connections)

## Source Files

- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/missing.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/llm/clef.ts`

## Audit Trail

- EXTRACTED: 159 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*