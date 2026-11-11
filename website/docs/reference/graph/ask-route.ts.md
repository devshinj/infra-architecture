---
title: "ask/route.ts"
sidebar_position: 23
---
# ask/route.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 30 nodes · cohesion 0.10

## Key Concepts

- **ask/route.ts** (31 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **chat/route.ts** (28 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **POST()** (8 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **stream.ts** (8 connections) — `src/server/chat/stream.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **streamTurn()** (6 connections) — `src/server/chat/stream.ts`
- **SESSION_GONE_MESSAGE** (5 connections) — `src/server/chat/events.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **src_server_chat_pipeline_busy_message** (4 connections)
- **ChatTurnResult** (3 connections) — `src/server/chat/pipeline.ts`
- **json()** (2 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **AskTurnResult** (2 connections) — `src/server/chat/ask.ts`
- **ChatSessionTarget** (2 connections) — `src/server/chat/pipeline.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`
- **line()** (2 connections) — `src/server/chat/stream.ts`
- **BodySchema** (1 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **maxDuration** (1 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **BodySchema** (1 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- *... and 5 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (16 shared connections)
- [pipeline.ts](pipeline.ts.md) (10 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (8 shared connections)
- [\[diagramId\]/page.tsx]([diagramId]-page.tsx.md) (8 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (8 shared connections)
- [auth](auth.md) (6 shared connections)
- [3C-1 계획 작업 목록](3C-1_계획_작업_목록.md) (4 shared connections)
- [auth.ts](auth.ts.md) (4 shared connections)
- [NotFoundError](NotFoundError.md) (3 shared connections)
- [server/network.ts](server-network.ts.md) (3 shared connections)
- [projects.ts](projects.ts.md) (2 shared connections)
- [env.ts](env.ts.md) (2 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/ask/route.ts`
- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/stream.ts`

## Audit Trail

- EXTRACTED: 122 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*