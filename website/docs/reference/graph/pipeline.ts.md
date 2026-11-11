---
title: "pipeline.ts"
sidebar_position: 3
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 84 nodes · cohesion 0.06

## Key Concepts

- **pipeline.ts** (115 connections) — `src/server/chat/pipeline.ts`
- **ask.ts** (57 connections) — `src/server/chat/ask.ts`
- **lockedTurn()** (40 connections) — `src/server/chat/pipeline.ts`
- **ask/route.ts** (31 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **chat/route.ts** (28 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **events.ts** (27 connections) — `src/server/chat/events.ts`
- **computeMissing()** (26 connections) — `src/domain/missing.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **askInSession()** (13 connections) — `src/server/chat/ask.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **sessionPayload()** (11 connections) — `src/server/chat/events.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **POST()** (8 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **createSession()** (8 connections) — `src/server/chat/sessions.ts`
- **stream.ts** (8 connections) — `src/server/chat/stream.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- *... and 59 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (41 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (36 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (35 shared connections)
- [schema.ts](schema.ts.md) (16 shared connections)
- [prompt.ts](prompt.ts.md) (13 shared connections)
- [types.ts](types.ts.md) (11 shared connections)
- [deps.ts](deps.ts.md) (10 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (8 shared connections)
- [server/network.ts](server-network.ts.md) (8 shared connections)
- [clef.ts](clef.ts.md) (8 shared connections)
- [lines.ts](lines.ts.md) (7 shared connections)
- [auth](auth.md) (6 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/app/api/diagrams/[id]/ask/route.ts`
- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/missing.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/lock.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/skips.ts`
- `src/server/chat/stream.ts`
- `src/server/flowSuggest.ts`

## Audit Trail

- EXTRACTED: 444 (95%)
- INFERRED: 21 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*