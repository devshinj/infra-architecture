---
title: "ask.ts"
sidebar_position: 4
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 54 nodes · cohesion 0.08

## Key Concepts

- **ask.ts** (56 connections) — `src/server/chat/ask.ts`
- **ask/route.ts** (31 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **chat/route.ts** (28 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **askInSession()** (13 connections) — `src/server/chat/ask.ts`
- **getNetworkKnowledge()** (13 connections) — `src/server/network.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **sessionPayload()** (11 connections) — `src/server/chat/events.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **POST()** (8 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **createSession()** (8 connections) — `src/server/chat/sessions.ts`
- **stream.ts** (8 connections) — `src/server/chat/stream.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **streamTurn()** (6 connections) — `src/server/chat/stream.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **SESSION_GONE_MESSAGE** (5 connections) — `src/server/chat/events.ts`
- **GENERIC_ERROR_MESSAGE** (5 connections) — `src/server/chat/pipeline.ts`
- *... and 29 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (31 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (28 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (19 shared connections)
- [auth](auth.md) (14 shared connections)
- [useSessions.ts](useSessions.ts.md) (10 shared connections)
- [projects.ts](projects.ts.md) (8 shared connections)
- [deps.ts](deps.ts.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (5 shared connections)
- [DiagramState](DiagramState.md) (5 shared connections)
- [missing.ts](missing.ts.md) (4 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (3 shared connections)
- [server/network.ts](server-network.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/app/api/diagrams/[id]/ask/route.ts`
- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/stream.ts`
- `src/server/llm/think.ts`
- `src/server/network.ts`

## Audit Trail

- EXTRACTED: 247 (94%)
- INFERRED: 16 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*