---
title: "ask.ts"
sidebar_position: 20
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 22 nodes · cohesion 0.17

## Key Concepts

- **ask.ts** (52 connections) — `src/server/chat/ask.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **askInSession()** (12 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **lockedAsk()** (8 connections) — `src/server/chat/ask.ts`
- **intent.ts** (8 connections) — `src/server/chat/intent.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **createSession()** (4 connections) — `src/server/chat/sessions.ts`
- **touchSession()** (4 connections) — `src/server/chat/sessions.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **AI_UNAVAILABLE_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_FETCH** (2 connections) — `src/server/chat/pipeline.ts`
- **SessionRow** (2 connections) — `src/server/chat/sessions.ts`
- **INTENT_MIN_CONFIDENCE** (2 connections) — `src/server/llm/clef.ts`
- **HANDOFF_REPLY** (1 connections) — `src/server/chat/ask.ts`

## Relationships

- [pipeline.ts](pipeline.ts.md) (21 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (18 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (8 shared connections)
- [ask/route.ts](ask-route.ts.md) (8 shared connections)
- [schema.ts](schema.ts.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (6 shared connections)
- [MissingChecklist.tsx](MissingChecklist.tsx.md) (5 shared connections)
- [clef.ts](clef.ts.md) (5 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (4 shared connections)
- [Review Focus](Review_Focus.md) (2 shared connections)
- [경고 규칙과 점검](경고_규칙과_점검.md) (2 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/domain/assumptions.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`
- `src/server/llm/clef.ts`

## Audit Trail

- EXTRACTED: 115 (92%)
- INFERRED: 10 (8%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*