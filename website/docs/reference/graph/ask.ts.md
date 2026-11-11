---
title: "ask.ts"
sidebar_position: 25
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 29 nodes · cohesion 0.15

## Key Concepts

- **ask.ts** (56 connections) — `src/server/chat/ask.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **askInSession()** (13 connections) — `src/server/chat/ask.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **createSession()** (8 connections) — `src/server/chat/sessions.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **AI_UNAVAILABLE_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
- *... and 4 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (24 shared connections)
- [ask/route.ts](ask-route.ts.md) (17 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (13 shared connections)
- [sessions.ts](sessions.ts.md) (7 shared connections)
- [prompt.ts](prompt.ts.md) (5 shared connections)
- [\[diagramId\]/page.tsx]([diagramId]-page.tsx.md) (5 shared connections)
- [clef.ts](clef.ts.md) (4 shared connections)
- [projects.ts](projects.ts.md) (4 shared connections)
- [server/network.ts](server-network.ts.md) (4 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (3 shared connections)
- [missing.ts](missing.ts.md) (3 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 167 (94%)
- INFERRED: 10 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*