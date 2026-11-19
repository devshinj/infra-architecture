---
title: "ask/route.ts"
sidebar_position: 32
---
# ask/route.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 29 nodes · cohesion 0.12

## Key Concepts

- **auth** (34 connections) — `src/auth.ts`
- **ask/route.ts** (31 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **chat/route.ts** (28 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **defaultChatDeps()** (13 connections) — `src/server/chat/deps.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **POST()** (8 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **stream.ts** (8 connections) — `src/server/chat/stream.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **streamTurn()** (6 connections) — `src/server/chat/stream.ts`
- **GENERIC_ERROR_MESSAGE** (5 connections) — `src/server/chat/pipeline.ts`
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
- *... and 4 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (25 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (14 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (8 shared connections)
- [deps.ts](deps.ts.md) (7 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (7 shared connections)
- [NotFoundError](NotFoundError.md) (5 shared connections)
- [explain/route.ts](explain-route.ts.md) (5 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (4 shared connections)
- [Shell.tsx](Shell.tsx.md) (4 shared connections)
- [server/network.ts](server-network.ts.md) (3 shared connections)
- [auth.ts](auth.ts.md) (3 shared connections)
- [ResetPasswordForm.tsx](ResetPasswordForm.tsx.md) (2 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/ask/route.ts`
- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/auth.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/deps.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/stream.ts`

## Audit Trail

- EXTRACTED: 152 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*