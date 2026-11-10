---
title: "ask/route.ts"
sidebar_position: 27
---
# ask/route.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 29 nodes · cohesion 0.12

## Key Concepts

- **NotFoundError** (36 connections) — `src/server/projects.ts`
- **ask/route.ts** (31 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **chat/route.ts** (28 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **events.ts** (24 connections) — `src/server/chat/events.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **POST()** (8 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **stream.ts** (8 connections) — `src/server/chat/stream.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **streamTurn()** (6 connections) — `src/server/chat/stream.ts`
- **SESSION_GONE_MESSAGE** (5 connections) — `src/server/chat/events.ts`
- **NODE_GONE_MESSAGE** (4 connections) — `src/server/chat/events.ts`
- **src_server_chat_pipeline_busy_message** (4 connections)
- **json()** (2 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **AskTurnResult** (2 connections) — `src/server/chat/ask.ts`
- **ChatSessionTarget** (2 connections) — `src/server/chat/pipeline.ts`
- **line()** (2 connections) — `src/server/chat/stream.ts`
- **BodySchema** (1 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **maxDuration** (1 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **BodySchema** (1 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **maxDuration** (1 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- *... and 4 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (16 shared connections)
- [auth](auth.md) (14 shared connections)
- [pipeline.ts](pipeline.ts.md) (12 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (10 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (10 shared connections)
- [projects.ts](projects.ts.md) (8 shared connections)
- [deps.ts](deps.ts.md) (6 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (6 shared connections)
- [ref_react](ref_react.md) (4 shared connections)
- [server/flows.ts](server-flows.ts.md) (4 shared connections)
- [server/network.ts](server-network.ts.md) (4 shared connections)
- [read.ts](read.ts.md) (3 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/ask/route.ts`
- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/stream.ts`
- `src/server/projects.ts`

## Audit Trail

- EXTRACTED: 155 (97%)
- INFERRED: 5 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*