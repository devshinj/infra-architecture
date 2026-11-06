---
title: "pipeline.ts"
sidebar_position: 18
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 30 nodes · cohesion 0.11

## Key Concepts

- **pipeline.ts** (92 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (33 connections) — `src/server/chat/pipeline.ts`
- **MessageMeta** (12 connections) — `src/server/chat/events.ts`
- **Warning** (11 connections) — `src/domain/types.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **isFlowCommand()** (7 connections) — `src/domain/commands.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **isStructural()** (5 connections) — `src/domain/commands.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **SkipTally** (5 connections) — `src/server/chat/skips.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
- **AI_UNAVAILABLE_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_FETCH** (2 connections) — `src/server/chat/pipeline.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- **prunedOrder()** (2 connections) — `src/server/chat/pipeline.ts`
- **.counts()** (2 connections) — `src/server/chat/skips.ts`
- **partialTagLen()** (2 connections) — `src/server/llm/think.ts`
- **HISTORY_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **KNOWN_OPS** (1 connections) — `src/server/chat/pipeline.ts`
- **LAYOUT_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **MAX_CONTINUATIONS** (1 connections) — `src/server/chat/pipeline.ts`
- *... and 5 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (22 shared connections)
- [projects.ts](projects.ts.md) (19 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (15 shared connections)
- [ask/route.ts](ask-route.ts.md) (11 shared connections)
- [missing.ts](missing.ts.md) (10 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (7 shared connections)
- [samples.ts](samples.ts.md) (6 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (5 shared connections)
- [commands.ts](commands.ts.md) (5 shared connections)
- [types.ts](types.ts.md) (4 shared connections)
- [Review Focus](Review_Focus.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/domain/commands.ts`
- `src/domain/types.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 169 (95%)
- INFERRED: 8 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*