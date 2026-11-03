---
title: "pipeline.ts"
sidebar_position: 22
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 24 nodes · cohesion 0.12

## Key Concepts

- **pipeline.ts** (84 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (28 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **SkipTally** (5 connections) — `src/server/chat/skips.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **isStructural()** (3 connections) — `src/domain/commands.ts`
- **parseCommand()** (3 connections) — `src/domain/commands.ts`
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
- **LAYOUT_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **MAX_CONTINUATIONS** (1 connections) — `src/server/chat/pipeline.ts`
- **TIMEOUT_MESSAGE** (1 connections) — `src/server/chat/pipeline.ts`
- **SkipKind** (1 connections) — `src/server/chat/skips.ts`
- **.add()** (1 connections) — `src/server/chat/skips.ts`
- **.samples()** (1 connections) — `src/server/chat/skips.ts`
- **.total()** (1 connections) — `src/server/chat/skips.ts`

## Relationships

- [ask.ts](ask.ts.md) (25 shared connections)
- [ask/route.ts](ask-route.ts.md) (11 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (9 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (6 shared connections)
- [clef.ts](clef.ts.md) (5 shared connections)
- [apply.ts](apply.ts.md) (5 shared connections)
- [deps.ts](deps.ts.md) (5 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (4 shared connections)
- [missing.ts](missing.ts.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [schema.ts](schema.ts.md) (4 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (3 shared connections)

## Source Files

- `src/domain/commands.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`

## Audit Trail

- EXTRACTED: 125 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*