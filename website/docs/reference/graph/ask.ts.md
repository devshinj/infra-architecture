---
title: "ask.ts"
sidebar_position: 35
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 19 nodes · cohesion 0.20

## Key Concepts

- **ask.ts** (54 connections) — `src/server/chat/ask.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **askInSession()** (12 connections) — `src/server/chat/ask.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **AI_UNAVAILABLE_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_FETCH** (2 connections) — `src/server/chat/pipeline.ts`
- **partialTagLen()** (2 connections) — `src/server/llm/think.ts`
- **HANDOFF_REPLY** (1 connections) — `src/server/chat/ask.ts`

## Relationships

- [(app)/actions.ts](app-actions.ts.md) (18 shared connections)
- [pipeline.ts](pipeline.ts.md) (14 shared connections)
- [ask/route.ts](ask-route.ts.md) (12 shared connections)
- [getSession](getSession.md) (7 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (5 shared connections)
- [clef.ts](clef.ts.md) (5 shared connections)
- [auth](auth.md) (4 shared connections)
- [missing.ts](missing.ts.md) (3 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (3 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (3 shared connections)
- [Review Focus](Review_Focus.md) (2 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/server/chat/ask.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 114 (93%)
- INFERRED: 9 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*