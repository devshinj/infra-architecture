---
title: "pipeline.ts"
sidebar_position: 22
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 30 nodes · cohesion 0.09

## Key Concepts

- **pipeline.ts** (108 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (38 connections) — `src/server/chat/pipeline.ts`
- **buildMessages()** (9 connections) — `src/server/chat/prompt.ts`
- **Global Constraints** (6 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **summarizeState()** (5 connections) — `src/server/chat/prompt.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **SkipTally** (5 connections) — `src/server/chat/skips.ts`
- **Task 1: 망 영역·망연계 노드·연결 전달물/방향** (4 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **Claude Code 연동(MCP 서버) Implementation Plan** (4 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **keepStepText()** (4 connections) — `src/domain/flows.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **SERVER_ONLY_OPS** (3 connections) — `src/domain/commands.ts`
- **asksStepText()** (3 connections) — `src/domain/flows.ts`
- **clefOpenItems()** (3 connections) — `src/server/chat/intent.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- **.counts()** (2 connections) — `src/server/chat/skips.ts`
- **2026-11-09-mcp-server.md** (1 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **Review Focus** (1 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **HISTORY_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **KNOWN_OPS** (1 connections) — `src/server/chat/pipeline.ts`
- **LAYOUT_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **MAX_CONTINUATIONS** (1 connections) — `src/server/chat/pipeline.ts`
- *... and 5 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (24 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (20 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (11 shared connections)
- [domain/linkGuess.ts](domain-linkGuess.ts.md) (9 shared connections)
- [ask/route.ts](ask-route.ts.md) (7 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (6 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (6 shared connections)
- [edgeCoalesce.ts](edgeCoalesce.ts.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (6 shared connections)
- [apply.ts](apply.ts.md) (4 shared connections)
- [clef.ts](clef.ts.md) (4 shared connections)
- [missing.ts](missing.ts.md) (4 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `docs/superpowers/plans/2026-11-09-mcp-server.md`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`

## Audit Trail

- EXTRACTED: 172 (94%)
- INFERRED: 11 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*