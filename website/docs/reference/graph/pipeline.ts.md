---
title: "pipeline.ts"
sidebar_position: 38
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 29 nodes · cohesion 0.15

## Key Concepts

- **ask.ts** (62 connections) — `src/server/chat/ask.ts`
- **runChatTurn()** (17 connections) — `src/server/chat/pipeline.ts`
- **runAskTurn()** (15 connections) — `src/server/chat/ask.ts`
- **askInSession()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **ChatEvent** (13 connections) — `src/server/chat/events.ts`
- **lockedAsk()** (11 connections) — `src/server/chat/ask.ts`
- **matchUserTerms()** (11 connections) — `src/server/glossary.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **createSession()** (8 connections) — `src/server/chat/sessions.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **buildAskMessages()** (7 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **withUserTurnSlot()** (6 connections) — `src/server/chat/userTurns.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **glossaryBlock()** (4 connections) — `src/domain/glossaryMatch.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **한 차례의 흐름 (`src/server/guide/`)** (3 connections) — `docs/superpowers/specs/2026-11-19-learning-mode-design.md`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **labelOf()** (2 connections) — `src/server/chat/ask.ts`
- *... and 4 more nodes in this community*

## Relationships

- [clarify.ts](clarify.ts.md) (21 shared connections)
- [ask/route.ts](ask-route.ts.md) (16 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (13 shared connections)
- [sessions.ts](sessions.ts.md) (10 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (7 shared connections)
- [ValidationError](ValidationError.md) (7 shared connections)
- [prompt.ts](prompt.ts.md) (6 shared connections)
- [turn.ts](turn.ts.md) (6 shared connections)
- [events.ts](events.ts.md) (5 shared connections)
- [clef.ts](clef.ts.md) (5 shared connections)
- [createJsonlParser](createJsonlParser.md) (4 shared connections)
- [Review Focus](Review_Focus.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `docs/superpowers/specs/2026-11-19-learning-mode-design.md`
- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/domain/glossaryMatch.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/userTurns.ts`
- `src/server/glossary.ts`

## Audit Trail

- EXTRACTED: 177 (91%)
- INFERRED: 17 (9%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*