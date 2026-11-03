---
title: "pipeline.ts"
sidebar_position: 5
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 46 nodes · cohesion 0.11

## Key Concepts

- **pipeline.ts** (70 connections) — `src/server/chat/pipeline.ts`
- **ask.ts** (52 connections) — `src/server/chat/ask.ts`
- **lockedTurn()** (26 connections) — `src/server/chat/pipeline.ts`
- **events.ts** (16 connections) — `src/server/chat/events.ts`
- **messages.ts** (16 connections) — `src/server/chat/messages.ts`
- **askInSession()** (12 connections) — `src/server/chat/ask.ts`
- **MessageMeta** (12 connections) — `src/server/chat/events.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **runChatTurn()** (9 connections) — `src/server/chat/pipeline.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **lockedAsk()** (8 connections) — `src/server/chat/ask.ts`
- **intent.ts** (8 connections) — `src/server/chat/intent.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **.emit()** (6 connections) — `src/server/chat/pipeline.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- **NODE_GONE_MESSAGE** (4 connections) — `src/server/chat/events.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- *... and 21 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (21 shared connections)
- [ask/route.ts](ask-route.ts.md) (18 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (13 shared connections)
- [schema.ts](schema.ts.md) (12 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (12 shared connections)
- [prompt.ts](prompt.ts.md) (10 shared connections)
- [명령 적용과 샘플](명령_적용과_샘플.md) (10 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (7 shared connections)
- [missing.ts](missing.ts.md) (6 shared connections)
- [display.ts](display.ts.md) (5 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (5 shared connections)
- [clef.ts](clef.ts.md) (5 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/skips.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 248 (96%)
- INFERRED: 9 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*