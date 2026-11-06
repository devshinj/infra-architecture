---
title: "ask/route.ts"
sidebar_position: 6
---
# ask/route.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 37 nodes · cohesion 0.09

## Key Concepts

- **ask/route.ts** (31 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **chat/route.ts** (28 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **NotFoundError** (24 connections) — `src/server/projects.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **ref_zod** (8 connections)
- **POST()** (8 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **stream.ts** (8 connections) — `src/server/chat/stream.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **streamTurn()** (6 connections) — `src/server/chat/stream.ts`
- **GENERIC_ERROR_MESSAGE** (5 connections) — `src/server/chat/pipeline.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **NODE_GONE_MESSAGE** (4 connections) — `src/server/chat/events.ts`
- **src_server_chat_pipeline_busy_message** (4 connections)
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **ChatTurnResult** (3 connections) — `src/server/chat/pipeline.ts`
- **json()** (2 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **AskTurnResult** (2 connections) — `src/server/chat/ask.ts`
- **ChatSessionTarget** (2 connections) — `src/server/chat/pipeline.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`
- **line()** (2 connections) — `src/server/chat/stream.ts`
- *... and 12 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (25 shared connections)
- [pipeline.ts](pipeline.ts.md) (15 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (14 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (14 shared connections)
- [auth](auth.md) (9 shared connections)
- [projects.ts](projects.ts.md) (6 shared connections)
- [deps.ts](deps.ts.md) (6 shared connections)
- [ref_react](ref_react.md) (5 shared connections)
- [explain/route.ts](explain-route.ts.md) (2 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (2 shared connections)
- [useFlows](useFlows.md) (2 shared connections)
- [GlossaryPage.tsx](GlossaryPage.tsx.md) (2 shared connections)

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

- EXTRACTED: 167 (98%)
- INFERRED: 3 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*