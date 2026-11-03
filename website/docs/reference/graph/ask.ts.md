---
title: "ask.ts"
sidebar_position: 10
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 29 nodes · cohesion 0.13

## Key Concepts

- **ask.ts** (52 connections) — `src/server/chat/ask.ts`
- **[sessionId]/route.ts** (17 connections) — `src/app/api/diagrams/[id]/sessions/[sessionId]/route.ts`
- **events.ts** (16 connections) — `src/server/chat/events.ts`
- **messages.ts** (16 connections) — `src/server/chat/messages.ts`
- **sessions.ts** (16 connections) — `src/server/chat/sessions.ts`
- **MessageMeta** (12 connections) — `src/server/chat/events.ts`
- **listMessages()** (12 connections) — `src/server/chat/messages.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **lockedAsk()** (8 connections) — `src/server/chat/ask.ts`
- **getSession()** (7 connections) — `src/server/chat/sessions.ts`
- **cachedNodeExplanation()** (6 connections) — `src/server/explain.ts`
- **GET()** (5 connections) — `src/app/api/diagrams/[id]/sessions/[sessionId]/route.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **NODE_GONE_MESSAGE** (4 connections) — `src/server/chat/events.ts`
- **createSession()** (4 connections) — `src/server/chat/sessions.ts`
- **touchSession()** (4 connections) — `src/server/chat/sessions.ts`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **chatSessions** (2 connections) — `src/db/schema.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **AI_UNAVAILABLE_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_FETCH** (2 connections) — `src/server/chat/pipeline.ts`
- **SessionRow** (2 connections) — `src/server/chat/sessions.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/sessions/[sessionId]/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/sessions/[sessionId]/route.ts`
- *... and 4 more nodes in this community*

## Relationships

- [(app)/actions.ts](app-actions.ts.md) (28 shared connections)
- [pipeline.ts](pipeline.ts.md) (25 shared connections)
- [ask/route.ts](ask-route.ts.md) (13 shared connections)
- [schema.ts](schema.ts.md) (13 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (4 shared connections)
- [createThinkStripper](createThinkStripper.md) (3 shared connections)
- [auth](auth.md) (3 shared connections)
- [types.ts](types.ts.md) (3 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (3 shared connections)
- [useSessions.ts](useSessions.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/app/api/diagrams/[id]/sessions/[sessionId]/route.ts`
- `src/db/schema.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`
- `src/server/explain.ts`

## Audit Trail

- EXTRACTED: 160 (94%)
- INFERRED: 10 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*