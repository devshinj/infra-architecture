---
title: "pipeline.ts"
sidebar_position: 5
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 56 nodes · cohesion 0.08

## Key Concepts

- **pipeline.ts** (127 connections) — `src/server/chat/pipeline.ts`
- **ask.ts** (60 connections) — `src/server/chat/ask.ts`
- **lockedTurn()** (46 connections) — `src/server/chat/pipeline.ts`
- **domain/assumptions.ts** (19 connections) — `src/domain/assumptions.ts`
- **askInSession()** (14 connections) — `src/server/chat/ask.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **lockedAsk()** (11 connections) — `src/server/chat/ask.ts`
- **matchUserTerms()** (11 connections) — `src/server/glossary.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **buildAskMessages()** (7 connections) — `src/server/chat/prompt.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **SESSION_GONE_MESSAGE** (5 connections) — `src/server/chat/events.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- *... and 31 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (32 shared connections)
- [ask/route.ts](ask-route.ts.md) (25 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (21 shared connections)
- [clarify.ts](clarify.ts.md) (14 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (14 shared connections)
- [commands.ts](commands.ts.md) (12 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (10 shared connections)
- [prompt.ts](prompt.ts.md) (10 shared connections)
- [diff.ts](diff.ts.md) (8 shared connections)
- [missing.ts](missing.ts.md) (8 shared connections)
- [server/network.ts](server-network.ts.md) (7 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (6 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/warnings.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/lock.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/skips.ts`
- `src/server/glossary.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 352 (96%)
- INFERRED: 13 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*