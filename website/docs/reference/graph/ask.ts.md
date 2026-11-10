---
title: "ask.ts"
sidebar_position: 41
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 21 nodes · cohesion 0.18

## Key Concepts

- **ask.ts** (56 connections) — `src/server/chat/ask.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **askInSession()** (13 connections) — `src/server/chat/ask.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **cachedNodeExplanation()** (6 connections) — `src/server/explain.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **ChatTurnResult** (3 connections) — `src/server/chat/pipeline.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **AI_UNAVAILABLE_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_FETCH** (2 connections) — `src/server/chat/pipeline.ts`
- **HANDOFF_REPLY** (1 connections) — `src/server/chat/ask.ts`

## Relationships

- [pipeline.ts](pipeline.ts.md) (22 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (16 shared connections)
- [ask/route.ts](ask-route.ts.md) (16 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (9 shared connections)
- [prompt.ts](prompt.ts.md) (6 shared connections)
- [missing.ts](missing.ts.md) (5 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (5 shared connections)
- [createJsonlParser](createJsonlParser.md) (4 shared connections)
- [auth](auth.md) (4 shared connections)
- [clef.ts](clef.ts.md) (4 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (3 shared connections)
- [projects.ts](projects.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/domain/assumptions.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/explain.ts`
- `src/server/llm/clef.ts`

## Audit Trail

- EXTRACTED: 132 (93%)
- INFERRED: 10 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*