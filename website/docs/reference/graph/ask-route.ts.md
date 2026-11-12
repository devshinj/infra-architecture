---
title: "ask/route.ts"
sidebar_position: 15
---
# ask/route.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 37 nodes · cohesion 0.09

## Key Concepts

- **ask/route.ts** (31 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **chat/route.ts** (28 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **POST()** (8 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **stream.ts** (8 connections) — `src/server/chat/stream.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **streamTurn()** (6 connections) — `src/server/chat/stream.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **SESSION_GONE_MESSAGE** (5 connections) — `src/server/chat/events.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **NODE_GONE_MESSAGE** (4 connections) — `src/server/chat/events.ts`
- **src_server_chat_pipeline_busy_message** (4 connections)
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **ChatTurnResult** (3 connections) — `src/server/chat/pipeline.ts`
- **json()** (2 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **AskTurnResult** (2 connections) — `src/server/chat/ask.ts`
- **ChatSessionTarget** (2 connections) — `src/server/chat/pipeline.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`
- *... and 12 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (29 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (23 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (12 shared connections)
- [ValidationError](ValidationError.md) (8 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (7 shared connections)
- [clef.ts](clef.ts.md) (6 shared connections)
- [ResetPasswordForm.tsx](ResetPasswordForm.tsx.md) (2 shared connections)
- [projects.ts](projects.ts.md) (2 shared connections)
- [auth.ts](auth.ts.md) (2 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (1 shared connections)
- [ChatPanel.tsx](ChatPanel.tsx.md) (1 shared connections)
- [InfraSketch 설계 문서](InfraSketch_설계_문서.md) (1 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/ask/route.ts`
- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/stream.ts`

## Audit Trail

- EXTRACTED: 151 (98%)
- INFERRED: 3 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*