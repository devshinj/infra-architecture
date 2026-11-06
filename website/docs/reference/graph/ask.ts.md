---
title: "ask.ts"
sidebar_position: 34
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 20 nodes · cohesion 0.22

## Key Concepts

- **ask.ts** (54 connections) — `src/server/chat/ask.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **askInSession()** (12 connections) — `src/server/chat/ask.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`
- **HANDOFF_REPLY** (1 connections) — `src/server/chat/ask.ts`

## Relationships

- [pipeline.ts](pipeline.ts.md) (22 shared connections)
- [projects.ts](projects.ts.md) (20 shared connections)
- [ask/route.ts](ask-route.ts.md) (19 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (15 shared connections)
- [missing.ts](missing.ts.md) (8 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (3 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (3 shared connections)
- [Review Focus](Review_Focus.md) (3 shared connections)
- [types.ts](types.ts.md) (2 shared connections)
- [auth](auth.md) (1 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (1 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`

## Audit Trail

- EXTRACTED: 141 (97%)
- INFERRED: 4 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*