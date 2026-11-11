---
title: "ask/route.ts"
sidebar_position: 30
---
# ask/route.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 28 nodes · cohesion 0.11

## Key Concepts

- **ask/route.ts** (31 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **chat/route.ts** (28 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **deps.ts** (14 connections) — `src/server/chat/deps.ts`
- **defaultChatDeps()** (13 connections) — `src/server/chat/deps.ts`
- **POST()** (8 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **stream.ts** (8 connections) — `src/server/chat/stream.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **streamTurn()** (6 connections) — `src/server/chat/stream.ts`
- **GENERIC_ERROR_MESSAGE** (5 connections) — `src/server/chat/pipeline.ts`
- **NODE_GONE_MESSAGE** (4 connections) — `src/server/chat/events.ts`
- **src_server_chat_pipeline_busy_message** (4 connections)
- **resolveDeps()** (3 connections) — `src/server/explain.ts`
- **resolveDeps()** (3 connections) — `src/server/flowSuggest.ts`
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
- *... and 3 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (22 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (8 shared connections)
- [auth](auth.md) (4 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (4 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (4 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (4 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (3 shared connections)
- [env.ts](env.ts.md) (3 shared connections)
- [deps.ts](deps.ts.md) (3 shared connections)
- [DiagramState](DiagramState.md) (3 shared connections)
- [server/network.ts](server-network.ts.md) (2 shared connections)
- [ref_react](ref_react.md) (2 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/ask/route.ts`
- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/deps.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/stream.ts`
- `src/server/explain.ts`
- `src/server/flowSuggest.ts`

## Audit Trail

- EXTRACTED: 112 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*