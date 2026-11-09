---
title: "pipeline.ts"
sidebar_position: 21
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 26 nodes · cohesion 0.11

## Key Concepts

- **pipeline.ts** (110 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (41 connections) — `src/server/chat/pipeline.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **restoreVersion()** (6 connections) — `src/server/versions.ts`
- **restoreVersionWithMessage()** (6 connections) — `src/server/versions.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **SkipTally** (5 connections) — `src/server/chat/skips.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **4. 도구** (3 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **clefOpenItems()** (3 connections) — `src/server/chat/intent.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
- **AI_UNAVAILABLE_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
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
- *... and 1 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (31 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (20 shared connections)
- [server/flows.ts](server-flows.ts.md) (12 shared connections)
- [domain/linkGuess.ts](domain-linkGuess.ts.md) (8 shared connections)
- [commands.ts](commands.ts.md) (7 shared connections)
- [DiagramState](DiagramState.md) (6 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (6 shared connections)
- [apply.ts](apply.ts.md) (5 shared connections)
- [useSessions.ts](useSessions.ts.md) (4 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [edgeCoalesce.ts](edgeCoalesce.ts.md) (4 shared connections)

## Source Files

- `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- `src/server/chat/intent.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/versions.ts`

## Audit Trail

- EXTRACTED: 176 (99%)
- INFERRED: 2 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*