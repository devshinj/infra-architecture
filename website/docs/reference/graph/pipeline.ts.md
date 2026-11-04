---
title: "pipeline.ts"
sidebar_position: 15
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 27 nodes · cohesion 0.11

## Key Concepts

- **pipeline.ts** (84 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (28 connections) — `src/server/chat/pipeline.ts`
- **ClefClient** (8 connections) — `src/server/llm/clef.ts`
- **QwenClient** (7 connections) — `src/server/llm/qwen.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **SkipTally** (5 connections) — `src/server/chat/skips.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **isStructural()** (3 connections) — `src/domain/commands.ts`
- **parseCommand()** (3 connections) — `src/domain/commands.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **ExplainDeps** (3 connections) — `src/server/explain.ts`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
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
- *... and 2 more nodes in this community*

## Relationships

- [(app)/actions.ts](app-actions.ts.md) (15 shared connections)
- [ask.ts](ask.ts.md) (14 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (10 shared connections)
- [samples.ts](samples.ts.md) (9 shared connections)
- [ask/route.ts](ask-route.ts.md) (8 shared connections)
- [getSession](getSession.md) (7 shared connections)
- [clef.ts](clef.ts.md) (6 shared connections)
- [auth](auth.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [deps.ts](deps.ts.md) (4 shared connections)
- [missing.ts](missing.ts.md) (3 shared connections)
- [normalize.ts](normalize.ts.md) (3 shared connections)

## Source Files

- `src/domain/commands.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/explain.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 139 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*