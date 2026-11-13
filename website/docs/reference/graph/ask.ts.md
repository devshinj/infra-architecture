---
title: "ask.ts"
sidebar_position: 42
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 23 nodes · cohesion 0.17

## Key Concepts

- **ask.ts** (60 connections) — `src/server/chat/ask.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **lockedAsk()** (11 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **createSession()** (8 connections) — `src/server/chat/sessions.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **buildAskMessages()** (7 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **foldTitle()** (4 connections) — `src/server/chat/sessions.ts`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **USER_TURN_LOCK_WAIT_MS** (3 connections) — `src/server/chat/lock.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **labelOf()** (2 connections) — `src/server/chat/ask.ts`
- **AI_UNAVAILABLE_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_FETCH** (2 connections) — `src/server/chat/pipeline.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`
- **HANDOFF_REPLY** (1 connections) — `src/server/chat/ask.ts`

## Relationships

- [pipeline.ts](pipeline.ts.md) (24 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (16 shared connections)
- [ask/route.ts](ask-route.ts.md) (15 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (14 shared connections)
- [server/network.ts](server-network.ts.md) (8 shared connections)
- [prompt.ts](prompt.ts.md) (6 shared connections)
- [schema.ts](schema.ts.md) (5 shared connections)
- [clef.ts](clef.ts.md) (5 shared connections)
- [createJsonlParser](createJsonlParser.md) (3 shared connections)
- [Review Focus](Review_Focus.md) (2 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (2 shared connections)
- [missing.ts](missing.ts.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/lock.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`

## Audit Trail

- EXTRACTED: 142 (93%)
- INFERRED: 10 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*