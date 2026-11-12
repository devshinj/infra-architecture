---
title: "ask/route.ts"
sidebar_position: 9
---
# ask/route.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 41 nodes · cohesion 0.08

## Key Concepts

- **NotFoundError** (36 connections) — `src/server/projects.ts`
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
- **Task 5: DB와 서버 — 망 지식 테이블, 기본 제공 채우기, 읽기·고치기** (5 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **SESSION_GONE_MESSAGE** (5 connections) — `src/server/chat/events.ts`
- **GENERIC_ERROR_MESSAGE** (5 connections) — `src/server/chat/pipeline.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **NODE_GONE_MESSAGE** (4 connections) — `src/server/chat/events.ts`
- **src_server_chat_pipeline_busy_message** (4 connections)
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **ChatTurnResult** (3 connections) — `src/server/chat/pipeline.ts`
- **json()** (2 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- *... and 16 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (36 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (18 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (16 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (7 shared connections)
- [env.ts](env.ts.md) (6 shared connections)
- [NetworkKnowledgePage.tsx](NetworkKnowledgePage.tsx.md) (5 shared connections)
- [projects.ts](projects.ts.md) (5 shared connections)
- [server/flows.ts](server-flows.ts.md) (4 shared connections)
- [server/network.ts](server-network.ts.md) (4 shared connections)
- [read.ts](read.ts.md) (3 shared connections)
- [Review Focus](Review_Focus.md) (2 shared connections)
- [ResetPasswordForm.tsx](ResetPasswordForm.tsx.md) (2 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `src/app/api/diagrams/[id]/ask/route.ts`
- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/stream.ts`
- `src/server/projects.ts`

## Audit Trail

- EXTRACTED: 182 (94%)
- INFERRED: 11 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*