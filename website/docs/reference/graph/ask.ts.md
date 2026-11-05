---
title: "ask.ts"
sidebar_position: 37
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 21 nodes · cohesion 0.21

## Key Concepts

- **ask.ts** (54 connections) — `src/server/chat/ask.ts`
- **withDiagramLock()** (19 connections) — `src/server/chat/lock.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **askInSession()** (12 connections) — `src/server/chat/ask.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **lock.ts** (9 connections) — `src/server/chat/lock.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **createSession()** (8 connections) — `src/server/chat/sessions.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **partialTagLen()** (2 connections) — `src/server/llm/think.ts`
- **HANDOFF_REPLY** (1 connections) — `src/server/chat/ask.ts`

## Relationships

- [pipeline.ts](pipeline.ts.md) (22 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (11 shared connections)
- [prompt.ts](prompt.ts.md) (10 shared connections)
- [ask/route.ts](ask-route.ts.md) (10 shared connections)
- [getSession](getSession.md) (10 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (9 shared connections)
- [types.ts](types.ts.md) (6 shared connections)
- [schema.ts](schema.ts.md) (6 shared connections)
- [auth](auth.md) (4 shared connections)
- [Review Focus](Review_Focus.md) (3 shared connections)
- [missing.ts](missing.ts.md) (3 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/lock.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 141 (91%)
- INFERRED: 14 (9%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*