---
title: "ask.ts"
sidebar_position: 37
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 21 nodes · cohesion 0.18

## Key Concepts

- **ask.ts** (56 connections) — `src/server/chat/ask.ts`
- **[diagramId]/page.tsx** (21 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **messages.ts** (16 connections) — `src/server/chat/messages.ts`
- **askInSession()** (13 connections) — `src/server/chat/ask.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **getNetworkKnowledge()** (13 connections) — `src/server/network.ts`
- **Warning** (12 connections) — `src/domain/types.ts`
- **MessageMeta** (12 connections) — `src/server/chat/events.ts`
- **listMessages()** (12 connections) — `src/server/chat/messages.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **DiagramPage()** (9 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **AI_UNAVAILABLE_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_FETCH** (2 connections) — `src/server/chat/pipeline.ts`
- **HANDOFF_REPLY** (1 connections) — `src/server/chat/ask.ts`

## Relationships

- [pipeline.ts](pipeline.ts.md) (24 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (14 shared connections)
- [types.ts](types.ts.md) (13 shared connections)
- [runAskTurn](runAskTurn.md) (12 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (12 shared connections)
- [ask/route.ts](ask-route.ts.md) (11 shared connections)
- [server/network.ts](server-network.ts.md) (8 shared connections)
- [prompt.ts](prompt.ts.md) (6 shared connections)
- [projects.ts](projects.ts.md) (5 shared connections)
- [createJsonlParser](createJsonlParser.md) (4 shared connections)
- [ref_react](ref_react.md) (4 shared connections)
- [missing.ts](missing.ts.md) (4 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- `src/domain/assumptions.ts`
- `src/domain/types.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/llm/clef.ts`
- `src/server/network.ts`

## Audit Trail

- EXTRACTED: 179 (93%)
- INFERRED: 13 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*